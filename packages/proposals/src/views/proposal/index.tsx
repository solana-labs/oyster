import { Col, Divider, Grid, Row, Space, Spin, Statistic } from 'antd';
import React, { useMemo, useState } from 'react';
import { LABELS } from '../../constants';
import { ParsedAccount } from '@oyster/common';
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
import { useProposals } from '../../contexts/proposals';
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
export const urlRegex = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
const { useMint } = contexts.Accounts;
const { useAccountByMint } = hooks;
const { useBreakpoint } = Grid;

export const ProposalView = () => {
  const context = useProposals();
  const { id } = useParams<{ id: string }>();
  const proposal = context.proposals[id];
  const timelockConfig = context.configs[proposal?.info.config.toBase58()];
  const sigMint = useMint(proposal?.info.signatoryMint);
  const votingMint = useMint(proposal?.info.votingMint);
  const governanceMint = useMint(timelockConfig?.info.governanceMint);
  const yesVotingMint = useMint(proposal?.info.yesVotingMint);

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
    <>
      <Space
        size="large"
        split={<Divider type="horizontal" />}
        direction="vertical"
      >
        <Row justify="center" align="middle">
          <Col span={24}>
            <p>
              <span style={{ fontSize: '21px', marginRight: '20px' }}>
                {LABELS.PROPOSAL}: {proposal.info.state.name}
              </span>

              <StateBadge proposal={proposal} />
            </p>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
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
          </Col>
        </Row>
        <Row>
          <Col span={8}>
            <Statistic
              title={LABELS.SIG_GIVEN}
              value={
                proposal.info.state.totalSigningTokensMinted.toNumber() -
                sigMint.supply.toNumber()
              }
              suffix={`/ ${proposal.info.state.totalSigningTokensMinted.toNumber()}`}
            />
            <Space
              style={{ marginTop: '10px' }}
              direction={
                breakpoint.lg || breakpoint.xl || breakpoint.xxl
                  ? 'horizontal'
                  : 'vertical'
              }
            >
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
            </Space>
          </Col>
          <Col span={8}>
            <Statistic
              title={LABELS.VOTES_CAST}
              value={yesVotingMint.supply.toNumber()}
              suffix={`/ ${governanceMint.supply.toNumber()}`}
            />
            <Space
              style={{ marginTop: '10px' }}
              direction={
                breakpoint.lg || breakpoint.xl || breakpoint.xxl
                  ? 'horizontal'
                  : 'vertical'
              }
            >
              <RegisterToVote
                timelockConfig={timelockConfig}
                proposal={proposal}
              />
              <WithdrawTokens
                timelockConfig={timelockConfig}
                proposal={proposal}
              />
              <Vote proposal={proposal} timelockConfig={timelockConfig} />
            </Space>
          </Col>
          <Col span={8}>
            <Statistic
              valueStyle={{ color: 'green' }}
              title={LABELS.VOTES_REQUIRED}
              value={getVotesRequired(timelockConfig, governanceMint)}
            />
            <Space
              style={{ marginTop: '10px' }}
              direction={
                breakpoint.lg || breakpoint.xl || breakpoint.xxl
                  ? 'horizontal'
                  : 'vertical'
              }
            >
              <MintGovernanceTokens timelockConfig={timelockConfig} />
            </Space>
          </Col>
        </Row>
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
            proposal.info.state.status === TimelockStateStatus.Draft && (
              <Col xs={24} sm={24} md={12} lg={8}>
                <NewInstructionCard
                  proposal={proposal}
                  config={timelockConfig}
                  position={instructionsForProposal.length}
                />
              </Col>
            )}
        </Row>
      </Space>
    </>
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
