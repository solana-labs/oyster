import {
  programIds,
  sendTransactionWithRetry,
  sleep,
  WalletSigner,
} from '@oyster/common';
import { ethers } from 'ethers';
import { WormholeFactory } from '../../contracts/WormholeFactory';
import { bridgeAuthorityKey } from './../helpers';
import { Connection, PublicKey, SystemProgram } from '@solana/web3.js';
import { Token } from '@solana/spl-token';
import { ProgressUpdate, TransferRequest } from './interface';
import BN from 'bn.js';
import { createLockAssetInstruction } from '../lock';
import { TransferOutProposalLayout } from '../transferOutProposal';
import { SolanaBridge } from '../../core';

export const fromSolana = async (
  connection: Connection,
  wallet: WalletSigner,
  request: TransferRequest,
  provider: ethers.providers.Web3Provider,
  setProgress: (update: ProgressUpdate) => void,
  bridge?: SolanaBridge,
) => {
  if (
    !request.asset ||
    !request.amount ||
    !request.to ||
    !request.info ||
    !bridge
  ) {
    return;
  }
  const signer = provider?.getSigner();
  request.recipient = Buffer.from((await signer.getAddress()).slice(2), 'hex');
  const nonce = await provider.getTransactionCount(
    signer.getAddress(),
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

      return steps.lock(request);
    },

    // locks assets in the bridge
    lock: async (request: TransferRequest) => {
      if (
        !request.amount ||
        !request.recipient ||
        !request.to ||
        !request.info ||
        !wallet.publicKey
      ) {
        return;
      }

      let group = 'Initiate transfer';
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
        new BN(amount),
        request.to,
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

      setProgress({
        message: 'Waiting for Solana approval...',
        type: 'user',
        group,
        step: counter++,
      });
      let fee_ix = SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: authorityKey,
        lamports: await getTransferFee(connection),
      });

      const { slot } = await sendTransactionWithRetry(
        connection,
        wallet,
        [ix, fee_ix, lock_ix],
        [],
        undefined,
        false,
        undefined,
        () => {
          setProgress({
            message: 'Executing Solana Transaction',
            type: 'wait',
            group,
            step: counter++,
          });
        },
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
        let unsubscribed = false;
        let startSlot = slot;

        let group = 'Lock assets';
        const solConfirmationMessage = (current: number) =>
          `Awaiting Solana confirmations: ${current} out of 32`;
        let replaceMessage = false;
        let slotUpdateListener = connection.onSlotChange(slot => {
          if (unsubscribed) {
            return;
          }

          const passedSlots = Math.min(Math.max(slot.slot - startSlot, 0), 32);
          const isLast = passedSlots - 1 === 31;
          if (passedSlots <= 32) {
            setProgress({
              message: solConfirmationMessage(passedSlots),
              type: isLast ? 'done' : 'wait',
              step: counter++,
              group,
              replace: replaceMessage,
            });
            replaceMessage = true;
          }

          if (completed || isLast) {
            unsubscribed = true;
            setProgress({
              message: 'Awaiting guardian confirmation. (Up to few min.)',
              type: 'wait',
              step: counter++,
              group,
            });
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
            let signatures;

            while (!signatures) {
              try {
                signatures = await bridge.fetchSignatureStatus(
                  lockup.signatureAccount,
                );
                break;
              } catch {
                await sleep(500);
              }
            }

            let sigData = Buffer.of(
              ...signatures.reduce((previousValue, currentValue) => {
                previousValue.push(currentValue.index);
                previousValue.push(...currentValue.signature);

                return previousValue;
              }, new Array<number>()),
            );

            vaa = Buffer.concat([
              vaa.slice(0, 5),
              Buffer.of(signatures.length),
              sigData,
              vaa.slice(6),
            ]);

            try {
              await steps.postVAA(request, vaa);
              resolve();
            } catch {
              reject();
            }
          },
          'single',
        );
      });
    },
    postVAA: async (request: TransferRequest, vaa: any) => {
      let wh = WormholeFactory.connect(programIds().wormhole.bridge, signer);
      let group = 'Finalizing transfer';
      setProgress({
        message: 'Sign the claim...',
        type: 'wait',
        group,
        step: counter++,
      });
      let tx = await wh.submitVAA(vaa);
      setProgress({
        message: 'Waiting for tokens unlock to be mined... (Up to few min.)',
        type: 'wait',
        group,
        step: counter++,
      });
      await tx.wait(1);
      setProgress({
        message: 'Execution of VAA succeeded',
        type: 'done',
        group,
        step: counter++,
      });
      //message.success({content: "", key: "eth_tx"})
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
