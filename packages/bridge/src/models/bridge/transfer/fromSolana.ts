import {
  programIds,
  WalletAdapter,
  getMultipleAccounts,
  sendTransaction,
  cache,
  TokenAccountParser,
  ParsedAccount,
  formatAmount,
  createAssociatedTokenAccountInstruction,
  toLamports,
} from '@oyster/common';
import { ethers } from 'ethers';
import { ASSET_CHAIN } from '../../../utils/assets';
import { BigNumber } from 'ethers/utils';
import { Erc20Factory } from '../../../contracts/Erc20Factory';
import { WormholeFactory } from '../../../contracts/WormholeFactory';
import { AssetMeta, createWrappedAssetInstruction } from './../meta';
import { bridgeAuthorityKey, wrappedAssetMintKey } from './../helpers';
import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import { AccountInfo, Token } from '@solana/spl-token';
import { ProgressUpdate, TransferRequest } from './interface';
import BN from 'bn.js';
import { createLockAssetInstruction } from '../lock';
import { TransferOutProposalLayout } from '../transferOutProposal';

export const fromSolana = async (
  connection: Connection,
  wallet: WalletAdapter,
  request: TransferRequest,
  provider: ethers.providers.Web3Provider,
  setProgress: (update: ProgressUpdate) => void,
) => {
  if (!request.asset) {
    return;
  }
  const walletName = 'MetaMask';
  request.signer = provider?.getSigner();

  request.nonce = await provider.getTransactionCount(
    request.signer.getAddress(),
    'pending',
  );

  let counter = 0;
  // check difference between lock/approve (invoke lock if allowance < amount)
  const steps = {
    transfer: async (request: TransferRequest) => {
      if (!request.info) {
        throw new Error('Missing info');
      }

      if (!request.amount) {
        throw new Error('Missing amount');
      }

      request.amountBN = ethers.utils.parseUnits(
        request.amount.toString(),
        request.info.decimals,
      );

      return steps.prepare(request);
    },

    // creates wrapped account on solana
    prepare: async (request: TransferRequest) => {
      if (!request.info || !request.from || !wallet.publicKey) {
        return;
      }

      const group = 'Initiate transfer';
      try {
        const bridgeId = programIds().wormhole.pubkey;
        const authority = await bridgeAuthorityKey(bridgeId);
        const meta: AssetMeta = {
          decimals: Math.min(request.info?.decimals, 9),
          address: request.info?.assetAddress,
          chain: request.from,
        };
        const mintKey = await wrappedAssetMintKey(bridgeId, authority, meta);

        const recipientKey =
          cache
            .byParser(TokenAccountParser)
            .map(key => {
              let account = cache.get(key) as ParsedAccount<AccountInfo>;
              if (account?.info.mint.toBase58() === mintKey.toBase58()) {
                return key;
              }

              return;
            })
            .find(_ => _) || '';
        const recipient: PublicKey = recipientKey
          ? new PublicKey(recipientKey)
          : (
              await PublicKey.findProgramAddress(
                [
                  wallet.publicKey.toBuffer(),
                  programIds().token.toBuffer(),
                  mintKey.toBuffer(),
                ],
                programIds().associatedToken,
              )
            )[0];

        request.recipient = recipient.toBuffer();

        const accounts = await getMultipleAccounts(
          connection,
          [mintKey.toBase58(), recipient.toBase58()],
          'single',
        );
        const instructions: TransactionInstruction[] = [];
        const signers: Account[] = [];

        if (!accounts.array[0]) {
          // create mint using wormhole instruction
          instructions.push(
            await createWrappedAssetInstruction(
              meta,
              bridgeId,
              authority,
              mintKey,
              wallet.publicKey,
            ),
          );
        }

        if (!accounts.array[1]) {
          createAssociatedTokenAccountInstruction(
            instructions,
            recipient,
            wallet.publicKey,
            wallet.publicKey,
            mintKey,
          );
        }

        if (instructions.length > 0) {
          setProgress({
            message: 'Waiting for Solana approval...',
            type: 'user',
            group,
            step: counter++,
          });

          const { txid } = await sendTransaction(
            connection,
            wallet,
            instructions,
            signers,
            true,
          );
        }
      } catch (err) {
        setProgress({
          message: `Couldn't create Solana account!`,
          type: 'error',
          group,
          step: counter++,
        });
        throw err;
      }

      return steps.lock(request);
    },

    // locks assets in the bridge
    lock: async (request: TransferRequest) => {
      if (
        !request.amount ||
        !request.asset ||
        !request.signer ||
        !request.recipient ||
        !request.toChain ||
        !request.info ||
        !request.nonce ||
        !wallet.publicKey
      ) {
        return;
      }

      let group = 'Lock assets';
      let transferProposal: PublicKey;
      let transferVAA = new Uint8Array(0);

      const programs = programIds();
      const bridgeId = programs.wormhole.pubkey;
      const authorityKey = await bridgeAuthorityKey(bridgeId);

      const precision = Math.pow(10, request.info?.decimals || 0);
      const amount = Math.floor(request.amount * precision);

      let { ix: lock_ix, transferKey } = await createLockAssetInstruction(
        authorityKey,
        wallet.publicKey,
        new PublicKey(request.info.address),
        new PublicKey(request.info.mint),
        new BN(request.amount.toString()),
        request.toChain,
        request.recipient,
        {
          chain: request.info.chainID,
          address: request.info.assetAddress,
          decimals: request.info.decimals,
        },
        // TODO: should this is use durable nonce account?
        Math.random() * 100000,
      );

      let ix = Token.createApproveInstruction(
        programs.token,
        new PublicKey(request.info.address),
        authorityKey,
        wallet.publicKey,
        [],
        amount,
      );

      let fee_ix = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: authorityKey,
        lamports: await getTransferFee(connection),
      });

      const { slot } = await sendTransaction(
        connection,
        wallet,
        [ix, fee_ix, lock_ix],
        [],
        true,
      );

      return steps.wait(request, transferKey, slot);
    },
    wait: async (
      request: TransferRequest,
      proposalKey: PublicKey,
      slot: number,
    ) => {
      let completed = false;
      let startSlot = slot;

      let group = 'Lock assets';

      let slotUpdateListener = connection.onSlotChange(slot => {
        if (completed) return;
        const passedSlots = slot.slot - startSlot;
        const isLast = passedSlots - 1 === 31;
        if (passedSlots < 32) {
          // setLoading({
          //     loading: true,
          //     message: "Awaiting confirmations",
          //     progress: {
          //         completion: (slot.slot - startSlot) / 32 * 100,
          //         content: `${slot.slot - startSlot}/${32}`
          //     }
          // })
          // setProgress({
          //   message: ethConfirmationMessage(passedBlocks),
          //   type: isLast ? 'done' : 'wait',
          //   step: counter++,
          //   group,
          //   replace: passedBlocks > 0,
          // });
        } else {
          //setLoading({loading: true, message: "Awaiting guardian confirmation"})
        }
      });

      let accountChangeListener = connection.onAccountChange(
        proposalKey,
        async a => {
          if (completed) return;

          let lockup = TransferOutProposalLayout.decode(a.data);
          let vaa = lockup.vaa;

          for (let i = vaa.length; i > 0; i--) {
            if (vaa[i] == 0xff) {
              vaa = vaa.slice(0, i);
              break;
            }
          }

          // Probably a poke
          if (vaa.filter((v: number) => v !== 0).length == 0) {
            return;
          }

          completed = true;
          connection.removeAccountChangeListener(accountChangeListener);
          connection.removeSlotChangeListener(slotUpdateListener);

          // let signatures = await bridge.fetchSignatureStatus(lockup.signatureAccount);
          // let sigData = Buffer.of(...signatures.reduce((previousValue, currentValue) => {
          //     previousValue.push(currentValue.index)
          //     previousValue.push(...currentValue.signature)

          //     return previousValue
          // }, new Array<number>()))

          // vaa = Buffer.concat([vaa.slice(0, 5), Buffer.of(signatures.length), sigData, vaa.slice(6)])
          // transferVAA = vaa
        },
        'single',
      );
    },
    postVAA: async (request: TransferRequest) => {},
  };

  return steps.transfer(request);
};

const getTransferFee = async (connection: Connection) => {
  // claim + signature
  // Reference processor.rs::Bridge::transfer_fee
  return (
    (await connection.getMinimumBalanceForRentExemption((40 + 1340) * 2)) +
    18 * 10000 * 2
  );
};
