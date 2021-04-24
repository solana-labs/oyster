import { ParsedAccount } from '@oyster/common';
import { Badge, Tag } from 'antd';
import React from 'react';
import {
  STATE_COLOR,
  ProposalState,
  ProposalStateStatus,
} from '../../models/governance';

export function StateBadgeRibbon({
  state,
  children,
}: {
  state: ParsedAccount<ProposalState>;
  children?: any;
}) {
  const status = state.info.status;
  let color = STATE_COLOR[status];
  return (
    <Badge.Ribbon
      style={{ backgroundColor: color }}
      text={ProposalStateStatus[status]}
    >
      {children}
    </Badge.Ribbon>
  );
}

export function StateBadge({ state }: { state: ParsedAccount<ProposalState> }) {
  const status = state.info.status;
  let color = STATE_COLOR[status];
  return (
    <Tag color={color} style={{ borderWidth: 0 }}>
      {ProposalStateStatus[status]}
    </Tag>
  );
}
