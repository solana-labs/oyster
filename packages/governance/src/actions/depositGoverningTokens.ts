import { Keypair, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TokenAccount } from '@oyster/common';
import {
  createVestingAccount,
  RpcContext,
  withDepositGoverningTokens,
} from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import BN from 'bn.js';
import { AccountLayout } from '@solana/spl-token';

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

  // calculate size of new account
  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  // create target address on which deposit will be transferred
  const { vestingToken, vestingOwnerPubkey } = await createVestingAccount(
    instructions,
    vestingProgramId || programId,
    governingTokenMint,
    walletPubkey,
    accountRentExempt,
  );

  signers.push(vestingToken);

  await withDepositGoverningTokens(
    instructions,
    programId,
    programVersion,
    realm,
    governingTokenSource.pubkey,
    governingTokenMint,
    walletPubkey,
    walletPubkey,
    amount as BN,
    vestingProgramId,
    voterWeightRecord,
    maxVoterWeightRecord,
    vestingToken.publicKey,
    vestingOwnerPubkey,
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
