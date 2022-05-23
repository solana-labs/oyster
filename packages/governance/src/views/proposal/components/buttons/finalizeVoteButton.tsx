import { useWallet } from '@oyster/common';
import { Button } from 'antd';
import React from 'react';
import { LABELS } from '../../../../constants';
import { Governance, Proposal, ProposalState } from '@solana/spl-governance';
import { finalizeVote } from '../../../../actions/finalizeVote';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { ProgramAccount } from '@solana/spl-governance';
import { AccountVoterWeightRecord } from '../../../../hooks/governance-sdk';

export function FinalizeVoteButton({
  governance,
  proposal,
  hasVoteTimeExpired,
  voterWeightRecord,
}: {
  governance: ProgramAccount<Governance>;
  proposal: ProgramAccount<Proposal>;
  hasVoteTimeExpired: boolean | undefined;
  voterWeightRecord?: AccountVoterWeightRecord;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();

  const isVisible =
    hasVoteTimeExpired === true &&
    connected &&
    proposal.account.state === ProposalState.Voting;

  return isVisible ? (
    <Button
      type="primary"
      onClick={async () => {
        try {
          await finalizeVote(rpcContext, governance.account.realm, proposal, voterWeightRecord?.maxVoterWeight);
        } catch (ex) {
          console.error('finalizeVote', ex);
        }
      }}
    >
      {LABELS.FINALIZE_VOTE}
    </Button>
  ) : null;
}
