import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealmGovernances } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { useWallet } from '@oyster/common';
import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';
import { RegisterGovernance } from './registerGovernance';

import { LABELS } from '../../constants';

import { useKeyParam } from '../../hooks/useKeyParam';

export const RealmView = () => {
  const history = useHistory();
  const { connected } = useWallet();
  let realmKey = useKeyParam();

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
            <h1>{LABELS.REALM}</h1>
            <RegisterGovernance
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
