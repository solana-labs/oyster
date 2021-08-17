import { Form, FormInstance, Spin } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import React from 'react';
import { formDefaults } from '../../../../tools/forms';

import { contexts } from '@oyster/common';

import { addLiquidityInstructionV4 } from '../../../../tools/raydium/raydium';

const { useAccount: useTokenAccount } = contexts.Accounts;
const { useMint } = contexts.Accounts;

export const SplTokenRaydiumForm = ({
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

  if (!(mintInfo && sourceTokenAccount)) {
    return <Spin />;
  }

  const onCreate = async ({
    destination,
    amount,
  }: {
    destination: string;
    amount: string;
  }) => {
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
      new PublicKey('8bVecpkd9gbK8VtYKHxjjL1uXnSevgdH8BAnuKjScacf'),
      new PublicKey('EfQU385sk18VwfVaxZ1aiDXfvHg9jdbzqGm9Qg7261wh'),
      new PublicKey('GbrNTxmoWhYYTY2yjnJFDyM79w9KzNmuzY6BBpUmvZGZ'),
      new PublicKey('BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ'), // governance PDS
      1,
      1,
      1,
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
