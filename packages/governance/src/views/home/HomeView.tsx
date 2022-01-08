import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealms } from '../../contexts/GovernanceContext';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions

import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';

import { LABELS } from '../../constants';

import { RealmBadge } from '../../components/RealmBadge/realmBadge';
import { useWalletTokenOwnerRecords } from '../../hooks/apiHooks';
import { RealmDepositBadge } from '../../components/RealmDepositBadge/realmDepositBadge';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getRealmUrl } from '../../tools/routeTools';

import { ProgramActionBar } from './buttons/programActionBar';

import { formatToCurrency2, LockupStatus2 } from '@solana/governance-sdk'
import { LockupStatus } from '@solana/bridge-sdk'

export const HomeView = () => {
  const history = useHistory();
  const realms = useRealms();
  const { programIdBase58 } = useRpcContext();
  const tokenOwnerRecords = useWalletTokenOwnerRecords();

  const rr = formatToCurrency2(10);

  const ls = LockupStatus.AWAITING_VAA;
  const ls2 = LockupStatus2.AWAITING_VAA;

  console.log("MODULE", { rr, ls, ls2 })

  const realmItems = useMemo(() => {
    return realms
      .sort((r1, r2) => r1.account.name.localeCompare(r2.account.name))
      .map(r => {
        const communityTokenOwnerRecord = tokenOwnerRecords.find(
          tor =>
            tor.account.governingTokenMint.toBase58() ===
            r.account.communityMint.toBase58(),
        );

        const councilTokenOwnerRecord =
          r.account.config.councilMint &&
          tokenOwnerRecords.find(
            tor =>
              tor.account.governingTokenMint.toBase58() ===
              r.account.config.councilMint!.toBase58(),
          );

        return {
          href: getRealmUrl(r.pubkey, programIdBase58),
          title: r.account.name,
          badge: (
            <RealmBadge
              communityMint={r.account.communityMint}
              councilMint={r.account.config.councilMint}
            ></RealmBadge>
          ),
          key: r.pubkey.toBase58(),
          description: (
            <RealmDepositBadge
              communityTokenOwnerRecord={communityTokenOwnerRecord}
              councilTokenOwnerRecord={councilTokenOwnerRecord}
            ></RealmDepositBadge>
          ),
        };
      });
  }, [realms, tokenOwnerRecords, programIdBase58]);

  return (
    <>
      <Background />
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="governance-container">
          <div className="governance-title">
            <h1>{LABELS.REALMS}</h1>
            <ProgramActionBar></ProgramActionBar>
          </div>
          <List
            itemLayout="vertical"
            size="large"
            pagination={false}
            dataSource={realmItems}
            renderItem={item => (
              <List.Item
                key={item.key}
                className="governance-item"
                onClick={() => history.push(item.href)}
              >
                <List.Item.Meta
                  avatar={item.badge}
                  title={item.title}
                  description={item.description}
                ></List.Item.Meta>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </>
  );
};
