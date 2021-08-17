import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { nu64, struct, u8 } from 'buffer-layout';

export function addLiquidityInstructionV4(
  programId: PublicKey,
  // tokenProgramId: PublicKey,
  // amm
  ammId: PublicKey,
  ammAuthority: PublicKey,
  ammOpenOrders: PublicKey,
  ammTargetOrders: PublicKey,
  lpMintAddress: PublicKey,
  poolCoinTokenAccount: PublicKey,
  poolPcTokenAccount: PublicKey,
  // serum
  serumMarket: PublicKey,
  // user
  userCoinTokenAccount: PublicKey,
  userPcTokenAccount: PublicKey,
  userLpTokenAccount: PublicKey,
  userOwner: PublicKey,

  maxCoinAmount: number,
  maxPcAmount: number,
  fixedFromCoin: number,
): TransactionInstruction {
  const dataLayout = struct([
    u8('instruction'),
    nu64('maxCoinAmount'),
    nu64('maxPcAmount'),
    nu64('fixedFromCoin'),
  ]);

  const keys = [
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: true },
    { pubkey: ammId, isSigner: false, isWritable: true },
    { pubkey: ammAuthority, isSigner: false, isWritable: true },
    { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
    { pubkey: ammTargetOrders, isSigner: false, isWritable: true },
    { pubkey: lpMintAddress, isSigner: false, isWritable: true },
    { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
    { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
    { pubkey: serumMarket, isSigner: false, isWritable: true },
    { pubkey: userCoinTokenAccount, isSigner: false, isWritable: true },
    { pubkey: userPcTokenAccount, isSigner: false, isWritable: true },
    { pubkey: userLpTokenAccount, isSigner: false, isWritable: true },
    { pubkey: userOwner, isSigner: true, isWritable: true },
  ];

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 3,
      maxCoinAmount,
      maxPcAmount,
      fixedFromCoin,
    },
    data,
  );

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}
