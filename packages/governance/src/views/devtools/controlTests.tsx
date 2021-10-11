import { BN } from 'bn.js';
import React from 'react';
import { VoteScore } from '../proposal/components/vote/voteScore';

import { Space } from 'antd';
import { ProposalState } from '../../models/accounts';

export function ControlTestBench() {
  const supply = 10000000;
  const mintDecimals = 8;

  return (
    <>
      <div>
        <div style={{ width: 350, margin: 50 }}>
          <Space direction="vertical" style={{ width: 350 }} size="large">
            <VoteScore
              yesVoteCount={new BN(10000000 * 0.3)}
              noVoteCount={new BN(0)}
              yesVoteThreshold={50}
              governingMintDecimals={mintDecimals}
              proposalState={ProposalState.Voting}
              maxVoteScore={new BN(supply)}
              isPreVotingState={false}
            ></VoteScore>

            <VoteScore
              yesVoteCount={new BN(0)}
              noVoteCount={new BN(0)}
              yesVoteThreshold={60}
              governingMintDecimals={mintDecimals}
              proposalState={ProposalState.Voting}
              maxVoteScore={new BN(supply)}
              isPreVotingState={false}
            ></VoteScore>

            <VoteScore
              yesVoteCount={new BN(supply * 0.2)}
              noVoteCount={new BN(supply * 0.4)}
              yesVoteThreshold={0.02}
              governingMintDecimals={mintDecimals}
              proposalState={ProposalState.Voting}
              maxVoteScore={new BN(supply)}
              isPreVotingState={false}
            ></VoteScore>

            <VoteScore
              yesVoteCount={new BN(supply * 0.5)}
              noVoteCount={new BN(supply * 0.5)}
              yesVoteThreshold={39}
              governingMintDecimals={mintDecimals}
              proposalState={ProposalState.Voting}
              maxVoteScore={new BN(supply)}
              isPreVotingState={false}
            ></VoteScore>
            <VoteScore
              yesVoteCount={new BN(supply * 0.9)}
              noVoteCount={new BN(0)}
              yesVoteThreshold={40}
              governingMintDecimals={mintDecimals}
              proposalState={ProposalState.Voting}
              maxVoteScore={new BN(supply)}
              isPreVotingState={false}
            ></VoteScore>
            <VoteScore
              yesVoteCount={new BN(supply)}
              noVoteCount={new BN(0)}
              yesVoteThreshold={20}
              governingMintDecimals={mintDecimals}
              proposalState={ProposalState.Voting}
              maxVoteScore={new BN(supply)}
              isPreVotingState={false}
            ></VoteScore>
            <VoteScore
              yesVoteCount={new BN(0)}
              noVoteCount={new BN(supply)}
              yesVoteThreshold={20}
              governingMintDecimals={mintDecimals}
              proposalState={ProposalState.Voting}
              maxVoteScore={new BN(supply)}
              isPreVotingState={false}
            ></VoteScore>
          </Space>
        </div>
      </div>
    </>
  );
}
