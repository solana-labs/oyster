import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealms } from '../../contexts/GovernanceContext';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';

import { LABELS } from '../../constants';

import { RealmBadge } from '../../components/RealmBadge/realmBadge';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getRealmUrl } from '../../tools/routeTools';

import { ProgramActionBar } from './buttons/programActionBar';

export const HomeView = () => {
  const history = useHistory();
  const realms = useRealms();
  const { programIdBase58 } = useRpcContext();

  const realmItems = useMemo(() => {
    return realms
      .sort((r1, r2) => r1.account.name.localeCompare(r2.account.name))
      .map(r => {
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
          description: ''
        };
      });
  }, [realms, programIdBase58]);

  return (
    <>
      <Background />
      <Row>
        <Col flex='auto' xxl={15} xs={24} className='governance-container'>
          <div className='governance-title'>
            <h1>{LABELS.REALMS}</h1>
            <ProgramActionBar></ProgramActionBar>
          </div>
          <List
            itemLayout='vertical'
            size='large'
            pagination={false}
            dataSource={realmItems}
            renderItem={item => (
              <List.Item
                key={item.key}
                className='governance-item'
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
