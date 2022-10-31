import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TokenAccount } from '@oyster/common';
import {
  createVestingAccount,
  RpcContext,
  withDepositGoverningTokens,
} from '@solana/spl-governance';
import BN from 'bn.js';
import { AccountLayout } from '@solana/spl-token';
import { sendTransactionWithNotifications } from '../tools/transactions';

export interface DepositGoverningTokenContext {
  realm: PublicKey;
  governingTokenSource: TokenAccount;
  governingTokenMint: PublicKey;
  depositableAmount: BN;
  instructions: TransactionInstruction[];
  vestingProgramId?: PublicKey;
  voterWeightRecord?: PublicKey;
  maxVoterWeightRecord?: PublicKey;
}

export const depositGoverningTokens = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  governanceContext: DepositGoverningTokenContext,
) => {
  const {
    realm,
    instructions,
    governingTokenSource,
    governingTokenMint,
    depositableAmount,
    vestingProgramId,
    voterWeightRecord,
    maxVoterWeightRecord,
  } = governanceContext;

  const signers: Keypair[] = [];

  // calculate size of new account
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  // create target address on which deposit will be transferred
  const {
    vestingTokenPubkey,
    vestingPubkey,
    vestingTokenKeypair,
  } = await createVestingAccount(
    instructions,
    vestingProgramId!,
    governingTokenMint,
    walletPubkey,
    accountRentExempt,
  );

  signers.push(vestingTokenKeypair);

  await withDepositGoverningTokens(
    instructions,
    vestingProgramId!, // programId,
    programVersion,
    realm,
    governingTokenSource.pubkey,
    governingTokenMint,
    walletPubkey,
    walletPubkey,
    depositableAmount as BN,
    vestingProgramId,
    voterWeightRecord,
    maxVoterWeightRecord,
    vestingTokenPubkey,
    vestingPubkey,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Depositing governing tokens',
    'Tokens have been deposited',
    accountRentExempt,
  );
};
