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
          <div className="governance-title">
            <TokenIcon mintAddress={realm?.info.communityMint} size={40} />
            <h1>{realm?.info.name}</h1>
            <DepositGoverningTokens
              buttonProps={{ style: { marginLeft: 'auto', marginRight: 0 } }}
              realm={realm}
            ></DepositGoverningTokens>
            <RegisterGovernance
              style={{ marginLeft: 10, marginRight: 0 }}
              disabled={!connected}
            />
          </div>
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
