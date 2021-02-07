import { Account, PublicKey, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import { LENDING_PROGRAM_ID } from '@packages/common/utils/ids';
import { LendingObligationLayout } from '../models';

export function createUninitializedObligation(
  instructions: TransactionInstruction[],
  payer: PublicKey,
  amount: number,
  signers: Account[]
) {
  const account = new Account();
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: account.publicKey,
      lamports: amount,
      space: LendingObligationLayout.span,
      programId: LENDING_PROGRAM_ID,
    })
  );

  signers.push(account);

  return account.publicKey;
}
