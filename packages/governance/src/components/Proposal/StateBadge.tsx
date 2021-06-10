import { Badge, Tag } from 'antd';
import React from 'react';
import { ProposalState } from '../../models/accounts';

const STATE_COLOR: Record<string, string> = {
  [ProposalState.Draft]: 'orange',
  [ProposalState.SigningOff]: 'orange',
  [ProposalState.Voting]: 'blue',
  [ProposalState.Executing]: 'green',
  [ProposalState.Completed]: 'purple',
  [ProposalState.Cancelled]: 'gray',
  [ProposalState.Defeated]: 'red',
};

export function StateBadgeRibbon({
  state,
  children,
}: {
  state: ProposalState;
  children?: any;
}) {
  let color = STATE_COLOR[state];
  return (
    <Badge.Ribbon
      style={{ backgroundColor: color }}
      text={ProposalState[state]}
    >
      {children}
    </Badge.Ribbon>
  );
}

export function StateBadge({ state }: { state: ProposalState }) {
  let color = STATE_COLOR[state];
  return (
    <Tag color={color} style={{ borderWidth: 0 }}>
      {ProposalState[state]}
    </Tag>
  );
}
