import { Button, Card, Col, Row, Spin, Statistic, Tabs } from 'antd';
import React, { useMemo, useState } from 'react';
import { LABELS } from '../../constants';
import { TokenIcon, constants, ExplorerLink } from '@oyster/common';

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
} from '@solana/spl-governance';
import { useKeyParam } from '../../hooks/useKeyParam';

import {
  useGovernance,
  useProposal,
  useTokenOwnerRecords,
  useWalletTokenOwnerRecord,
  useVoterWeightRecord,
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
import { ProgramAccount } from '@solana/spl-governance';
import { DryRunProposalButton } from './components/instruction/buttons/dryRunProposalButton';
import { useGovernanceMeta } from '../../hooks/useGovernanceMeta';
import { useHistory } from 'react-router-dom';

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

  let governance = useGovernance(proposal?.account.governance);
  let realm = useRealm(governance?.account.realm);

  const governingTokenMint = useMint(proposal?.account.governingTokenMint);

  const voteRecords = useVoteRecordsByProposal(proposal?.pubkey);

  const tokenOwnerRecords = useTokenOwnerRecords(
    governance?.account.realm,
    proposal?.account.isVoteFinalized() // TODO: for finalized votes show a single item for abstained votes
      ? undefined
      : proposal?.account.governingTokenMint,
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
  proposal: ProgramAccount<Proposal>;
}) {
  useMemo(() => {
    if (loading) {
      let toFetch = proposal.account.descriptionLink;
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
  voteRecords: ProgramAccount<VoteRecord>[],
  tokenOwnerRecords: ProgramAccount<TokenOwnerRecord>[],
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
          !tor.account.governingTokenDepositAmount.isZero() &&
          !voteRecords.some(
            vt =>
              vt.account.governingTokenOwner.toBase58() ===
              tor.account.governingTokenOwner.toBase58(),
          ),
      )
      .map(tor =>
        mapper(
          tor.account.governingTokenOwner.toBase58(),
          tor.account.governingTokenDepositAmount,
          VoteType.Undecided,
        ),
      ),
  ];

  const noVoteData = [
    ...voteRecords
      .filter(vr => vr.account.getNoVoteWeight()?.gt(ZERO))
      .map(vr =>
        mapper(
          vr.account.governingTokenOwner.toBase58(),
          vr.account.getNoVoteWeight()!,
          VoteType.No,
        ),
      ),
  ];

  const yesVoteData = [
    ...voteRecords
      .filter(vr => vr.account.getYesVoteWeight()?.gt(ZERO))
      .map(vr =>
        mapper(
          vr.account.governingTokenOwner.toBase58(),
          vr.account.getYesVoteWeight()!,
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
  realm: ProgramAccount<Realm>;
  proposal: ProgramAccount<Proposal>;
  governance: ProgramAccount<Governance>;
  governingTokenMint: MintInfo;
  voterDisplayData: Array<VoterDisplayData>;
  endpoint: string;
  hasVotes: boolean;
}) {
  const tokenOwnerRecord = useWalletTokenOwnerRecord(
    governance.account.realm,
    proposal.account.governingTokenMint,
  );
  const voterWeightRecord = useVoterWeightRecord(realm, governance);
  const instructions = useInstructionsByProposal(proposal.pubkey);
  const signatories = useSignatoriesByProposal(proposal.pubkey);

  const isUrl = !!proposal.account.descriptionLink.match(urlRegex);
  const isGist =
    !!proposal.account.descriptionLink.match(/gist/i) &&
    !!proposal.account.descriptionLink.match(/github/i);
  const [content, setContent] = useState(proposal.account.descriptionLink);
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

  const history = useHistory();
  const governanceInfo = useGovernanceMeta(proposal.account.governance);

  return (
    <Row>
      <Col flex="auto" xxl={15} xs={24} className="proposal-container">
        <Row justify="center" align="middle" className="proposal-header">
          <Col md={12} xs={24}>
            <Row>
              <TokenIcon
                mintAddress={proposal?.account.governingTokenMint.toBase58()}
                size={60}
              />
              <Col>
                <h1>{proposal.account.name}</h1>
                <ProposalStateBadge
                  proposal={proposal}
                  governance={governance}
                />
                {governanceInfo && <Button
                  type="dashed"
                  href={governanceInfo.href}
                  onClick={() => history.push(governanceInfo.href)}
                >
                  Governance: {governanceInfo.name}
                </Button>}
              </Col>
            </Row>
          </Col>
          <Col md={12} xs={24}>
            <ProposalActionBar
              realm={realm}
              governance={governance}
              proposal={proposal}
              tokenOwnerRecord={tokenOwnerRecord}
              voterWeightRecord={voterWeightRecord}
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
                value={proposal.account.signatoriesCount}
                suffix={`/ ${proposal.account.signatoriesSignedOffCount}`}
              />
              {signatories
                .filter(s => s.account.signedOff)
                .map(s => (
                  <ExplorerLink
                    key={s.account.signatory.toString()}
                    address={s.account.signatory}
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
                  {proposal.account.isPreVotingState()
                    ? 'Yes Vote Threshold'
                    : 'Vote Results'}
                </div>
                <div>
                  <VoteScore
                    yesVoteCount={proposal.account.getYesVoteCount()}
                    noVoteCount={proposal.account.getNoVoteCount()}
                    yesVoteThreshold={getYesVoteThreshold(proposal, governance)}
                    governingMintDecimals={governingTokenMint.decimals}
                    proposalState={proposal.account.state}
                    maxVoteScore={getMaxVoteScore(
                      realm,
                      proposal,
                      governingTokenMint,
                    )}
                    isPreVotingState={proposal.account.isPreVotingState()}
                  ></VoteScore>
                </div>
              </div>
            </Card>
          </Col>
          <Col md={7} xs={24}>
            <Card>
              <div className="ant-statistic">
                <div className="ant-statistic-title">
                  {proposal.account.isPreVotingState()
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
              {proposal.account.descriptionLink && (
                <TabPane tab="Description" key="description">
                  {loading ? (
                    <Spin />
                  ) : isUrl ? (
                    failed ? (
                      <p>
                        {LABELS.DESCRIPTION}:{' '}
                        <a
                          href={proposal.account.descriptionLink}
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
                  align="middle"
                  justify="end"
                  style={{ paddingBottom: '1em' }}
                >
                  <DryRunProposalButton
                    proposal={proposal}
                    instructions={instructions}
                  />
                </Row>
                <Row
                  gutter={[
                    { xs: 8, sm: 16, md: 24, lg: 32 },
                    { xs: 8, sm: 16, md: 24, lg: 32 },
                  ]}
                >
                  {instructions
                    .sort(
                      (i1, i2) =>
                        i1.account.instructionIndex -
                        i2.account.instructionIndex,
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
                  {proposal.account.state === ProposalState.Draft && (
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
  realm: ProgramAccount<Realm>,
  proposal: ProgramAccount<Proposal>,
  governingTokenMint: MintInfo,
) {
  if (proposal.account.isVoteFinalized() && proposal.account.maxVoteWeight) {
    return proposal.account.maxVoteWeight;
  }

  if (
    proposal.account.governingTokenMint.toBase58() ===
    realm.account.config.councilMint?.toBase58()
  ) {
    return governingTokenMint.supply as BN;
  }

  return getMintMaxVoteWeight(
    governingTokenMint,
    realm.account.config.communityMintMaxVoteWeightSource,
  );
}

function getYesVoteThreshold(
  proposal: ProgramAccount<Proposal>,
  governance: ProgramAccount<Governance>,
) {
  return proposal.account.isVoteFinalized() &&
    // Note Canceled state is also final but we currently don't capture vote threshold at the cancellation time
    proposal.account.voteThresholdPercentage
    ? proposal.account.voteThresholdPercentage.value
    : governance.account.config.voteThresholdPercentage.value;
}
