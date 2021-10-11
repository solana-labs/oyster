import { Col, List, Row } from 'antd';
import React, { useMemo } from 'react';
import { useRealms } from '../../contexts/GovernanceContext';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions

import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';

import { RegisterRealmButton } from './registerRealmButton';
import { LABELS } from '../../constants';

import { RealmBadge } from '../../components/RealmBadge/realmBadge';
import { useWalletTokenOwnerRecords } from '../../hooks/apiHooks';
import { RealmDepositBadge } from '../../components/RealmDepositBadge/realmDepositBadge';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getRealmUrl } from '../../tools/routeTools';

export const HomeView = () => {
  const history = useHistory();
  const realms = useRealms();
  const { programIdBase58 } = useRpcContext();
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
          r.info.config.councilMint &&
          tokenOwnerRecords.find(
            tor =>
              tor.info.governingTokenMint.toBase58() ===
              r.info.config.councilMint!.toBase58(),
          );

        return {
          href: getRealmUrl(r.pubkey, programIdBase58),
          title: r.info.name,
          badge: (
            <RealmBadge
              communityMint={r.info.communityMint}
              councilMint={r.info.config.councilMint}
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
            <RegisterRealmButton
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
