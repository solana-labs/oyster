import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useProposals } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { TokenIcon, useWallet } from '@oyster/common';
import { Background } from './../../components/Background';
import { useHistory } from 'react-router-dom';

import { RegisterRealm } from './registerRealm';

export const HomeView = () => {
  const history = useHistory();
  const { realms } = useProposals();
  const { connected } = useWallet();

  const listData = useMemo(() => {
    const newListData: any[] = [];

    Object.keys(realms).forEach(realmKey => {
      const realm = realms[realmKey];
      const communityMint = realm.info.communityMint.toBase58();

      newListData.push({
        href: '/governance/' + realmKey,
        title: realm.info.name,
        badge: <TokenIcon mintAddress={communityMint} size={40} />,
        realmKey: realmKey,
        realm,
      });
    });
    return newListData;
  }, [realms]);

  return (
    <>
      <Background />
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="governance-container">
          <div className="governance-title">
            <h1>Governance</h1>
            <RegisterRealm
              style={{ marginLeft: 'auto', marginRight: 0 }}
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
                key={item.realmKey}
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
