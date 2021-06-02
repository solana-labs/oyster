import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealms } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { TokenIcon, useWallet } from '@oyster/common';
import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';

import { RegisterRealm } from './RegisterRealm';
import { LABELS } from '../../constants';

export const HomeView = () => {
  const history = useHistory();
  const realms = useRealms();
  const { connected } = useWallet();

  const realmItems = useMemo(() => {
    return realms
      .sort((r1, r2) => r1.info.name.localeCompare(r2.info.name))
      .map(r => ({
        href: '/realm/' + r.pubkey.toBase58(),
        title: r.info.name,
        badge: <TokenIcon mintAddress={r.info.communityMint} size={40} />,
        key: r.pubkey.toBase58(),
      }));
  }, [realms]);

  return (
    <>
      <Background />
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="governance-container">
          <div className="governance-title">
            <h1>{LABELS.REALMS}</h1>
            <RegisterRealm
              style={{ marginLeft: 'auto', marginRight: 0 }}
              disabled={!connected}
            />
          </div>
          <List
            itemLayout="vertical"
            size="large"
            loading={realmItems.length === 0}
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
                ></List.Item.Meta>
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </>
  );
};
