import { Card, Col, Row, Spin, Statistic, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import { LABELS } from '../../constants';
import { ParsedAccount, TokenIcon } from '@oyster/common';
import {
  INSTRUCTION_LIMIT,
  GovernanceTransaction,
  ProposalOld,
} from '../../models/serialisation';

import ReactMarkdown from 'react-markdown';
import {
  useGovernance,
  useProposal,
  useSignatoryRecord,
  useTokenOwnerRecord,
} from '../../contexts/proposals';
import { StateBadge } from '../../components/Proposal/StateBadge';
import { contexts, hooks } from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { InstructionCard } from '../../components/Proposal/InstructionCard';
import { NewInstructionCard } from '../../components/Proposal/NewInstructionCard';
import SignOffButton from '../../components/Proposal/SignOffButton';
import AddSigners from '../../components/Proposal/AddSigners';

import { CastVote } from '../../components/Proposal/CastVote';
import { WithdrawVote } from '../../components/Proposal/WithdrawVote';
import './style.less';
import { useVotingRecords } from '../../hooks/useVotingRecords';
import BN from 'bn.js';
import { VoterBubbleGraph } from '../../components/Proposal/VoterBubbleGraph';
import { VoterTable } from '../../components/Proposal/VoterTable';
import { Governance, Proposal, ProposalState } from '../../models/accounts';
import { useKeyParam } from '../../hooks/useKeyParam';
import { Vote } from '../../models/instructions';
const { TabPane } = Tabs;

export const urlRegex =
  // eslint-disable-next-line
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const { useMint } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;
const { useAccountByMint } = hooks;
//const { useBreakpoint } = Grid;

export enum VoteType {
  Undecided = 'Undecided',
  Yes = 'Yay',
  No = 'Nay',
}

const getDefaultProposalOld = (): ParsedAccount<ProposalOld> | null => {
  return null;
};

export const ProposalView = () => {
  const proposalOld = getDefaultProposalOld();

  const { endpoint } = useConnectionConfig();

  let proposalKey = useKeyParam();
  let proposal = useProposal(proposalKey);

  let governance = useGovernance(proposal?.info.governance);

  const governingTokenMint = useMint(proposal?.info.governingTokenMint);
  const votingRecords = useVotingRecords(proposalOld?.pubkey);

  return (
    <>
      <div className="flexColumn">
        {proposal && governance && governingTokenMint ? (
          <InnerProposalView
            proposal={proposal}
            governance={governance}
            votingDisplayData={voterDisplayData(votingRecords)}
            governingTokenMint={governingTokenMint}
            endpoint={endpoint}
          />
        ) : (
          <Spin />
        )}
      </div>
    </>
  );
};

function useLoadGist({
  loading,
  setLoading,
  setFailed,
  setMsg,
  setContent,
  isGist,
  proposalState: proposal,
}: {
  loading: boolean;
  setLoading: (b: boolean) => void;
  setMsg: (b: string) => void;
  setFailed: (b: boolean) => void;
  setContent: (b: string) => void;
  isGist: boolean;
  proposalState: ParsedAccount<Proposal>;
}) {
  useMemo(() => {
    if (loading) {
      let toFetch = proposal.info.descriptionLink;
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
  governingTokenMint,

  governance,

  votingDisplayData,
  endpoint,
}: {
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;

  governingTokenMint: MintInfo;

  votingDisplayData: Array<VoterDisplayData>;
  endpoint: string;
}) {
  const adminAccount = useAccountByMint(proposal.info.governingTokenMint);
  let signatoryRecord = useSignatoryRecord(proposal.pubkey);
  const tokenOwnerRecord = useTokenOwnerRecord(governance.info.config.realm);

  const instructionsForProposal: ParsedAccount<GovernanceTransaction>[] = [];
  // proposalState.info.proposalTransactions
  //   .map(k => instructions[k.toBase58()])
  //   .filter(k => k);

  const isUrl = !!proposal.info.descriptionLink.match(urlRegex);
  const isGist =
    !!proposal.info.descriptionLink.match(/gist/i) &&
    !!proposal.info.descriptionLink.match(/github/i);
  const [content, setContent] = useState(proposal.info.descriptionLink);
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
    proposalState: proposal,
  });

  return (
    <Row>
      <Col flex="auto" xxl={15} xs={24} className="proposal-container">
        <Row justify="center" align="middle" className="proposal-header">
          <Col md={12} xs={24}>
            <Row>
              <TokenIcon
                mintAddress={proposal?.info.governingTokenMint.toBase58()}
                size={60}
              />
              <Col>
                <h1>{proposal.info.name}</h1>
                <StateBadge state={proposal.info.state} />
              </Col>
            </Row>
          </Col>
          <Col md={12} xs={24}>
            <div className="proposal-actions">
              {adminAccount &&
                adminAccount.info.amount.toNumber() === 1 &&
                proposal.info.state === ProposalState.Draft && (
                  <AddSigners proposal={proposal} />
                )}

              {signatoryRecord &&
                (proposal.info.state === ProposalState.Draft ||
                  proposal.info.state === ProposalState.SigningOff) && (
                  <SignOffButton signatoryRecord={signatoryRecord} />
                )}

              <WithdrawVote proposal={proposal} />
              {tokenOwnerRecord && (
                <>
                  <CastVote
                    governance={governance}
                    proposal={proposal}
                    tokenOwnerRecord={tokenOwnerRecord}
                    vote={Vote.Yes}
                  />
                  <CastVote
                    governance={governance}
                    proposal={proposal}
                    vote={Vote.No}
                    tokenOwnerRecord={tokenOwnerRecord}
                  />
                </>
              )}
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
                    total={governingTokenMint.supply.toNumber()}
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
                title={LABELS.SIGNATORIES}
                value={proposal.info.signatoriesCount}
                suffix={`/ ${proposal.info.signatoriesSignedOffCount}`}
              />
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <Statistic
                title={LABELS.VOTES_IN_FAVOUR}
                value={proposal.info.yesVotesCount.toNumber()}
                suffix={`/ ${governingTokenMint.supply.toNumber()}`}
              />
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <Statistic
                valueStyle={{ color: 'green' }}
                title={LABELS.VOTES_REQUIRED}
                value={getMinRequiredYesVotes(governance, governingTokenMint)}
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
                        href={proposal.info.descriptionLink}
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
                      />
                    </Col>
                  ))}
                  {instructionsForProposal.length < INSTRUCTION_LIMIT &&
                    proposal.info.state === ProposalState.Draft && (
                      <Col xs={24} sm={24} md={12} lg={8}>
                        <NewInstructionCard
                          proposal={proposal}
                          governance={governance}
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

function getMinRequiredYesVotes(
  governance: ParsedAccount<Governance>,
  governingTokenMint: MintInfo,
): number {
  return governance.info.config.yesVoteThresholdPercentage === 100
    ? governingTokenMint.supply.toNumber()
    : Math.ceil(
        (governance.info.config.yesVoteThresholdPercentage / 100) *
          governingTokenMint.supply.toNumber(),
      );
}
