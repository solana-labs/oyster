import { Col, List, Popover, Row, Space, Typography } from 'antd';
import React, { useMemo } from 'react';
import { useRealm } from '../../contexts/GovernanceContext';

import {
  useGovernancesByRealm,
  useWalletTokenOwnerRecord,
} from '../../hooks/apiHooks';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions

import { Background } from '../../components/Background';
import { useHistory } from 'react-router-dom';

import { useKeyParam } from '../../hooks/useKeyParam';

import { RealmBadge } from '../../components/RealmBadge/realmBadge';
import { GovernanceBadge } from '../../components/GovernanceBadge/governanceBadge';
import AccountDescription from './components/accountDescription';
import { RealmDepositBadge } from '../../components/RealmDepositBadge/realmDepositBadge';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getGovernanceUrl } from '../../tools/routeTools';
import { ExplorerLink } from '@oyster/common';
import { RealmPopUpDetails } from './components/realmPopUpDetails';

import { RealmActionBar } from './buttons/realmActionBar';

const { Text } = Typography;

export const RealmView = () => {
  const history = useHistory();
  let realmKey = useKeyParam();
  const { programIdBase58 } = useRpcContext();

  const realm = useRealm(realmKey);
  const governances = useGovernancesByRealm(realmKey);

  const communityTokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    realm?.info.communityMint,
  );

  const councilTokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    realm?.info.config.councilMint,
  );

  const governanceItems = useMemo(() => {
    return governances
      .sort((g1, g2) =>
        g1.info.governedAccount
          .toBase58()
          .localeCompare(g2.info.governedAccount.toBase58()),
      )
      .map(g => ({
        key: g.pubkey.toBase58(),
        href: getGovernanceUrl(g.pubkey, programIdBase58),
        title: g.info.governedAccount.toBase58(),
        badge: <GovernanceBadge governance={g} realm={realm}></GovernanceBadge>,
        description: <AccountDescription governance={g}></AccountDescription>,
      }));
  }, [governances, programIdBase58, realm]);

  return (
    <>
      <Background />
      <Row>
        <Col flex="auto" xxl={15} xs={24} className="realm-container">
          <Row>
            <Col md={12} xs={24} className="realm-title">
              <Row>
                <Col>
                  <Popover
                    content={
                      realm && (
                        <RealmPopUpDetails realm={realm}></RealmPopUpDetails>
                      )
                    }
                    title={realm?.info.name}
                    trigger="click"
                    placement="topLeft"
                  >
                    <span>
                      <RealmBadge
                        size={60}
                        communityMint={realm?.info.communityMint}
                        councilMint={realm?.info.config.councilMint}
                      ></RealmBadge>
                    </span>
                  </Popover>
                </Col>
                <Col style={{ textAlign: 'left', marginLeft: 8 }}>
                  <Space direction="vertical" size={0}>
                    <Space align="baseline">
                      <h1> {realm?.info.name}</h1>{' '}
                      <h3>
                        {realm && (
                          <ExplorerLink
                            short
                            address={realm.info.communityMint}
                            type="address"
                          />
                        )}
                      </h3>
                    </Space>
                    <Text type="secondary">
                      <RealmDepositBadge
                        communityTokenOwnerRecord={communityTokenOwnerRecord}
                        councilTokenOwnerRecord={councilTokenOwnerRecord}
                        showVoteWeights
                      ></RealmDepositBadge>
                    </Text>
                  </Space>
                </Col>
              </Row>
            </Col>
            <Col
              md={12}
              xs={24}
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
              }}
            >
              <RealmActionBar realm={realm}></RealmActionBar>
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
