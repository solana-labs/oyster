import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealms } from '../../contexts/GovernanceContext';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions

import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';

import { RegisterRealm } from './registerRealm';
import { LABELS } from '../../constants';

import { RealmBadge } from '../../components/RealmBadge/realmBadge';
import { useWalletTokenOwnerRecords } from '../../hooks/apiHooks';
import { RealmDepositBadge } from '../../components/RealmDepositBadge/realmDepositBadge';

export const HomeView = () => {
  const history = useHistory();
  const realms = useRealms();
  const tokenOwnerRecords = useWalletTokenOwnerRecords();

  const realmItems = useMemo(() => {
    return realms
      .sort((r1, r2) => r1.info.name.localeCompare(r2.info.name))
      .map(r => {
        const communityTokenOwnerRecord = tokenOwnerRecords.find(
          tor =>
            tor.info.governingTokenMint.toBase58() ===
            r.info.communityMint.toBase58(),
        );

        const councilTokenOwnerRecord =
          r.info.councilMint &&
          tokenOwnerRecords.find(
            tor =>
              tor.info.governingTokenMint.toBase58() ===
              r.info.councilMint!.toBase58(),
          );

        return {
          href: '/realm/' + r.pubkey.toBase58(),
          title: r.info.name,
          badge: (
            <RealmBadge
              communityMint={r.info.communityMint}
              councilMint={r.info.councilMint}
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
  }, [realms, tokenOwnerRecords]);

  return (
    <>
      <Background />
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="governance-container">
          <div className="governance-title">
            <h1>{LABELS.REALMS}</h1>
            <RegisterRealm
              buttonProps={{ style: { marginLeft: 'auto', marginRight: 0 } }}
            />
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
