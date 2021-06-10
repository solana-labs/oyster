import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import {
  useRealmGovernances,
  useRealm,
} from '../../contexts/GovernanceContext';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { TokenIcon, useWallet } from '@oyster/common';
import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';

import { useKeyParam } from '../../hooks/useKeyParam';
import { RegisterGovernance } from './RegisterGovernance';
import { DepositGoverningTokens } from './DepositGoverningTokens';
import { WithdrawGoverningTokens } from './WithdrawGoverningTokens';

export const RealmView = () => {
  const history = useHistory();
  const { connected } = useWallet();
  let realmKey = useKeyParam();

  const realm = useRealm(realmKey);
  const governances = useRealmGovernances(realmKey);

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
                <TokenIcon mintAddress={realm?.info.communityMint} size={60} />
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
                  disabled={!connected}
                  className="governance-action"
                />
              </div>
            </Col>
          </Row>
        </Col>
      </Row>
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="realm-container">
          <List
            itemLayout="vertical"
            size="large"
            loading={governanceItems.length === 0}
            pagination={false}
            dataSource={governanceItems}
            renderItem={item => (
              <List.Item
                key={item.key}
                className="realm-item"
                onClick={() => history.push(item.href)}
              >
                <List.Item.Meta title={item.title}></List.Item.Meta>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </>
  );
};
