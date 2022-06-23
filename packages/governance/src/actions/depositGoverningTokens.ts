import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { models, TokenAccount } from '@oyster/common';
import { RpcContext, withDepositGoverningTokens } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import BN from 'bn.js';

const { approve } = models;

export const depositGoverningTokens = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  governingTokenSource: TokenAccount,
  governingTokenMint: PublicKey,
  amount: BN,
  vestingProgramId?: PublicKey,
  voterWeightRecord?: PublicKey,
  maxVoterWeightRecord?: PublicKey,
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Keypair[] = [];

  const transferAuthority = approve(
    instructions,
    [],
    governingTokenSource.pubkey,
    walletPubkey,
    amount,
  );

  signers.push((transferAuthority as any) as Keypair);

  await withDepositGoverningTokens(
    instructions,
    programId,
    programVersion,
    realm,
    governingTokenSource.pubkey,
    governingTokenMint,
    walletPubkey,
    transferAuthority.publicKey,
    walletPubkey,
    amount as BN,
    vestingProgramId,
    voterWeightRecord,
    maxVoterWeightRecord,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Depositing governing tokens',
    'Tokens have been deposited',
  );
};
