import { AccountInfo, PublicKey, TransactionInstruction } from "@solana/web3.js";

import { AccountInfo as TokenAccountInfo, Token } from "@solana/spl-token";
import { TOKEN_PROGRAM_ID } from "../constants";

export interface TokenAccount {
  pubkey: PublicKey;
  account: AccountInfo<Buffer>;
  info: TokenAccountInfo;
}

export function approve(
  instructions: TransactionInstruction[],
  cleanupInstructions: TransactionInstruction[],
  account: PublicKey,
  delegate: PublicKey,
  owner: PublicKey,
  amount: number,
): void {
  const tokenProgram = TOKEN_PROGRAM_ID;
  instructions.push(
    Token.createApproveInstruction(
      tokenProgram,
      account,
      delegate,
      owner,
      [],
      amount
    )
  );

  cleanupInstructions.push(
    Token.createRevokeInstruction(
      tokenProgram,
      account,
      owner,
      []),
  );
}