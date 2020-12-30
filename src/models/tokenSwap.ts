import { Numberu64 } from '@solana/spl-token-swap';
import { PublicKey, Account, TransactionInstruction } from '@solana/web3.js';
import * as BufferLayout from 'buffer-layout';
import { programIds } from '../utils/ids';
import { publicKey, uint64 } from '../utils/layout';
import { CurveType, PoolConfig } from './pool';

export { TokenSwap } from '@solana/spl-token-swap';

const FEE_LAYOUT = BufferLayout.struct(
  [
    BufferLayout.nu64('tradeFeeNumerator'),
    BufferLayout.nu64('tradeFeeDenominator'),
    BufferLayout.nu64('ownerTradeFeeNumerator'),
    BufferLayout.nu64('ownerTradeFeeDenominator'),
    BufferLayout.nu64('ownerWithdrawFeeNumerator'),
    BufferLayout.nu64('ownerWithdrawFeeDenominator'),
    BufferLayout.nu64('hostFeeNumerator'),
    BufferLayout.nu64('hostFeeDenominator'),
  ],
  'fees'
);

export const TokenSwapLayoutLegacyV0 = BufferLayout.struct([
  BufferLayout.u8('isInitialized'),
  BufferLayout.u8('nonce'),
  publicKey('tokenAccountA'),
  publicKey('tokenAccountB'),
  publicKey('tokenPool'),
  uint64('feesNumerator'),
  uint64('feesDenominator'),
]);

export const TokenSwapLayoutV1: typeof BufferLayout.Structure = BufferLayout.struct([
  BufferLayout.u8('isInitialized'),
  BufferLayout.u8('nonce'),
  publicKey('tokenProgramId'),
  publicKey('tokenAccountA'),
  publicKey('tokenAccountB'),
  publicKey('tokenPool'),
  publicKey('mintA'),
  publicKey('mintB'),
  publicKey('feeAccount'),
  BufferLayout.u8('curveType'),
  uint64('tradeFeeNumerator'),
  uint64('tradeFeeDenominator'),
  uint64('ownerTradeFeeNumerator'),
  uint64('ownerTradeFeeDenominator'),
  uint64('ownerWithdrawFeeNumerator'),
  uint64('ownerWithdrawFeeDenominator'),
  BufferLayout.blob(16, 'padding'),
]);

const CURVE_NODE = BufferLayout.union(BufferLayout.u8(), BufferLayout.blob(32), 'curve');
CURVE_NODE.addVariant(0, BufferLayout.struct([]), 'constantProduct');
CURVE_NODE.addVariant(1, BufferLayout.struct([BufferLayout.nu64('token_b_price')]), 'constantPrice');
CURVE_NODE.addVariant(2, BufferLayout.struct([]), 'stable');
CURVE_NODE.addVariant(3, BufferLayout.struct([BufferLayout.nu64('token_b_offset')]), 'offset');

export const TokenSwapLayout: typeof BufferLayout.Structure = BufferLayout.struct([
  BufferLayout.u8('isInitialized'),
  BufferLayout.u8('nonce'),
  publicKey('tokenProgramId'),
  publicKey('tokenAccountA'),
  publicKey('tokenAccountB'),
  publicKey('tokenPool'),
  publicKey('mintA'),
  publicKey('mintB'),
  publicKey('feeAccount'),
  FEE_LAYOUT,
  CURVE_NODE,
]);

export const createInitSwapInstruction = (
  tokenSwapAccount: Account,
  authority: PublicKey,
  tokenAccountA: PublicKey,
  tokenAccountB: PublicKey,
  tokenPool: PublicKey,
  feeAccount: PublicKey,
  destinationAccount: PublicKey,
  tokenProgramId: PublicKey,
  swapProgramId: PublicKey,
  nonce: number,
  config: PoolConfig
): TransactionInstruction => {
  const keys = [
    { pubkey: tokenSwapAccount.publicKey, isSigner: false, isWritable: true },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: tokenAccountA, isSigner: false, isWritable: false },
    { pubkey: tokenAccountB, isSigner: false, isWritable: false },
    { pubkey: tokenPool, isSigner: false, isWritable: true },
    { pubkey: feeAccount, isSigner: false, isWritable: false },
    { pubkey: destinationAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];

  let data = Buffer.alloc(1024);
  {
    const isLatestLayout = programIds().swapLayout === TokenSwapLayout;
    if (isLatestLayout) {
      const fields = [
        BufferLayout.u8('instruction'),
        BufferLayout.u8('nonce'),
        BufferLayout.nu64('tradeFeeNumerator'),
        BufferLayout.nu64('tradeFeeDenominator'),
        BufferLayout.nu64('ownerTradeFeeNumerator'),
        BufferLayout.nu64('ownerTradeFeeDenominator'),
        BufferLayout.nu64('ownerWithdrawFeeNumerator'),
        BufferLayout.nu64('ownerWithdrawFeeDenominator'),
        BufferLayout.nu64('hostFeeNumerator'),
        BufferLayout.nu64('hostFeeDenominator'),
        BufferLayout.u8('curveType'),
      ];

      if (config.curveType === CurveType.ConstantProductWithOffset) {
        fields.push(BufferLayout.nu64('token_b_offset'));
        fields.push(BufferLayout.blob(24, 'padding'));
      } else if (config.curveType === CurveType.ConstantPrice) {
        fields.push(BufferLayout.nu64('token_b_price'));
        fields.push(BufferLayout.blob(24, 'padding'));
      } else {
        fields.push(BufferLayout.blob(32, 'padding'));
      }

      const commandDataLayout = BufferLayout.struct(fields);

      const { fees, ...rest } = config;

      const encodeLength = commandDataLayout.encode(
        {
          instruction: 0, // InitializeSwap instruction
          nonce,
          ...fees,
          ...rest,
        },
        data
      );
      data = data.slice(0, encodeLength);
    } else {
      const commandDataLayout = BufferLayout.struct([
        BufferLayout.u8('instruction'),
        BufferLayout.u8('nonce'),
        BufferLayout.u8('curveType'),
        BufferLayout.nu64('tradeFeeNumerator'),
        BufferLayout.nu64('tradeFeeDenominator'),
        BufferLayout.nu64('ownerTradeFeeNumerator'),
        BufferLayout.nu64('ownerTradeFeeDenominator'),
        BufferLayout.nu64('ownerWithdrawFeeNumerator'),
        BufferLayout.nu64('ownerWithdrawFeeDenominator'),
        BufferLayout.blob(16, 'padding'),
      ]);

      const encodeLength = commandDataLayout.encode(
        {
          instruction: 0, // InitializeSwap instruction
          nonce,
          curveType: config.curveType,
          tradeFeeNumerator: config.fees.tradeFeeNumerator,
          tradeFeeDenominator: config.fees.tradeFeeDenominator,
          ownerTradeFeeNumerator: config.fees.ownerTradeFeeNumerator,
          ownerTradeFeeDenominator: config.fees.ownerTradeFeeDenominator,
          ownerWithdrawFeeNumerator: config.fees.ownerWithdrawFeeNumerator,
          ownerWithdrawFeeDenominator: config.fees.ownerWithdrawFeeDenominator,
        },
        data
      );
      data = data.slice(0, encodeLength);
    }
  }

  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const depositPoolInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  sourceA: PublicKey,
  sourceB: PublicKey,
  intoA: PublicKey,
  intoB: PublicKey,
  poolToken: PublicKey,
  poolAccount: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  poolTokenAmount: number | Numberu64,
  maximumTokenA: number | Numberu64,
  maximumTokenB: number | Numberu64
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    uint64('poolTokenAmount'),
    uint64('maximumTokenA'),
    uint64('maximumTokenB'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 2, // Deposit instruction
      poolTokenAmount: new Numberu64(poolTokenAmount).toBuffer(),
      maximumTokenA: new Numberu64(maximumTokenA).toBuffer(),
      maximumTokenB: new Numberu64(maximumTokenB).toBuffer(),
    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: sourceA, isSigner: false, isWritable: true },
    { pubkey: sourceB, isSigner: false, isWritable: true },
    { pubkey: intoA, isSigner: false, isWritable: true },
    { pubkey: intoB, isSigner: false, isWritable: true },
    { pubkey: poolToken, isSigner: false, isWritable: true },
    { pubkey: poolAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const depositExactOneInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  source: PublicKey,
  intoA: PublicKey,
  intoB: PublicKey,
  poolToken: PublicKey,
  poolAccount: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  sourceTokenAmount: number | Numberu64,
  minimumPoolTokenAmount: number | Numberu64
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    uint64('sourceTokenAmount'),
    uint64('minimumPoolTokenAmount'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 4, // DepositExactOne instruction
      sourceTokenAmount: new Numberu64(sourceTokenAmount).toBuffer(),
      minimumPoolTokenAmount: new Numberu64(minimumPoolTokenAmount).toBuffer(),
    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: intoA, isSigner: false, isWritable: true },
    { pubkey: intoB, isSigner: false, isWritable: true },
    { pubkey: poolToken, isSigner: false, isWritable: true },
    { pubkey: poolAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const withdrawPoolInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  poolMint: PublicKey,
  feeAccount: PublicKey | undefined,
  sourcePoolAccount: PublicKey,
  fromA: PublicKey,
  fromB: PublicKey,
  userAccountA: PublicKey,
  userAccountB: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  poolTokenAmount: number | Numberu64,
  minimumTokenA: number | Numberu64,
  minimumTokenB: number | Numberu64
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    uint64('poolTokenAmount'),
    uint64('minimumTokenA'),
    uint64('minimumTokenB'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 3, // Withdraw instruction
      poolTokenAmount: new Numberu64(poolTokenAmount).toBuffer(),
      minimumTokenA: new Numberu64(minimumTokenA).toBuffer(),
      minimumTokenB: new Numberu64(minimumTokenB).toBuffer(),
    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: sourcePoolAccount, isSigner: false, isWritable: true },
    { pubkey: fromA, isSigner: false, isWritable: true },
    { pubkey: fromB, isSigner: false, isWritable: true },
    { pubkey: userAccountA, isSigner: false, isWritable: true },
    { pubkey: userAccountB, isSigner: false, isWritable: true },
  ];

  if (feeAccount) {
    keys.push({ pubkey: feeAccount, isSigner: false, isWritable: true });
  }
  keys.push({ pubkey: tokenProgramId, isSigner: false, isWritable: false });

  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const withdrawExactOneInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  poolMint: PublicKey,
  sourcePoolAccount: PublicKey,
  fromA: PublicKey,
  fromB: PublicKey,
  userAccount: PublicKey,
  feeAccount: PublicKey | undefined,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  sourceTokenAmount: number | Numberu64,
  maximumTokenAmount: number | Numberu64
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    uint64('sourceTokenAmount'),
    uint64('maximumTokenAmount'),
  ]);

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 5, // WithdrawExactOne instruction
      sourceTokenAmount: new Numberu64(sourceTokenAmount).toBuffer(),
      maximumTokenAmount: new Numberu64(maximumTokenAmount).toBuffer(),
    },
    data
  );

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: sourcePoolAccount, isSigner: false, isWritable: true },
    { pubkey: fromA, isSigner: false, isWritable: true },
    { pubkey: fromB, isSigner: false, isWritable: true },
    { pubkey: userAccount, isSigner: false, isWritable: true },
  ];

  if (feeAccount) {
    keys.push({ pubkey: feeAccount, isSigner: false, isWritable: true });
  }
  keys.push({ pubkey: tokenProgramId, isSigner: false, isWritable: false });

  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};

export const swapInstruction = (
  tokenSwap: PublicKey,
  authority: PublicKey,
  userSource: PublicKey,
  poolSource: PublicKey,
  poolDestination: PublicKey,
  userDestination: PublicKey,
  poolMint: PublicKey,
  feeAccount: PublicKey,
  swapProgramId: PublicKey,
  tokenProgramId: PublicKey,
  amountIn: number | Numberu64,
  minimumAmountOut: number | Numberu64,
  programOwner?: PublicKey
): TransactionInstruction => {
  const dataLayout = BufferLayout.struct([
    BufferLayout.u8('instruction'),
    uint64('amountIn'),
    uint64('minimumAmountOut'),
  ]);

  const keys = [
    { pubkey: tokenSwap, isSigner: false, isWritable: false },
    { pubkey: authority, isSigner: false, isWritable: false },
    { pubkey: userSource, isSigner: false, isWritable: true },
    { pubkey: poolSource, isSigner: false, isWritable: true },
    { pubkey: poolDestination, isSigner: false, isWritable: true },
    { pubkey: userDestination, isSigner: false, isWritable: true },
    { pubkey: poolMint, isSigner: false, isWritable: true },
    { pubkey: feeAccount, isSigner: false, isWritable: true },
    { pubkey: tokenProgramId, isSigner: false, isWritable: false },
  ];

  // optional depending on the build of token-swap program
  if (programOwner) {
    keys.push({ pubkey: programOwner, isSigner: false, isWritable: true });
  }

  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode(
    {
      instruction: 1, // Swap instruction
      amountIn: new Numberu64(amountIn).toBuffer(),
      minimumAmountOut: new Numberu64(minimumAmountOut).toBuffer(),
    },
    data
  );

  return new TransactionInstruction({
    keys,
    programId: swapProgramId,
    data,
  });
};
