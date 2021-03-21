import { Col, List, Row } from 'antd';
import React, { useMemo, useState } from 'react';
import { useProposals } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { TokenIcon } from '@oyster/common';
import { Background } from './../../components/Background';
import { useHistory } from 'react-router-dom';
import { RegisterGovernanceMenuItem } from '../governance/register';

export const HomeView = () => {
  const history = useHistory();
  const { configs } = useProposals();
  const [page, setPage] = useState(0);
  const listData = useMemo(() => {
    const newListData: any[] = [];

    Object.keys(configs).forEach(key => {
      const config = configs[key];

      newListData.push({
        href: '/proposals/' + key,
        title: config.info.name,
        badge: <TokenIcon mintAddress={config.info.governanceMint} size={40} />,
        config,
      });
    });
    return newListData;
  }, [configs]);


  return (
    <Row>
      <Col flex="auto">
        <Background />
        <div className="governance-title">
          <h1>Governance</h1>
          <RegisterGovernanceMenuItem style={{ marginLeft: 'auto', marginRight: 0 }} />
        </div>
        <List
          itemLayout="vertical"
          size="large"
          loading={listData.length === 0}
          pagination={false}
          dataSource={listData}
          renderItem={item => (
              <List.Item key={item.title} className="governance-item" onClick={() => history.push(item.href)}>
                <List.Item.Meta
                  avatar={item.badge}
                  title={item.title}
                  description={item.description}
                />
              </List.Item>
          )}
        />
      </Col>
    </Row>
  );
};
