import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealm } from '../../contexts/GovernanceContext';

import { useGovernancesByRealm } from '../../hooks/apiHooks';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions

import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';

import { useKeyParam } from '../../hooks/useKeyParam';
import { RegisterGovernance } from './registerGovernance';
import { DepositGoverningTokens } from './DepositGoverningTokens';
import { WithdrawGoverningTokens } from './WithdrawGoverningTokens';

import { RealmBadge } from '../../components/RealmBadge/realmBadge';
import { GovernanceBadge } from '../../components/GovernanceBadge/governanceBadge';

export const RealmView = () => {
  const history = useHistory();
  let realmKey = useKeyParam();

  const realm = useRealm(realmKey);
  const governances = useGovernancesByRealm(realmKey);

  const governanceItems = useMemo(() => {
    return governances
      .sort((g1, g2) =>
        g1.info.config.governedAccount
          .toBase58()
          .localeCompare(g2.info.config.governedAccount.toBase58()),
      )
      .map(g => ({
        key: g.pubkey.toBase58(),
        href: '/governance/' + g.pubkey,
        title: g.info.config.governedAccount.toBase58(),
        badge: <GovernanceBadge governance={g}></GovernanceBadge>,
      }));
  }, [governances]);

  return (
    <>
      <Background />
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="realm-container">
          <Row>
            <Col md={12} xs={24} className="realm-title">
              <Row>
                <RealmBadge
                  size={60}
                  communityMint={realm?.info.communityMint}
                  councilMint={realm?.info.councilMint}
                ></RealmBadge>

                <Col>
                  <h1>{realm?.info.name}</h1>
                </Col>
              </Row>
            </Col>
            <Col md={12} xs={24}>
              <div className="realm-actions">
                <DepositGoverningTokens
                  realm={realm}
                  governingTokenMint={realm?.info.communityMint}
                ></DepositGoverningTokens>
                <WithdrawGoverningTokens
                  realm={realm}
                  governingTokenMint={realm?.info.communityMint}
                ></WithdrawGoverningTokens>
                <DepositGoverningTokens
                  realm={realm}
                  governingTokenMint={realm?.info.councilMint}
                  tokenName="Council"
                ></DepositGoverningTokens>
                <WithdrawGoverningTokens
                  realm={realm}
                  governingTokenMint={realm?.info.councilMint}
                  tokenName="Council"
                ></WithdrawGoverningTokens>
                <RegisterGovernance
                  buttonProps={{ className: 'governance-action' }}
                ></RegisterGovernance>
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="realm-container">
          <h1 className="governances-list-title">Governances</h1>
          <List
            itemLayout="vertical"
            size="large"
            pagination={false}
            dataSource={governanceItems}
            renderItem={item => (
              <List.Item
                key={item.key}
                className="realm-item"
                onClick={() => history.push(item.href)}
              >
                <List.Item.Meta
                  title={item.title}
                  avatar={item.badge}
                ></List.Item.Meta>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </>
  );
};
