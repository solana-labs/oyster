import {
  programIds,
  getMultipleAccounts,
  sendTransactionWithRetry,
  cache,
  TokenAccountParser,
  ParsedAccount,
  createAssociatedTokenAccountInstruction,
} from '@oyster/common';
import { ethers } from 'ethers';
import { ERC20Factory } from '../../contracts/ERC20Factory';
import { WormholeFactory } from '../../contracts/WormholeFactory';
import { AssetMeta, createWrappedAssetInstruction } from './../meta';
import { bridgeAuthorityKey, wrappedAssetMintKey } from './../helpers';
import {
  Account,
  Connection,
  PublicKey,
  TransactionInstruction,
} from '@solana/web3.js';
import { AccountInfo } from '@solana/spl-token';
import { TransferRequest, ProgressUpdate } from './interface';
import { WalletAdapter } from '@solana/wallet-base';
import { BigNumber } from 'bignumber.js';

export const toSolana = async (
  connection: Connection,
  wallet: WalletAdapter,
  request: TransferRequest,
  provider: ethers.providers.Web3Provider,
  setProgress: (update: ProgressUpdate) => void,
) => {
  if (
    !request.asset ||
    !request.amount ||
    !request.info ||
    !request.info.address
  ) {
    return;
  }
  const walletName = 'MetaMask';
  const signer = provider?.getSigner();

  const nonce = await provider.getTransactionCount(
    signer.getAddress(),
    'pending',
  );
  const amountBigNumber = new BigNumber(request.amount.toString()).toFormat(
    request.info.decimals,
  );

  const amountBN = ethers.utils.parseUnits(
    request.amount.toString(),
    request.info.decimals,
  );

  let counter = 0;
  // check difference between lock/approve (invoke lock if allowance < amount)
  const steps = {
    transfer: async (request: TransferRequest) => {
      if (!request.info || !request.amount) {
        return;
      }

      return steps.prepare(request);
    },

    // creates wrapped account on solana
    prepare: async (request: TransferRequest) => {
      if (!request.info || !request.from || !wallet.publicKey) {
        return;
      }

      const group = 'Initiate transfer';
      try {
        let mintKey: PublicKey;

        const bridgeId = programIds().wormhole.pubkey;
        const authority = await bridgeAuthorityKey(bridgeId);
        const meta: AssetMeta = {
          decimals: Math.min(request.info?.decimals, 9),
          address: request.info?.assetAddress,
          chain: request.from,
        };
        if (request.info.mint) {
          mintKey = new PublicKey(request.info.mint);
        } else {
          mintKey = await wrappedAssetMintKey(bridgeId, authority, meta);
        }

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

          await sendTransactionWithRetry(
            connection,
            wallet,
            instructions,
            signers,
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

      return steps.approve(request);
    },
    // approves assets for transfer
    approve: async (request: TransferRequest) => {
      if (!request.info?.address) {
        return;
      }

      const group = 'Approve assets';
      try {
        if (request.info?.allowance.lt(amountBN)) {
          let e = ERC20Factory.connect(request.info.address, signer);
          setProgress({
            message: `Waiting for ${walletName} approval`,
            type: 'user',
            group,
            step: counter++,
          });
          let res = await e.approve(programIds().wormhole.bridge, amountBN);
          setProgress({
            message:
              'Waiting for ETH transaction to be mined... (Up to few min.)',
            type: 'wait',
            group,
            step: counter++,
          });
          await res.wait(1);
          setProgress({
            message: 'Approval on ETH succeeded!',
            type: 'done',
            group,
            step: counter++,
          });
        } else {
          setProgress({
            message: 'Already approved on ETH!',
            type: 'done',
            group,
            step: counter++,
          });
        }
      } catch (err) {
        setProgress({
          message: 'Approval failed!',
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
        !amountBN ||
        !request.info?.address ||
        !request.recipient ||
        !request.to ||
        !request.info
      ) {
        return;
      }

      let group = 'Lock assets';

      try {
        let wh = WormholeFactory.connect(programIds().wormhole.bridge, signer);
        setProgress({
          message: `Waiting for ${walletName} transfer approval`,
          type: 'user',
          group,
          step: counter++,
        });
        let res = await wh.lockAssets(
          request.info.address,
          amountBN,
          request.recipient,
          request.to,
          nonce,
          false,
        );
        setProgress({
          message:
            'Waiting for ETH transaction to be mined... (Up to few min.)',
          type: 'wait',
          group,
          step: counter++,
        });
        await res.wait(1);
        setProgress({
          message: 'Transfer on ETH succeeded!',
          type: 'done',
          group,
          step: counter++,
        });
      } catch (err) {
        setProgress({
          message: 'Transfer failed!',
          type: 'error',
          group,
          step: counter++,
        });
        throw err;
      }

      return steps.wait(request);
    },
    wait: async (request: TransferRequest) => {
      let startBlock = provider.blockNumber;
      let completed = false;
      let group = 'Finalizing transfer';

      const ethConfirmationMessage = (current: number) =>
        `Awaiting ETH confirmations: ${current} out of 15`;

      setProgress({
        message: ethConfirmationMessage(0),
        type: 'wait',
        step: counter++,
        group,
      });

      let blockHandler = (blockNumber: number) => {
        let passedBlocks = blockNumber - startBlock;
        const isLast = passedBlocks === 14;
        if (passedBlocks < 15) {
          setProgress({
            message: ethConfirmationMessage(passedBlocks),
            type: isLast ? 'done' : 'wait',
            step: counter++,
            group,
            replace: passedBlocks > 0,
          });

          if (isLast) {
            setProgress({
              message: 'Awaiting completion on Solana...',
              type: 'wait',
              group,
              step: counter++,
            });
          }
        } else if (!completed) {
          provider.removeListener('block', blockHandler);
        }
      };
      provider.on('block', blockHandler);

      return new Promise<void>((resolve, reject) => {
        if (!request.recipient) {
          return;
        }

        let accountChangeListener = connection.onAccountChange(
          new PublicKey(request.recipient),
          () => {
            if (completed) return;

            completed = true;
            provider.removeListener('block', blockHandler);
            connection.removeAccountChangeListener(accountChangeListener);
            setProgress({
              message: 'Transfer completed on Solana',
              type: 'info',
              group,
              step: counter++,
            });
            resolve();
          },
          'single',
        );
      });
    },
  };

  return steps.transfer(request);
};
