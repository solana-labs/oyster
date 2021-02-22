import { Col, List, Row } from 'antd';
import React, { useMemo, useState } from 'react';
import { contexts } from '@oyster/common';
import { useProposals } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { StateBadgeRibbon } from '../../components/Proposal/StateBadge';
import { urlRegex } from '../proposal';
const PAGE_SIZE = 10;

export const HomeView = () => {
  const context = useProposals();
  const [page, setPage] = useState(0);
  const listData = useMemo(() => {
    const newListData: any[][] = [[]];

    Object.keys(context.proposals).forEach(key => {
      const proposal = context.proposals[key];
      newListData[newListData.length - 1].push({
        href: '#/proposal/' + key,
        title: proposal.info.state.name,
        proposal,
        description: proposal.info.state.descLink.match(urlRegex) ? (
          <a href={proposal.info.state.descLink} target={'_blank'}>
            Link to markdown
          </a>
        ) : (
          proposal.info.state.descLink
        ),
      });
      if (newListData[newListData.length - 1].length == PAGE_SIZE)
        newListData.push([]);
    });
    return newListData;
  }, [context.proposals]);

  return (
    <Row>
      <Col flex="auto">
        <List
          itemLayout="vertical"
          size="large"
          pagination={{
            onChange: page => {
              setPage(page);
            },
            pageSize: PAGE_SIZE,
          }}
          dataSource={listData[page]}
          renderItem={item => (
            <StateBadgeRibbon proposal={item.proposal}>
              <List.Item key={item.title}>
                <List.Item.Meta
                  avatar={item.badge}
                  title={<a href={item.href}>{item.title}</a>}
                  description={item.description}
                />
              </List.Item>
            </StateBadgeRibbon>
          )}
        />
      </Col>
    </Row>
  );
};
