import React, { useState } from 'react';
import { Button, Form, Input, InputNumber, Space, Typography } from 'antd';

import { useConnection, useWallet } from '@oyster/common';
import { generateMint } from '../../actions/devtools/generateMint';

import { PublicKey } from '@solana/web3.js';
import { u64 } from '@solana/spl-token';
import { BigNumber } from 'bignumber.js';

const { Text } = Typography;

export function CreateMint() {
  const [form] = Form.useForm();
  const wallet = useWallet();
  const connection = useConnection();
  const [mintPk, setMintPk] = useState('');

  const onFinish = async (values: {
    maxSupply: string;
    decimals: number;
    myTokens: string;
    remainingTokensWallet: string;
  }) => {
    try {
      const maxSupply = new BigNumber(values.maxSupply).shiftedBy(
        values.decimals,
      );
      const myTokens = new BigNumber(values.myTokens).shiftedBy(
        values.decimals,
      );

      const { mintAddress } = await generateMint(
        connection,
        wallet,
        values.decimals,

        new u64(myTokens.toString()),
        new u64(maxSupply.toString()),
        new PublicKey(values.remainingTokensWallet),
      );

      setMintPk(mintAddress.toBase58());
    } catch (ex) {
      console.error(ex);
    }
  };

  return (
    <Space direction="vertical" size="large">
      <Form
        form={form}
        labelCol={{ span: 10 }}
        wrapperCol={{ span: 6 }}
        onFinish={onFinish}
        initialValues={{
          maxSupply: 1000000000,
          decimals: 6,
          myTokens: 1000000,
          remainingTokensWallet: 'ENmcpFCpxN1CqyUjuog9yyUVfdXBKF3LVCwLr7grJZpk',
        }}
        labelAlign="right"
        {...{ requiredMark: false }}
      >
        <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
          <h2>Create Mint</h2>
          <Text type="secondary">
            Creates mint with the given max supply, decimals and tokens minted
            to the current wallet and the given wallet
          </Text>
        </Form.Item>

        <Form.Item
          label="max supply"
          name="maxSupply"
          rules={[{ required: true }]}
        >
          <Input style={{ width: 200 }} />
        </Form.Item>
        <Form.Item
          label="decimals"
          name="decimals"
          rules={[{ required: true }]}
        >
          <InputNumber style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          label="my tokens"
          name="myTokens"
          rules={[{ required: true }]}
        >
          <Input style={{ width: 200 }} />
        </Form.Item>

        <Form.Item
          label="remaining tokens wallet"
          name="remainingTokensWallet"
          rules={[{ required: true }]}
        >
          <Input style={{ width: 400 }} />
        </Form.Item>

        <Form.Item wrapperCol={{ offset: 4, span: 16 }}>
          <Button type="primary" htmlType="submit" disabled={!wallet.connected}>
            Create Mint
          </Button>
        </Form.Item>
      </Form>

      {mintPk && (
        <div>
          <h3>mint address: </h3>
          <div className="test-data">{mintPk}</div>
        </div>
      )}
    </Space>
  );
}
