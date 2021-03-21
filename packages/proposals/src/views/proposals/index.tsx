import { Col, List, Row } from 'antd';
import React, { useMemo, useState } from 'react';
import { useConfig, useProposals } from '../../contexts/proposals';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { StateBadge, StateBadgeRibbon } from '../../components/Proposal/StateBadge';
import { urlRegex } from '../proposal';
import { useHistory, useParams } from 'react-router-dom';
import { TokenIcon } from '@oyster/common';
import { NewProposalMenuItem } from '../proposal/new';
const PAGE_SIZE = 10;

export const ProposalsView = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const { proposals } = useProposals();
  const config = useConfig(id);
  const [page, setPage] = useState(0);
  const listData = useMemo(() => {
    const newListData: any[] = [];

    Object.keys(proposals).forEach(key => {
      const proposal = proposals[key];
      if(proposal.info.config.toBase58() !== id) {
        return;
      }



      newListData.push({
        href: '/proposal/' + key,
        title: proposal.info.state.name,
        badge: <TokenIcon mintAddress={config?.info.governanceMint} size={30} />,
        status: proposal.info.state.status,
        proposal,
        description: proposal.info.state.descLink.match(urlRegex) ? (
          <a href={proposal.info.state.descLink} target={'_blank'}>
            Link to markdown
          </a>
        ) : (
          proposal.info.state.descLink
        ),
      });
    });
    return newListData;
  }, [proposals]);


  return (
    <Row>
      <Col flex="auto">
        <div className="proposals-header">
          <TokenIcon mintAddress={config?.info.governanceMint} size={40} />
          <h1>{config?.info.name}</h1>

          <NewProposalMenuItem className="proposals-new-btn" />
        </div>
        <List
          itemLayout="vertical"
          size="large"
          pagination={{
            onChange: page => {
              setPage(page);
            },
            pageSize: PAGE_SIZE,
          }}
          dataSource={listData}
          renderItem={item => (
              <List.Item key={item.title}className="proposal-item" onClick={() => history.push(item.href)}>
                <List.Item.Meta
                  avatar={item.badge}
                  title={item.title}
                  description={<StateBadge proposal={item.proposal} />}
                />
              </List.Item>
          )}
        />
      </Col>
    </Row>
  );
};
