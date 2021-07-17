import { Tag } from 'antd';
import React from 'react';
import { ProposalState } from '../../../../models/accounts';

const STATE_COLOR: Record<string, string> = {
  [ProposalState.Draft]: 'orange',
  [ProposalState.SigningOff]: 'orange',
  [ProposalState.Voting]: 'blue',
  [ProposalState.Executing]: 'green',
  [ProposalState.Completed]: 'purple',
  [ProposalState.Cancelled]: 'gray',
  [ProposalState.Defeated]: 'red',
  [ProposalState.ExecutingWithErrors]: 'red',
};

function getStateLabel(state: ProposalState) {
  return state === ProposalState.ExecutingWithErrors
    ? 'Execution Errors'
    : ProposalState[state];
}

export function ProposalStateBadge({ state }: { state: ProposalState }) {
  let color = STATE_COLOR[state];
  return (
    <Tag color={color} style={{ borderWidth: 0 }}>
      {getStateLabel(state)}
    </Tag>
  );
}
