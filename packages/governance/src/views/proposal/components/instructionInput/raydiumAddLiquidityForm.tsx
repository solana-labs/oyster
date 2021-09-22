import { Form, FormInstance, Spin } from 'antd';
import { ExplorerLink, ParsedAccount } from '@oyster/common';
import { Governance } from '../../../../models/accounts';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import React from 'react';
import { formDefaults } from '../../../../tools/forms';

import { contexts } from '@oyster/common';

import { addLiquidityInstructionV4 } from '../../../../tools/raydium/raydium';
import { getAssociatedTokenAddress } from '../../../../tools/sdk/token/splToken';

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

    let rayAta = await getAssociatedTokenAddress(
      new PublicKey('4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R'), // RAY mint
      governancePk,
    );

    let serAta = await getAssociatedTokenAddress(
      new PublicKey('SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt'), // SRM mint
      governancePk,
    );

    // temp. workaround until the accounts are fixed for the dev 'Yield Farming' realm
    if (
      governancePk.equals(
        new PublicKey('BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ'),
      )
    ) {
      // The accounts owned by BB457CW2sN2BpEXzCCi3teaCnDT3hGPZDoCCutHb6BsQ governance are not ATAs and we have to overwrite them
      rayAta = new PublicKey('8bVecpkd9gbK8VtYKHxjjL1uXnSevgdH8BAnuKjScacf');
      serAta = new PublicKey('EfQU385sk18VwfVaxZ1aiDXfvHg9jdbzqGm9Qg7261wh');
    }

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
