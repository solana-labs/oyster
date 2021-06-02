import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealmGovernances, useRealm } from '../../contexts/proposals';
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

  const listData = useMemo(() => {
    const newListData: any[] = [];

    governances.forEach(g => {
      newListData.push({
        key: g.pubkey,
        href: '/governance/' + g.pubkey,
        title: g.info.config.governedAccount.toBase58(),
      });
    });
    return newListData;
  }, [governances]);

  return (
    <>
      <Background />
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="governance-container">
          <Row justify="start" align="middle" className="governance-container">
            <Col md={12} xs={24}>
              <Row>
                <TokenIcon mintAddress={realm?.info.communityMint} size={60} />
                <Col>
                  <h1>{realm?.info.name}</h1>
                </Col>
              </Row>
            </Col>
            <Col md={12} xs={24}>
              <div className="realm-actions">
                <DepositGoverningTokens realm={realm}></DepositGoverningTokens>
                <WithdrawGoverningTokens
                  realm={realm}
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
        <Col flex="auto" xxl={15} xs={24} className="governance-container">
          <List
            itemLayout="vertical"
            size="large"
            loading={listData.length === 0}
            pagination={false}
            dataSource={listData}
            renderItem={item => (
              <List.Item
                key={item.key}
                className="governance-item"
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
