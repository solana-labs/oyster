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
import { Token } from '@solana/spl-token';
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
  if (
    !request.asset ||
    !request.amount ||
    !request.recipient ||
    !request.toChain ||
    !request.info
  ) {
    return;
  }
  const walletName = 'MetaMask';
  const signer = provider?.getSigner();
  request.recipient = Buffer.from((await signer.getAddress()).slice(2), 'hex');
  const nonce = await provider.getTransactionCount(
    signer.getAddress(),
    'pending',
  );

  const amountBN = ethers.utils.parseUnits(
    request.amount.toString(),
    request.info.decimals,
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

      return steps.lock(request);
    },

    // locks assets in the bridge
    lock: async (request: TransferRequest) => {
      if (
        !request.amount ||
        !request.recipient ||
        !request.toChain ||
        !request.info ||
        !wallet.publicKey
      ) {
        return;
      }

      let group = 'Lock assets';
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
      return new Promise<void>((resolve, reject) => {
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

            // let signatures = await bridge.fetchSignatureStatus(
            //   lockup.signatureAccount,
            // );
            // let sigData = Buffer.of(
            //   ...signatures.reduce((previousValue, currentValue) => {
            //     previousValue.push(currentValue.index);
            //     previousValue.push(...currentValue.signature);

            //     return previousValue;
            //   }, new Array<number>()),
            // );

            // vaa = Buffer.concat([
            //   vaa.slice(0, 5),
            //   Buffer.of(signatures.length),
            //   sigData,
            //   vaa.slice(6),
            // ]);
            // transferVAA = vaa
            try {
              await steps.postVAA(request);
              resolve();
            } catch {
              reject();
            }
          },
          'single',
        );
      });
    },
    postVAA: async (request: TransferRequest) => {
      let wh = WormholeFactory.connect(programIds().wormhole.bridge, signer);

      // setLoading({
      //     ...loading,
      //     loading: true,
      //     message: "Sign the claim...",
      // })
      // let tx = await wh.submitVAA(vaa);
      // setLoading({
      //     ...loading,
      //     loading: true,
      //     message: "Waiting for tokens unlock to be mined...",
      // })
      // await tx.wait(1);
      // message.success({content: "Execution of VAA succeeded", key: "eth_tx"})
    },
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
