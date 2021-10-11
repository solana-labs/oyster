import { Card, Col, Row, Spin, Statistic, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import { LABELS } from '../../constants';
import {
  ParsedAccount,
  TokenIcon,
  constants,
  ExplorerLink,
} from '@oyster/common';

import ReactMarkdown from 'react-markdown';

import { ProposalStateBadge } from './components/header/proposalStateBadge';
import { contexts } from '@oyster/common';
import { MintInfo } from '@solana/spl-token';
import { InstructionCard } from './components/instruction/instructionCard';
import { NewInstructionCard } from './components/instruction/newInstructionCard';

import './style.less';

import { VoterBubbleGraph } from './components/vote/voterBubbleGraph';
import { VoterTable } from './components/vote/voterTable';
import {
  Governance,
  Proposal,
  ProposalState,
  Realm,
  TokenOwnerRecord,
  VoteRecord,
} from '../../models/accounts';
import { useKeyParam } from '../../hooks/useKeyParam';

import {
  useGovernance,
  useProposal,
  useTokenOwnerRecords,
  useWalletTokenOwnerRecord,
  useInstructionsByProposal,
  useVoteRecordsByProposal,
  useSignatoriesByProposal,
} from '../../hooks/apiHooks';
import BN from 'bn.js';

import { VoteScore } from './components/vote/voteScore';

import { VoteCountdown } from './components/header/voteCountdown';
import { useRealm } from '../../contexts/GovernanceContext';
import { getMintMaxVoteWeight } from '../../tools/units';
import { ProposalActionBar } from './components/buttons/proposalActionBar';

const { TabPane } = Tabs;

const { ZERO } = constants;

export const urlRegex =
  // eslint-disable-next-line
  /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const { useMint } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

export enum VoteType {
  Undecided = 'Undecided',
  Yes = 'Yay',
  No = 'Nay',
}

export const ProposalView = () => {
  const { endpoint } = useConnectionConfig();

  let proposalKey = useKeyParam();
  let proposal = useProposal(proposalKey);

  let governance = useGovernance(proposal?.info.governance);
  let realm = useRealm(governance?.info.realm);

  const governingTokenMint = useMint(proposal?.info.governingTokenMint);

  const voteRecords = useVoteRecordsByProposal(proposal?.pubkey);

  const tokenOwnerRecords = useTokenOwnerRecords(
    governance?.info.realm,
    proposal?.info.isVoteFinalized() // TODO: for finalized votes show a single item for abstained votes
      ? undefined
      : proposal?.info.governingTokenMint,
  );

  if (!realm) {
    return <Spin></Spin>;
  }

  return (
    <>
      <div className="flexColumn">
        {proposal && governance && governingTokenMint ? (
          <InnerProposalView
            proposal={proposal}
            realm={realm}
            governance={governance}
            voterDisplayData={mapVoterDisplayData(
              voteRecords,
              tokenOwnerRecords,
            )}
            governingTokenMint={governingTokenMint}
            endpoint={endpoint}
            hasVotes={voteRecords.length > 0}
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
  proposal,
}: {
  loading: boolean;
  setLoading: (b: boolean) => void;
  setMsg: (b: string) => void;
  setFailed: (b: boolean) => void;
  setContent: (b: string) => void;
  isGist: boolean;
  proposal: ParsedAccount<Proposal>;
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

export interface VoterDisplayData {
  name: string;
  title: string;
  group: string;
  value: BN;
}

function mapVoterDisplayData(
  voteRecords: ParsedAccount<VoteRecord>[],
  tokenOwnerRecords: ParsedAccount<TokenOwnerRecord>[],
): Array<VoterDisplayData> {
  const mapper = (key: string, amount: BN, label: string) => ({
    name: key,
    title: key,
    group: label,
    value: amount,
    key: key,
  });

  const undecidedData = [
    ...tokenOwnerRecords
      .filter(
        tor =>
          !tor.info.governingTokenDepositAmount.isZero() &&
          !voteRecords.some(
            vt =>
              vt.info.governingTokenOwner.toBase58() ===
              tor.info.governingTokenOwner.toBase58(),
          ),
      )
      .map(tor =>
        mapper(
          tor.info.governingTokenOwner.toBase58(),
          tor.info.governingTokenDepositAmount,
          VoteType.Undecided,
        ),
      ),
  ];

  const noVoteData = [
    ...voteRecords
      .filter(vr => vr.info.voteWeight.no?.gt(ZERO))
      .map(vr =>
        mapper(
          vr.info.governingTokenOwner.toBase58(),
          vr.info.voteWeight.no,
          VoteType.No,
        ),
      ),
  ];

  const yesVoteData = [
    ...voteRecords
      .filter(vr => vr.info.voteWeight.yes?.gt(ZERO))
      .map(vr =>
        mapper(
          vr.info.governingTokenOwner.toBase58(),
          vr.info.voteWeight.yes,
          VoteType.Yes,
        ),
      ),
  ];

  const data = [...undecidedData, ...yesVoteData, ...noVoteData].sort((a, b) =>
    b.value.cmp(a.value),
  );

  return data;
}

function InnerProposalView({
  realm,
  proposal,
  governingTokenMint,
  governance,
  voterDisplayData,
  endpoint,
  hasVotes,
}: {
  realm: ParsedAccount<Realm>;
  proposal: ParsedAccount<Proposal>;
  governance: ParsedAccount<Governance>;
  governingTokenMint: MintInfo;
  voterDisplayData: Array<VoterDisplayData>;
  endpoint: string;
  hasVotes: boolean;
}) {
  const tokenOwnerRecord = useWalletTokenOwnerRecord(
    governance.info.realm,
    proposal.info.governingTokenMint,
  );
  const instructions = useInstructionsByProposal(proposal.pubkey);
  const signatories = useSignatoriesByProposal(proposal.pubkey);

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
    proposal: proposal,
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
                <ProposalStateBadge
                  proposal={proposal}
                  governance={governance}
                />
              </Col>
            </Row>
          </Col>
          <Col md={12} xs={24}>
            <ProposalActionBar
              governance={governance}
              proposal={proposal}
              tokenOwnerRecord={tokenOwnerRecord}
            ></ProposalActionBar>
          </Col>
        </Row>

        {hasVotes && (
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
                    data={voterDisplayData}
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
                    total={getMaxVoteScore(realm, proposal, governingTokenMint)}
                    data={voterDisplayData}
                    decimals={governingTokenMint.decimals}
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
              {signatories
                .filter(s => s.info.signedOff)
                .map(s => (
                  <ExplorerLink
                    address={s.info.signatory}
                    type="address"
                    short
                  ></ExplorerLink>
                ))}
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <div className="ant-statistic">
                <div className="ant-statistic-title">
                  {proposal.info.isPreVotingState()
                    ? 'Yes Vote Threshold'
                    : 'Vote Results'}
                </div>
                <div>
                  <VoteScore
                    yesVoteCount={proposal.info.yesVotesCount}
                    noVoteCount={proposal.info.noVotesCount}
                    yesVoteThreshold={getYesVoteThreshold(proposal, governance)}
                    governingMintDecimals={governingTokenMint.decimals}
                    proposalState={proposal.info.state}
                    maxVoteScore={getMaxVoteScore(
                      realm,
                      proposal,
                      governingTokenMint,
                    )}
                    isPreVotingState={proposal.info.isPreVotingState()}
                  ></VoteScore>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <div className="ant-statistic">
                <div className="ant-statistic-title">
                  {proposal.info.isPreVotingState()
                    ? 'Voting Time'
                    : 'Voting Time Left'}
                </div>
                <VoteCountdown
                  proposal={proposal}
                  governance={governance}
                ></VoteCountdown>
              </div>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col span={24}>
            <Tabs
              defaultActiveKey="description"
              size="large"
              style={{ marginBottom: 32 }}
            >
              {proposal.info.descriptionLink && (
                <TabPane tab="Description" key="description">
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
              )}
              <TabPane tab={LABELS.INSTRUCTIONS} key="instructions">
                <Row
                  gutter={[
                    { xs: 8, sm: 16, md: 24, lg: 32 },
                    { xs: 8, sm: 16, md: 24, lg: 32 },
                  ]}
                >
                  {instructions
                    .sort(
                      (i1, i2) =>
                        i1.info.instructionIndex - i2.info.instructionIndex,
                    )
                    .map((instruction, position) => (
                      <Col xs={24} sm={24} md={12} lg={8} key={position}>
                        <InstructionCard
                          proposal={proposal}
                          position={position + 1}
                          proposalInstruction={instruction}
                        />
                      </Col>
                    ))}
                  {proposal.info.state === ProposalState.Draft && (
                    <Col xs={24} sm={24} md={12} lg={8}>
                      <NewInstructionCard
                        proposal={proposal}
                        realm={realm}
                        governance={governance}
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

function getMaxVoteScore(
  realm: ParsedAccount<Realm>,
  proposal: ParsedAccount<Proposal>,
  governingTokenMint: MintInfo,
) {
  if (proposal.info.isVoteFinalized() && proposal.info.maxVoteWeight) {
    return proposal.info.maxVoteWeight;
  }

  if (
    proposal.info.governingTokenMint.toBase58() ===
    realm.info.config.councilMint?.toBase58()
  ) {
    return governingTokenMint.supply;
  }

  return getMintMaxVoteWeight(
    governingTokenMint,
    realm.info.config.communityMintMaxVoteWeightSource,
  );
}

function getYesVoteThreshold(
  proposal: ParsedAccount<Proposal>,
  governance: ParsedAccount<Governance>,
) {
  return proposal.info.isVoteFinalized() &&
    // Note Canceled state is also final but we currently don't capture vote threshold at the cancellation time
    proposal.info.voteThresholdPercentage
    ? proposal.info.voteThresholdPercentage.value
    : governance.info.config.voteThresholdPercentage.value;
}
