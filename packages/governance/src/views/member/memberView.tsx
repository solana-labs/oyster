import { ExplorerLink } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { Divider, Space } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';
import { RealmBadge } from '../../components/RealmBadge/realmBadge';
import { useRealm } from '../../contexts/GovernanceContext';
import { useTokenOwnerRecordByOwner } from '../../hooks/apiHooks';
import { useKeyParam } from '../../hooks/useKeyParam';
import { useRpcContext } from '../../hooks/useRpcContext';
import { TokenOwnerRecord } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';
import { getRealmUrl } from '../../tools/routeTools';
import { RealmActionBar } from '../realm/buttons/realmActionBar';

export function MemberView() {
  const memberPk = useKeyParam();
  const memberRecords = useTokenOwnerRecordByOwner(memberPk);
  const { programId } = useRpcContext();

  return (
    <>
      <Space direction="vertical">
        <Divider />
        {memberRecords.map(tor => (
          <MemberItem tokenOwnerRecord={tor} programId={programId}></MemberItem>
        ))}
      </Space>
    </>
  );
}

export function MemberItem({
  tokenOwnerRecord,
  programId,
}: {
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>;
  programId: PublicKey;
}) {
  const realm = useRealm(tokenOwnerRecord.account.realm);

  return (
    <>
      <Space direction="vertical">
        <Space>
          <RealmBadge
            communityMint={realm?.account.communityMint}
            councilMint={realm?.account.config.councilMint}
          ></RealmBadge>
          {realm && (
            <Space direction="vertical">
              <Link to={getRealmUrl(realm.pubkey, programId)}>
                <div>{realm.account.name}</div>
              </Link>

              <ExplorerLink
                address={tokenOwnerRecord.account.governingTokenMint}
                type="address"
              ></ExplorerLink>
            </Space>
          )}
        </Space>

        <Space>
          <span>Total Votes: </span>
          <span>{tokenOwnerRecord.account.totalVotesCount}</span>
        </Space>
        <Space>
          <span>Outstanding Proposals: </span>
          <span>{tokenOwnerRecord.account.outstandingProposalCount}</span>
        </Space>
        <Space>
          <span>Unrelinquished Votes: </span>
          <span>{tokenOwnerRecord.account.unrelinquishedVotesCount}</span>
        </Space>
        <RealmActionBar realm={realm} showSettings={false}></RealmActionBar>
        <Divider />
      </Space>
    </>
  );
}
