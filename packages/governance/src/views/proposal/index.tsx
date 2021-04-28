import { Card, Col, Row, Spin, Statistic, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import { LABELS } from '../../constants';
import { ParsedAccount, TokenIcon } from '@oyster/common';
import {
  INSTRUCTION_LIMIT,
  Governance,
  Proposal,
  ProposalState,
  ProposalStateStatus,
  GovernanceTransaction,
} from '../../models/governance';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useProposals } from '../../contexts/proposals';
import { StateBadge } from '../../components/Proposal/StateBadge';
import { contexts, hooks } from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { InstructionCard } from '../../components/Proposal/InstructionCard';
import { NewInstructionCard } from '../../components/Proposal/NewInstructionCard';
import SignButton from '../../components/Proposal/SignButton';
import AddSigners from '../../components/Proposal/AddSigners';
import MintSourceTokens from '../../components/Proposal/MintSourceTokens';
import { Vote } from '../../components/Proposal/Vote';
import { WithdrawVote } from '../../components/Proposal/WithdrawVote';
import './style.less';
import { useVotingRecords } from '../../hooks/useVotingRecords';
import BN from 'bn.js';
import { VoterBubbleGraph } from '../../components/Proposal/VoterBubbleGraph';
import { VoterTable } from '../../components/Proposal/VoterTable';
const { TabPane } = Tabs;

// eslint-disable-next-line
export const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const { useMint } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;
const { useAccountByMint } = hooks;
//const { useBreakpoint } = Grid;

export enum VoteType {
  Undecided = 'Undecided',
  Yes = 'Yay',
  No = 'Nay',
}

export const ProposalView = () => {
  const context = useProposals();
  const { id } = useParams<{ id: string }>();
  const proposal = context.proposals[id];
  const governance = context.configs[proposal?.info.config.toBase58()];
  const proposalState = context.states[proposal?.info.state.toBase58()];
  const { endpoint } = useConnectionConfig();
  const sigMint = useMint(proposal?.info.signatoryMint);
  const votingMint = useMint(proposal?.info.votingMint);

  const sourceMint = useMint(proposal?.info.sourceMint);
  const yesVotingMint = useMint(proposal?.info.yesVotingMint);
  const noVotingMint = useMint(proposal?.info.noVotingMint);

  const votingRecords = useVotingRecords(proposal?.pubkey);

  return (
    <div className="flexColumn">
      {proposal &&
      sigMint &&
      votingMint &&
      sourceMint &&
      yesVotingMint &&
      noVotingMint ? (
        <InnerProposalView
          proposal={proposal}
          proposalState={proposalState}
          governance={governance}
          sourceMint={sourceMint}
          votingMint={votingMint}
          yesVotingMint={yesVotingMint}
          noVotingMint={noVotingMint}
          votingDisplayData={voterDisplayData(votingRecords)}
          sigMint={sigMint}
          instructions={context.transactions}
          endpoint={endpoint}
        />
      ) : (
        <Spin />
      )}
    </div>
  );
};

function useLoadGist({
  loading,
  setLoading,
  setFailed,
  setMsg,
  setContent,
  isGist,
  proposalState,
}: {
  loading: boolean;
  setLoading: (b: boolean) => void;
  setMsg: (b: string) => void;
  setFailed: (b: boolean) => void;
  setContent: (b: string) => void;
  isGist: boolean;
  proposalState: ParsedAccount<ProposalState>;
}) {
  useMemo(() => {
    if (loading) {
      let toFetch = proposalState.info.descLink;
      const pieces = toFetch.match(urlRegex);
      if (isGist && pieces) {
        const justIdWithoutUser = pieces[1].split('/')[2];
        toFetch = 'https://api.github.com/gists/' + justIdWithoutUser;
      }
      fetch(toFetch)
        .then(async resp => {
          if (resp.status === 200) {
            if (isGist) {
              const jsonContent = await resp.json();
              const nextUrlFileName = Object.keys(jsonContent['files'])[0];
              const nextUrl = jsonContent['files'][nextUrlFileName]['raw_url'];
              fetch(nextUrl).then(async response =>
                setContent(await response.text()),
              );
            } else setContent(await resp.text());
          } else {
            if (resp.status === 403 && isGist)
              setMsg(LABELS.GIT_CONTENT_EXCEEDED);
            setFailed(true);
          }
          setLoading(false);
        })
        .catch(_ => {
          setFailed(true);
          setLoading(false);
        });
    }
  }, [loading]); //eslint-disable-line
}
interface PartialGovernanceRecord {
  info: { yesCount: BN; noCount: BN; undecidedCount: BN };
}

export interface VoterDisplayData {
  name: string;
  title: string;
  group: string;
  value: number;
}

function voterDisplayData(
  governanceVotingRecords: Record<string, PartialGovernanceRecord>,
): Array<VoterDisplayData> {
  const mapper = (key: string, amount: number, label: string) => ({
    name: key,
    title: key,
    group: label,
    value: amount,
    key: key,
  });

  const undecidedData = [
    ...Object.keys(governanceVotingRecords)
      .filter(
        key => governanceVotingRecords[key].info.undecidedCount.toNumber() > 0,
      )
      .map(key =>
        mapper(
          key,
          governanceVotingRecords[key].info.undecidedCount.toNumber(),
          VoteType.Undecided,
        ),
      ),
  ];

  const noData = [
    ...Object.keys(governanceVotingRecords)
      .filter(key => governanceVotingRecords[key].info.noCount.toNumber() > 0)
      .map(key =>
        mapper(
          key,
          governanceVotingRecords[key].info.noCount.toNumber(),
          VoteType.No,
        ),
      ),
  ];

  const yesData = [
    ...Object.keys(governanceVotingRecords)
      .filter(key => governanceVotingRecords[key].info.yesCount.toNumber() > 0)
      .map(key =>
        mapper(
          key,
          governanceVotingRecords[key].info.yesCount.toNumber(),
          VoteType.Yes,
        ),
      ),
  ];

  const data = [...undecidedData, ...yesData, ...noData].sort(
    (a, b) => b.value - a.value,
  );

  return data;
}

function InnerProposalView({
  proposal,
  proposalState,
  sigMint,
  votingMint,
  yesVotingMint,
  noVotingMint,
  instructions,
  governance,
  sourceMint,
  votingDisplayData,
  endpoint,
}: {
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;
  proposalState: ParsedAccount<ProposalState>;
  sigMint: MintInfo;
  votingMint: MintInfo;
  yesVotingMint: MintInfo;
  noVotingMint: MintInfo;
  sourceMint: MintInfo;
  instructions: Record<string, ParsedAccount<GovernanceTransaction>>;
  votingDisplayData: Array<VoterDisplayData>;
  endpoint: string;
}) {
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);
  const adminAccount = useAccountByMint(proposal.info.adminMint);

  const instructionsForProposal: ParsedAccount<GovernanceTransaction>[] = proposalState.info.proposalTransactions
    .map(k => instructions[k.toBase58()])
    .filter(k => k);
  const isUrl = !!proposalState.info.descLink.match(urlRegex);
  const isGist =
    !!proposalState.info.descLink.match(/gist/i) &&
    !!proposalState.info.descLink.match(/github/i);
  const [content, setContent] = useState(proposalState.info.descLink);
  const [loading, setLoading] = useState(isUrl);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState('');
  const [width, setWidth] = useState<number>();
  const [height, setHeight] = useState<number>();
  //  const breakpoint = useBreakpoint();

  useLoadGist({
    loading,
    setLoading,
    setFailed,
    setMsg,
    setContent,
    isGist,
    proposalState: proposalState,
  });

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
                <h1>{proposalState.info.name}</h1>
                <StateBadge state={proposalState} />
              </Col>
            </Row>
          </Col>
          <Col md={12} xs={24}>
            <div className="proposal-actions">
              {adminAccount &&
                adminAccount.info.amount.toNumber() === 1 &&
                proposalState.info.status === ProposalStateStatus.Draft && (
                  <AddSigners proposal={proposal} state={proposalState} />
                )}
              {sigAccount &&
                sigAccount.info.amount.toNumber() === 1 &&
                proposalState.info.status === ProposalStateStatus.Draft && (
                  <SignButton proposal={proposal} state={proposalState} />
                )}
              <MintSourceTokens
                governance={governance}
                useGovernance={
                  proposal.info.sourceMint.toBase58() ===
                  governance.info.governanceMint.toBase58()
                }
              />
              <WithdrawVote proposal={proposal} state={proposalState} />
              <Vote
                governance={governance}
                proposal={proposal}
                state={proposalState}
                yeahVote={true}
              />
              <Vote
                governance={governance}
                proposal={proposal}
                state={proposalState}
                yeahVote={false}
              />
            </div>
          </Col>
        </Row>

        {votingDisplayData.length > 0 && (
          <Row
            gutter={[
              { xs: 8, sm: 16, md: 24, lg: 32 },
              { xs: 8, sm: 16, md: 24, lg: 32 },
            ]}
            className="proposals-visual"
          >
            <Col md={12} sm={24} xs={24}>
              <Card
                style={{ height: '100%' }}
                title={LABELS.LARGEST_VOTERS_BUBBLE}
              >
                {width && height && (
                  <VoterBubbleGraph
                    endpoint={endpoint}
                    width={width}
                    height={height}
                    data={votingDisplayData}
                  />
                )}
              </Card>
            </Col>
            <Col md={12} sm={24} xs={24}>
              <Card
                style={{ height: '100%' }}
                title={LABELS.LARGEST_VOTERS_TABLE}
              >
                <div
                  ref={r => {
                    if (r) {
                      setHeight(r.clientHeight);
                      setWidth(r.clientWidth);
                    }
                  }}
                >
                  <VoterTable
                    endpoint={endpoint}
                    total={
                      votingMint.supply.toNumber() +
                      yesVotingMint.supply.toNumber() +
                      noVotingMint.supply.toNumber()
                    }
                    data={votingDisplayData}
                  />
                </div>
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
                  proposalState.info.totalSigningTokensMinted.toNumber() -
                  sigMint.supply.toNumber()
                }
                suffix={`/ ${proposalState.info.totalSigningTokensMinted.toNumber()}`}
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
                value={getVotesRequired(governance, sourceMint)}
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
                      <a
                        href={proposalState.info.descLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
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
                        state={proposalState}
                      />
                    </Col>
                  ))}
                  {instructionsForProposal.length < INSTRUCTION_LIMIT &&
                    proposalState.info.status === ProposalStateStatus.Draft && (
                      <Col xs={24} sm={24} md={12} lg={8}>
                        <NewInstructionCard
                          proposal={proposal}
                          state={proposalState}
                          config={governance}
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
  governance: ParsedAccount<Governance>,
  sourceMint: MintInfo,
): number {
  return governance.info.voteThreshold === 100
    ? sourceMint.supply.toNumber()
    : Math.ceil(
        (governance.info.voteThreshold / 100) * sourceMint.supply.toNumber(),
      );
}
