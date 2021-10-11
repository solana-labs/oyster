import React, { useState } from 'react';
import {
  cache,
  ConnectButton,
  createAssociatedTokenAccountInstruction,
  ExplorerLink,
  getMultipleAccounts,
  ParsedAccount,
  programIds,
  sendTransactionWithRetry,
  TokenAccountParser,
  useConnection,
  useWallet,
} from '@oyster/common';
import { PublicKey, TransactionInstruction, Account } from '@solana/web3.js';
import { AccountInfo } from '@solana/spl-token';

export const RenbtcDebugView = () => {
  const rentbtcMint = new PublicKey(
    'EK6iyvvqvQtsWYcySrZVHkXjCLX494r9PhnDWJaX1CPu',
  );
  const { wallet, connected } = useWallet();
  const connection = useConnection();
  const [ataa, setAtaa] = useState('');
  const [exists, setExists] = useState(false);
  return (
    <>
      <div
        id={'debug-renbtc'}
        className="flexColumn transfer-bg"
        style={{ flex: 1, minHeight: '90vh' }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            marginTop: 200,
            justifyContent: 'space-between',
            minHeight: 410,
            maxWidth: 500,
            margin: 'auto',
          }}
        >
          <ConnectButton />
          <span id={'mint-key'}>
            renBTC MintKey --{' '}
            <ExplorerLink address={rentbtcMint} type={'address'} />
          </span>
          <span id={'wallet-key'}>
            Wallet Address -- {wallet?.publicKey?.toBase58()}
          </span>
          <button
            style={{
              background: 'rgb(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={async () => {
              if (!connected) {
                alert('connect wallet');
                return;
              }
              const recipientKey =
                cache
                  .byParser(TokenAccountParser)
                  .map(key => {
                    let account = cache.get(key) as ParsedAccount<AccountInfo>;
                    if (
                      account?.info.mint.toBase58() === rentbtcMint.toBase58()
                    ) {
                      return key;
                    }

                    return;
                  })
                  .find(_ => _) || '';

              if (recipientKey) {
                setAtaa(recipientKey);
                setExists(true);
                return;
              }
              const recipient: PublicKey = recipientKey
                ? new PublicKey(recipientKey)
                : (
                    await PublicKey.findProgramAddress(
                      [
                        // @ts-ignore
                        wallet.publicKey.toBuffer(),
                        programIds().token.toBuffer(),
                        rentbtcMint.toBuffer(),
                      ],
                      programIds().associatedToken,
                    )
                  )[0];

              setAtaa(recipient.toBase58());
              setExists(false);
            }}
          >
            Show generated associated token account address
          </button>
          <span id={'acc-key'}>
            {ataa} : {exists ? 'Already Created' : 'Not created yet'}
          </span>

          <button
            style={{
              background: 'rgb(255,255,255,0.1)',
              color: 'white',
              cursor: 'pointer',
            }}
            onClick={async () => {
              if (!connected) {
                alert('connect wallet');
                return;
              }

              const instructions: TransactionInstruction[] = [];
              const signers: Account[] = [];
              const recipientKey =
                cache
                  .byParser(TokenAccountParser)
                  .map(key => {
                    let account = cache.get(key) as ParsedAccount<AccountInfo>;
                    if (
                      account?.info.mint.toBase58() === rentbtcMint.toBase58()
                    ) {
                      return key;
                    }

                    return;
                  })
                  .find(_ => _) || '';

              if (recipientKey) {
                setAtaa(recipientKey);
                setExists(true);
                return;
              }
              const recipient: PublicKey = recipientKey
                ? new PublicKey(recipientKey)
                : (
                    await PublicKey.findProgramAddress(
                      [
                        // @ts-ignore
                        wallet.publicKey.toBuffer(),
                        programIds().token.toBuffer(),
                        rentbtcMint.toBuffer(),
                      ],
                      programIds().associatedToken,
                    )
                  )[0];
              if (!exists) {
                createAssociatedTokenAccountInstruction(
                  instructions,
                  recipient, // @ts-ignore
                  wallet.publicKey, // @ts-ignore
                  wallet.publicKey,
                  rentbtcMint,
                );
              } else {
                alert('associated account already created');
              }

              if (instructions.length > 0) {
                try {
                  await sendTransactionWithRetry(
                    connection,
                    wallet,
                    instructions,
                    signers,
                  );
                } catch (e) {
                  console.log(e);
                }
              }
            }}
          >
            create associated token account address
          </button>
        </div>
      </div>
    </>
  );
};
