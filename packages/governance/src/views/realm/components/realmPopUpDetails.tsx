import { Space, Typography } from 'antd';
import React from 'react';
import { ExplorerLink, ParsedAccount, contexts } from '@oyster/common';
import { Realm } from '../../../models/accounts';
import { PublicKey } from '@solana/web3.js';
import { formatMintSupplyAsDecimal } from '../../../tools/units';

const { useMint } = contexts.Accounts;
const { Text } = Typography;

export function RealmPopUpDetails({ realm }: { realm: ParsedAccount<Realm> }) {
  return (
    <Space direction="vertical">
      <>
        <RealmMintDetails
          label="token"
          mint={realm.info.communityMint}
        ></RealmMintDetails>

        {realm.info.councilMint && (
          <RealmMintDetails
            label="council token"
            mint={realm.info.councilMint}
          ></RealmMintDetails>
        )}
      </>
    </Space>
  );
}

function RealmMintDetails({ label, mint }: { label: string; mint: PublicKey }) {
  const mintInfo = useMint(mint);
  return (
    <Space direction="vertical">
      <Space>
        <Text>{label}</Text>
        {mintInfo && (
          <Text type="secondary">{`${formatMintSupplyAsDecimal(
            mintInfo,
          )} supply`}</Text>
        )}
      </Space>
      <ExplorerLink address={mint} type="address" />
    </Space>
  );
}
