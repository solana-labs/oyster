import { Tag } from 'antd';
import React from 'react';
import { Governance, Proposal, ProposalState } from '@solana/spl-governance';

import { useHasVoteTimeExpired } from '../../../../hooks/useHasVoteTimeExpired';
import { ProgramAccount } from '@solana/spl-governance';

const STATE_COLOR: Record<string, string> = {
  [ProposalState.Draft]: 'orange',
  [ProposalState.SigningOff]: 'orange',
  [ProposalState.Voting]: 'blue',
  [ProposalState.Succeeded]: 'green',
  [ProposalState.Executing]: '',
  [ProposalState.Completed]: 'purple',
  [ProposalState.Cancelled]: 'gray',
  [ProposalState.Defeated]: 'red',
  [ProposalState.ExecutingWithErrors]: 'red',
};

function getStateLabel(
  state: ProposalState,
  hasVoteExpired: boolean | undefined,
) {
  switch (state) {
    case ProposalState.ExecutingWithErrors:
      return 'Execution Errors';
    case ProposalState.Voting:
      return hasVoteExpired ? 'Voting Ended' : 'Voting';
    default:
      return ProposalState[state];
  }
}

export function ProposalStateBadge({
  governance,
  proposal,
}: {
  governance: ProgramAccount<Governance> | undefined;
  proposal: ProgramAccount<Proposal>;
}) {
  const hasVoteExpired = useHasVoteTimeExpired(governance, proposal);

  let color = STATE_COLOR[proposal.account.state];
  return (
    <Tag color={color} style={{ borderWidth: 0 }}>
      {getStateLabel(proposal.account.state, hasVoteExpired)}
    </Tag>
  );
}
