import { Space, Typography } from 'antd';
import React from 'react';
import { ExplorerLink, ParsedAccount, contexts } from '@oyster/common';
import { Realm } from '../../../models/accounts';
import { PublicKey } from '@solana/web3.js';
import {
  formatMintMaxVotePercentage,
  formatMintMaxVoteWeight,
  formatMintNaturalAmountAsDecimal,
  formatMintSupplyAsDecimal,
} from '../../../tools/units';

const { useMint } = contexts.Accounts;
const { Text } = Typography;

export function RealmPopUpDetails({ realm }: { realm: ParsedAccount<Realm> }) {
  return (
    <Space direction="vertical">
      <>
        <RealmMintDetails
          label="governance token"
          realm={realm}
          mint={realm.info.communityMint}
          showMaxVoteWeight={
            !realm.info.config.communityMintMaxVoteWeightSource.isFullSupply()
          }
          showMinTokens
        ></RealmMintDetails>

        {realm.info.config.councilMint && (
          <RealmMintDetails
            label="council token"
            mint={realm.info.config.councilMint}
            realm={realm}
          ></RealmMintDetails>
        )}
      </>
    </Space>
  );
}

function RealmMintDetails({
  label,
  mint,
  showMaxVoteWeight = false,
  showMinTokens = false,
  realm,
}: {
  label: string;
  mint: PublicKey;
  showMaxVoteWeight?: boolean;
  showMinTokens?: boolean;
  realm: ParsedAccount<Realm>;
}) {
  const mintInfo = useMint(mint);

  return (
    <Space direction="vertical">
      <Text>{label}</Text>
      <ExplorerLink address={mint} type="address" />
      {mintInfo && (
        <>
          <Text type="secondary">{`supply: ${formatMintSupplyAsDecimal(
            mintInfo,
          )}`}</Text>
          {showMaxVoteWeight && (
            <>
              <Text type="secondary">{`max vote weight: ${formatMintMaxVoteWeight(
                mintInfo,
                realm.info.config.communityMintMaxVoteWeightSource,
              )} (${formatMintMaxVotePercentage(
                realm.info.config.communityMintMaxVoteWeightSource,
              )})`}</Text>
              {/* <Text type="secondary">{`my vote weight:`}</Text> */}
            </>
          )}
          {showMinTokens && (
            <Text type="secondary">{`min tokens to create governance: ${formatMintNaturalAmountAsDecimal(
              mintInfo,
              realm.info.config.minCommunityTokensToCreateGovernance,
            )}`}</Text>
          )}
        </>
      )}
    </Space>
  );
}
