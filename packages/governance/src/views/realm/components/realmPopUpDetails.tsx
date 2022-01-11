import { Space, Typography } from 'antd';
import React from 'react';
import { ExplorerLink, contexts } from '@oyster/common';
import { Realm } from '@solana/spl-governance';
import { PublicKey } from '@solana/web3.js';
import {
  formatMintMaxVotePercentage,
  formatMintMaxVoteWeight,
  formatMintNaturalAmountAsDecimal,
  formatMintSupplyAsDecimal,
} from '../../../tools/units';
import { ProgramAccount } from '@solana/spl-governance';

const { useMint } = contexts.Accounts;
const { Text } = Typography;

export function RealmPopUpDetails({ realm }: { realm: ProgramAccount<Realm> }) {
  return (
    <Space direction="vertical">
      <>
        <RealmMintDetails
          label="governance token"
          realm={realm}
          mint={realm.account.communityMint}
          showMaxVoteWeight={
            !realm.account.config.communityMintMaxVoteWeightSource.isFullSupply()
          }
          showMinTokens
        ></RealmMintDetails>

        {realm.account.config.councilMint && (
          <RealmMintDetails
            label="council token"
            mint={realm.account.config.councilMint}
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
  realm: ProgramAccount<Realm>;
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
                realm.account.config.communityMintMaxVoteWeightSource,
              )} (${formatMintMaxVotePercentage(
                realm.account.config.communityMintMaxVoteWeightSource,
              )})`}</Text>
              {/* <Text type="secondary">{`my vote weight:`}</Text> */}
            </>
          )}
          {showMinTokens && (
            <Text type="secondary">{`min tokens to create governance: ${formatMintNaturalAmountAsDecimal(
              mintInfo,
              realm.account.config.minCommunityTokensToCreateGovernance,
            )}`}</Text>
          )}
        </>
      )}
    </Space>
  );
}
