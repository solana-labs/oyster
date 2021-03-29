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
import { ParsedAccount, TokenIcon } from '@oyster/common';
import {
  ConsensusAlgorithm,
  INSTRUCTION_LIMIT,
  TimelockConfig,
  TimelockSet,
  TimelockState,
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
import MintSourceTokens from '../../components/Proposal/MintSourceTokens';
import { Vote } from '../../components/Proposal/Vote';
import { RegisterToVote } from '../../components/Proposal/RegisterToVote';
import { WithdrawTokens } from '../../components/Proposal/WithdrawTokens';
import './style.less';
import { getVoteAccountHolders } from '../../utils/lookups';
import BN from 'bn.js';
import { VoterBubbleGraph } from '../../components/Proposal/VoterBubbleGraph';
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
  const timelockState = context.states[proposal?.info.state.toBase58()];
  const { endpoint } = useConnectionConfig();
  const sigMint = useMint(proposal?.info.signatoryMint);
  const votingMint = useMint(proposal?.info.votingMint);

  const sourceMint = useMint(proposal?.info.sourceMint);
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
  return (
    <div className="flexColumn">
      {proposal && sigMint && votingMint && sourceMint && yesVotingMint ? (
        <InnerProposalView
          proposal={proposal}
          timelockState={timelockState}
          timelockConfig={timelockConfig}
          sourceMint={sourceMint}
          votingMint={votingMint}
          yesVotingMint={yesVotingMint}
          votingAccounts={votingAccounts}
          yesVotingAccounts={yesVotingAccounts}
          noVotingAccounts={noVotingAccounts}
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
  timelockState,
  sigMint,
  votingMint,
  yesVotingMint,
  instructions,
  timelockConfig,
  sourceMint,
  votingAccounts,
  yesVotingAccounts,
  noVotingAccounts,
}: {
  proposal: ParsedAccount<TimelockSet>;
  timelockConfig: ParsedAccount<TimelockConfig>;
  timelockState: ParsedAccount<TimelockState>;
  sigMint: MintInfo;
  votingMint: MintInfo;
  yesVotingMint: MintInfo;
  sourceMint: MintInfo;
  instructions: Record<string, ParsedAccount<TimelockTransaction>>;
  votingAccounts: Record<string, { amount: BN }>;
  yesVotingAccounts: Record<string, { amount: BN }>;
  noVotingAccounts: Record<string, { amount: BN }>;
}) {
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);
  const adminAccount = useAccountByMint(proposal.info.adminMint);
  const config = useConfig(proposal.info.config.toBase58());

  const instructionsForProposal: ParsedAccount<TimelockTransaction>[] = timelockState.info.timelockTransactions
    .map(k => instructions[k.toBase58()])
    .filter(k => k);
  const isUrl = !!timelockState.info.descLink.match(urlRegex);
  const isGist =
    !!timelockState.info.descLink.match(/gist/i) &&
    !!timelockState.info.descLink.match(/github/i);
  const [content, setContent] = useState(timelockState.info.descLink);
  const [loading, setLoading] = useState(isUrl);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState('');
  const breakpoint = useBreakpoint();

  useMemo(() => {
    if (loading) {
      let toFetch = timelockState.info.descLink;
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
                mintAddress={proposal?.info.sourceMint.toBase58()}
                size={60}
              />
              <Col>
                <h1>{timelockState.info.name}</h1>
                <StateBadge state={timelockState} />
              </Col>
            </Row>
          </Col>
          <Col md={12} xs={24}>
            <div className="proposal-actions">
              {adminAccount &&
                adminAccount.info.amount.toNumber() === 1 &&
                timelockState.info.status === TimelockStateStatus.Draft && (
                  <AddSigners proposal={proposal} state={timelockState} />
                )}
              {sigAccount &&
                sigAccount.info.amount.toNumber() === 1 &&
                timelockState.info.status === TimelockStateStatus.Draft && (
                  <SignButton proposal={proposal} state={timelockState} />
                )}
              <MintSourceTokens
                timelockConfig={timelockConfig}
                useGovernance={
                  proposal.info.sourceMint.toBase58() ===
                  timelockConfig.info.governanceMint.toBase58()
                }
              />
              <RegisterToVote
                timelockConfig={timelockConfig}
                proposal={proposal}
                state={timelockState}
              />
              <WithdrawTokens
                timelockConfig={timelockConfig}
                proposal={proposal}
                state={timelockState}
              />
              <Vote
                proposal={proposal}
                timelockConfig={timelockConfig}
                state={timelockState}
              />
            </div>
          </Col>
        </Row>
        {false && (
          <Row className="proposals-visual">
            <Col md={24} xs={24}>
              <Card>
                <VoterBubbleGraph
                  width={400}
                  height={400}
                  noVotingAccounts={{}}
                  yesVotingAccounts={{}}
                  votingAccounts={{ '1': { amount: new BN(100) } }}
                />
              </Card>
            </Col>
          </Row>
        )}
        <Row className="proposals-stats">
          <Col md={7} xs={24}>
            <Card>
              <Statistic
                title={LABELS.SIG_GIVEN}
                value={
                  timelockState.info.totalSigningTokensMinted.toNumber() -
                  sigMint.supply.toNumber()
                }
                suffix={`/ ${timelockState.info.totalSigningTokensMinted.toNumber()}`}
              />
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <Statistic
                title={LABELS.VOTES_CAST}
                value={yesVotingMint.supply.toNumber()}
                suffix={`/ ${sourceMint.supply.toNumber()}`}
              />
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <Statistic
                valueStyle={{ color: 'green' }}
                title={LABELS.VOTES_REQUIRED}
                value={getVotesRequired(timelockConfig, sourceMint)}
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
                      <a href={timelockState.info.descLink} target="_blank">
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
                        state={timelockState}
                      />
                    </Col>
                  ))}
                  {instructionsForProposal.length < INSTRUCTION_LIMIT &&
                    timelockState.info.status === TimelockStateStatus.Draft && (
                      <Col xs={24} sm={24} md={12} lg={8}>
                        <NewInstructionCard
                          proposal={proposal}
                          state={timelockState}
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
  sourceMint: MintInfo,
): number {
  if (timelockConfig.info.consensusAlgorithm === ConsensusAlgorithm.Majority) {
    return Math.ceil(sourceMint.supply.toNumber() * 0.5);
  } else if (
    timelockConfig.info.consensusAlgorithm === ConsensusAlgorithm.SuperMajority
  ) {
    return Math.ceil(sourceMint.supply.toNumber() * 0.66);
  } else if (
    timelockConfig.info.consensusAlgorithm === ConsensusAlgorithm.FullConsensus
  ) {
    return sourceMint.supply.toNumber();
  }
  return 0;
}
