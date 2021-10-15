import { Form, FormInstance, Spin } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import React from 'react';
import { formDefaults } from '../../../../tools/forms';

import { contexts } from '@oyster/common';

import { addLiquidityInstructionV4 } from '../../../../tools/raydium/raydium';

import { getRAYGovernanceAta, getSRMGovernanceAta } from './yieldFarming';

const { useAccount: useTokenAccount } = contexts.Accounts;
const { useConnection } = contexts.Connection;
const { useMint } = contexts.Accounts;

export const RaydiumAddLiquidityForm = ({
  form,
  governance,
  onCreateInstruction,
}: {
  form: FormInstance;
  governance: ParsedAccount<Governance>;
  onCreateInstruction: (instruction: TransactionInstruction) => void;
}) => {
  const sourceTokenAccount = useTokenAccount(governance.info.governedAccount);
  const mintInfo = useMint(sourceTokenAccount?.info.mint);
  const connection = useConnection();

  if (!(mintInfo && sourceTokenAccount)) {
    return <Spin />;
  }

  const onCreate = async () => {
    const governancePk = governance.pubkey;

    const rayAta = await getRAYGovernanceAta(governancePk);

    const serAta = await getSRMGovernanceAta(governancePk);

    const rayTokenAmount = await connection.getTokenAccountBalance(rayAta);
    const serTokenAmount = await connection.getTokenAccountBalance(serAta);

    let maxRayAmount = parseInt(rayTokenAmount.value.amount);
    let maxSerAmount = parseInt(serTokenAmount.value.amount);

    // SRM/RAY rate hardcoded for now
    // Note: The actual rate will be calculated when the instruction is executed but it has to be in the range to avoid slippage error
    // TODO: Read from market at the time the instruction is created
    const srmRayRate = 0.77;

    let serAmount = maxSerAmount;
    let rayAmount = maxSerAmount * srmRayRate;

    if (rayAmount > maxRayAmount) {
      rayAmount = maxRayAmount;
      serAmount = rayAmount / srmRayRate;
    }

    const raydiumIx = addLiquidityInstructionV4(
      new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8'),
      // amm
      new PublicKey('GaqgfieVmnmY4ZsZHHA6L5RSVzCGL3sKx4UgHBaYNy8m'),
      new PublicKey('5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1'),
      new PublicKey('7XWbMpdyGM5Aesaedh6V653wPYpEswA864sBvodGgWDp'),
      new PublicKey('9u8bbHv7DnEbVRXmptz3LxrJsryY1xHqGvXLpgm9s5Ng'),
      new PublicKey('7P5Thr9Egi2rvMmEuQkLn8x8e8Qro7u2U7yLD2tU2Hbe'),
      new PublicKey('3FqQ8p72N85USJStyttaohu1EBsTsEZQ9tVqwcPWcuSz'),
      new PublicKey('384kWWf2Km56EReGvmtCKVo1BBmmt2SwiEizjhwpCmrN'),
      // serum
      new PublicKey('Cm4MmknScg7qbKqytb1mM92xgDxv3TNXos4tKbBqTDy7'),
      // user (governance)
      rayAta, // governance RAY account
      serAta, // governance SER account
      governance.info.governedAccount, // governance RAY-SRM LP token account
      governancePk, // governance PDA
      rayAmount, // max RAY
      serAmount, // max SER
      0,
    );

    onCreateInstruction(raydiumIx);
  };

  return (
    <Form
      {...formDefaults}
      form={form}
      onFinish={onCreate}
      initialValues={{ amount: 1 }}
    >
      <Form.Item label="account owner (governance account)">
        <ExplorerLink address={governance.pubkey} type="address" />
      </Form.Item>
    </Form>
  );
};
