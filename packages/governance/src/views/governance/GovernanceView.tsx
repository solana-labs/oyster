import { Avatar, Col, List, Row } from 'antd';
import React, { useMemo, useState } from 'react';
import {
  useGovernance,
  useProposals,
  useRealm,
} from '../../contexts/GovernanceContext';
import './style.less'; // Don't remove this line, it will break dark mode if you do due to weird transpiling conditions
import { StateBadge } from '../proposal/components/StateBadge';
import { useHistory } from 'react-router-dom';
import {
  ExplorerLink,
  TokenIcon,
  useConnectionConfig,
  useMint,
  useWallet,
} from '@oyster/common';
import { NewProposal } from './NewProposal';
import { useKeyParam } from '../../hooks/useKeyParam';
import { Proposal, ProposalState } from '../../models/accounts';
import { size } from 'lodash';
const PAGE_SIZE = 10;

export const GovernanceView = () => {
  const history = useHistory();

  const [, setPage] = useState(0);
  const { tokenMap } = useConnectionConfig();
  const { connected } = useWallet();

  const governanceKey = useKeyParam();
  const governance = useGovernance(governanceKey);
  const realm = useRealm(governance?.info.config.realm);
  const proposals = useProposals(governanceKey);

  const communityTokenMint = realm?.info.communityMint;

  const token = tokenMap.get(communityTokenMint?.toBase58() || '') as any;
  const tokenBackground =
    token?.extensions?.background ||
    'https://solana.com/static/8c151e179d2d7e80255bdae6563209f2/6833b/validators.webp';

  const mint = communityTokenMint?.toBase58() || '';

  // We don't support MintGovernance account yet, but we can check the governed account type here
  const governedMint = useMint(governance?.info.config.governedAccount);
  const color = governance?.info.isProgramGovernance() ? 'green' : 'gray';

  const proposalItems = useMemo(() => {
    const getCompareKey = (p: Proposal) =>
      `${p.state === ProposalState.Voting ? 0 : 1}${p.name}`;

    return proposals
      .sort((p1, p2) =>
        getCompareKey(p1.info).localeCompare(getCompareKey(p2.info)),
      )
      .map(p => ({
        key: p.pubkey.toBase58(),
        href: '/proposal/' + p.pubkey,
        title: p.info.name,
        badge: <TokenIcon mintAddress={p.info.governingTokenMint} size={30} />,
        state: p.info.state,
      }));
  }, [proposals]);

  return (
    <Row
      style={{
        background: `url(${tokenBackground})`,
        minHeight: '100%',
        backgroundRepeat: 'repeat-y',
        backgroundSize: 'cover',
      }}
    >
      <Col flex="auto" xxl={15} xs={24} className="proposals-container">
        <div className="proposals-header">
          {governedMint ? (
            <TokenIcon
              mintAddress={governance?.info.config.governedAccount}
              size={60}
            />
          ) : (
            <Avatar style={{ background: color, marginRight: 5 }} size={60}>
              {governance?.info.config.governedAccount.toBase58().slice(0, 5)}
            </Avatar>
          )}
          <div>
            <h1>{realm?.info.name}</h1>
            <h2>
              {governance && (
                <ExplorerLink
                  address={governance.info.config.governedAccount}
                  type="address"
                />
              )}
            </h2>
            <a
              href={tokenMap.get(mint)?.extensions?.website}
              target="_blank"
              rel="noopener noreferrer"
            >
              {tokenMap.get(mint)?.extensions?.website}
            </a>
          </div>

          <NewProposal
            props={{ className: 'proposals-new-btn', disabled: !connected }}
            governance={governance}
            realm={realm}
            // disabled={!connected}
          />
        </div>
        <h1 className="proposals-list-title">Proposals</h1>
        <List
          itemLayout="vertical"
          size="large"
          pagination={{
            onChange: page => {
              setPage(page);
            },
            pageSize: PAGE_SIZE,
          }}
          dataSource={proposalItems}
          renderItem={item => (
            <List.Item
              key={item.key}
              className="proposal-item"
              onClick={() => history.push(item.href)}
            >
              <List.Item.Meta
                avatar={item.badge}
                title={item.title}
                description={<StateBadge state={item.state} />}
              />
            </List.Item>
          )}
        />
      </Col>
    </Row>
  );
};
