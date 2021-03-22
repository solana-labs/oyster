import {
  Card,
  Col,
  Divider,
  Grid,
  Row,
  Space,
  Spin,
  Statistic,
  Tabs,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { LABELS } from '../../constants';
import { ParsedAccount, TokenDisplay, TokenIcon } from '@oyster/common';
import {
  ConsensusAlgorithm,
  INSTRUCTION_LIMIT,
  TimelockConfig,
  TimelockSet,
  TimelockStateStatus,
  TimelockTransaction,
} from '../../models/timelock';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useConfig, useProposals } from '../../contexts/proposals';
import { StateBadge } from '../../components/Proposal/StateBadge';
import { contexts, hooks } from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { InstructionCard } from '../../components/Proposal/InstructionCard';
import { NewInstructionCard } from '../../components/Proposal/NewInstructionCard';
import SignButton from '../../components/Proposal/SignButton';
import AddSigners from '../../components/Proposal/AddSigners';
import MintGovernanceTokens from '../../components/Proposal/MintGovernanceTokens';
import { Vote } from '../../components/Proposal/Vote';
import { RegisterToVote } from '../../components/Proposal/RegisterToVote';
import { WithdrawTokens } from '../../components/Proposal/WithdrawTokens';
import './style.less';
import { getVoteAccountHolders } from '../../utils/lookups';
const { TabPane } = Tabs;

export const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const { useMint } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;
const { useAccountByMint } = hooks;
const { useBreakpoint } = Grid;

export const ProposalView = () => {
  const context = useProposals();
  const { id } = useParams<{ id: string }>();
  const proposal = context.proposals[id];
  const timelockConfig = context.configs[proposal?.info.config.toBase58()];
  const { endpoint } = useConnectionConfig();
  const sigMint = useMint(proposal?.info.signatoryMint);
  const votingMint = useMint(proposal?.info.votingMint);
  const governanceMint = useMint(timelockConfig?.info.governanceMint);
  const yesVotingMint = useMint(proposal?.info.yesVotingMint);
  const [votingAccounts, setVotingAccounts] = useState<any>({});
  const [yesVotingAccounts, setYesVotingAccounts] = useState<any>({});
  const [noVotingAccounts, setNoVotingAccounts] = useState<any>({});
  useEffect(() => {
    getVoteAccountHolders(proposal?.info.votingMint, endpoint).then(
      setVotingAccounts,
    );
    getVoteAccountHolders(proposal?.info.yesVotingMint, endpoint).then(
      setYesVotingAccounts,
    );
    getVoteAccountHolders(proposal?.info.noVotingMint, endpoint).then(
      setNoVotingAccounts,
    );
  }, [proposal]);
  console.log(
    'Voting accounts',
    votingAccounts,
    yesVotingAccounts,
    noVotingAccounts,
  );
  return (
    <div className="flexColumn">
      {proposal && sigMint && votingMint && governanceMint && yesVotingMint ? (
        <InnerProposalView
          proposal={proposal}
          timelockConfig={timelockConfig}
          governanceMint={governanceMint}
          votingMint={votingMint}
          yesVotingMint={yesVotingMint}
          sigMint={sigMint}
          instructions={context.transactions}
        />
      ) : (
        <Spin />
      )}
    </div>
  );
};

function InnerProposalView({
  proposal,
  sigMint,
  votingMint,
  yesVotingMint,
  instructions,
  timelockConfig,
  governanceMint,
}: {
  proposal: ParsedAccount<TimelockSet>;
  timelockConfig: ParsedAccount<TimelockConfig>;
  sigMint: MintInfo;
  votingMint: MintInfo;
  yesVotingMint: MintInfo;
  governanceMint: MintInfo;
  instructions: Record<string, ParsedAccount<TimelockTransaction>>;
}) {
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);
  const adminAccount = useAccountByMint(proposal.info.adminMint);
  const config = useConfig(proposal.info.config.toBase58());

  const instructionsForProposal: ParsedAccount<TimelockTransaction>[] = proposal.info.state.timelockTransactions
    .map(k => instructions[k.toBase58()])
    .filter(k => k);
  const isUrl = !!proposal.info.state.descLink.match(urlRegex);
  const isGist =
    !!proposal.info.state.descLink.match(/gist/i) &&
    !!proposal.info.state.descLink.match(/github/i);
  const [content, setContent] = useState(proposal.info.state.descLink);
  const [loading, setLoading] = useState(isUrl);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState('');
  const breakpoint = useBreakpoint();

  useMemo(() => {
    if (loading) {
      let toFetch = proposal.info.state.descLink;
      const pieces = toFetch.match(urlRegex);
      if (isGist && pieces) {
        const justIdWithoutUser = pieces[1].split('/')[2];
        toFetch = 'https://api.github.com/gists/' + justIdWithoutUser;
      }
      fetch(toFetch)
        .then(async resp => {
          if (resp.status == 200) {
            if (isGist) {
              const jsonContent = await resp.json();
              const nextUrlFileName = Object.keys(jsonContent['files'])[0];
              const nextUrl = jsonContent['files'][nextUrlFileName]['raw_url'];
              fetch(nextUrl).then(async response =>
                setContent(await response.text()),
              );
            } else setContent(await resp.text());
          } else {
            if (resp.status == 403 && isGist)
              setMsg(
                'Gist Github API limit exceeded. Click to view on Github directly.',
              );
            setFailed(true);
          }
          setLoading(false);
        })
        .catch(response => {
          setFailed(true);
          setLoading(false);
        });
    }
  }, [loading]);

  return (
    <Row>
      <Col flex="auto" xxl={15} xs={24} className="proposal-container">
        <Row justify="center" align="middle" className="proposal-header">
          <Col md={12} xs={24}>
            <Row>
              <TokenIcon
                mintAddress={config?.info.governanceMint.toBase58()}
                size={60}
              />
              <Col>
                <h1>{proposal.info.state.name}</h1>
                <StateBadge proposal={proposal} />
              </Col>
            </Row>
          </Col>
          <Col md={12} xs={24}>
            <div className="proposal-actions">
              {adminAccount &&
                adminAccount.info.amount.toNumber() === 1 &&
                proposal.info.state.status === TimelockStateStatus.Draft && (
                  <AddSigners proposal={proposal} />
                )}
              {sigAccount &&
                sigAccount.info.amount.toNumber() === 1 &&
                proposal.info.state.status === TimelockStateStatus.Draft && (
                  <SignButton proposal={proposal} />
                )}
              <MintGovernanceTokens timelockConfig={timelockConfig} />
              <RegisterToVote
                timelockConfig={timelockConfig}
                proposal={proposal}
              />
              <WithdrawTokens
                timelockConfig={timelockConfig}
                proposal={proposal}
              />
              <Vote proposal={proposal} timelockConfig={timelockConfig} />
            </div>
          </Col>
        </Row>

        <Row className="proposals-stats">
          <Col md={7} xs={24}>
            <Card>
              <Statistic
                title={LABELS.SIG_GIVEN}
                value={
                  proposal.info.state.totalSigningTokensMinted.toNumber() -
                  sigMint.supply.toNumber()
                }
                suffix={`/ ${proposal.info.state.totalSigningTokensMinted.toNumber()}`}
              />
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <Statistic
                title={LABELS.VOTES_CAST}
                value={yesVotingMint.supply.toNumber()}
                suffix={`/ ${governanceMint.supply.toNumber()}`}
              />
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <Statistic
                valueStyle={{ color: 'green' }}
                title={LABELS.VOTES_REQUIRED}
                value={getVotesRequired(timelockConfig, governanceMint)}
              />
            </Card>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Tabs
              defaultActiveKey="1"
              size="large"
              style={{ marginBottom: 32 }}
            >
              <TabPane tab="Description" key="1">
                {loading ? (
                  <Spin />
                ) : isUrl ? (
                  failed ? (
                    <p>
                      {LABELS.DESCRIPTION}:{' '}
                      <a href={proposal.info.state.descLink} target="_blank">
                        {msg ? msg : LABELS.NO_LOAD}
                      </a>
                    </p>
                  ) : (
                    <ReactMarkdown children={content} />
                  )
                ) : (
                  content
                )}
              </TabPane>
              <TabPane tab="Executable" key="2">
                <Row
                  gutter={[
                    { xs: 8, sm: 16, md: 24, lg: 32 },
                    { xs: 8, sm: 16, md: 24, lg: 32 },
                  ]}
                >
                  {instructionsForProposal.map((instruction, position) => (
                    <Col xs={24} sm={24} md={12} lg={8} key={position}>
                      <InstructionCard
                        proposal={proposal}
                        position={position + 1}
                        instruction={instruction}
                      />
                    </Col>
                  ))}
                  {instructionsForProposal.length < INSTRUCTION_LIMIT &&
                    proposal.info.state.status ===
                      TimelockStateStatus.Draft && (
                      <Col xs={24} sm={24} md={12} lg={8}>
                        <NewInstructionCard
                          proposal={proposal}
                          config={timelockConfig}
                          position={instructionsForProposal.length}
                        />
                      </Col>
                    )}
                </Row>
              </TabPane>
            </Tabs>
          </Col>
        </Row>
      </Col>
    </Row>
  );
}

function getVotesRequired(
  timelockConfig: ParsedAccount<TimelockConfig>,
  governanceMint: MintInfo,
): number {
  if (timelockConfig.info.consensusAlgorithm === ConsensusAlgorithm.Majority) {
    return Math.ceil(governanceMint.supply.toNumber() * 0.5);
  } else if (
    timelockConfig.info.consensusAlgorithm === ConsensusAlgorithm.SuperMajority
  ) {
    return Math.ceil(governanceMint.supply.toNumber() * 0.66);
  } else if (
    timelockConfig.info.consensusAlgorithm === ConsensusAlgorithm.FullConsensus
  ) {
    return governanceMint.supply.toNumber();
  }
  return 0;
}
