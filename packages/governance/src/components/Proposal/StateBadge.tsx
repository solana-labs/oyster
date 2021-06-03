import { ParsedAccount } from '@oyster/common';
import { Badge, Tag } from 'antd';
import React from 'react';
import { ProposalState } from '../../models/accounts';
import {
  STATE_COLOR,
  ProposalStateOld,
  ProposalStateStatus,
} from '../../models/serialisation';

export function StateBadgeRibbon({
  state,
  children,
}: {
  state: ParsedAccount<ProposalStateOld>;
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

export function StateBadge({ state }: { state: ProposalState }) {
  let color = STATE_COLOR[state];
  return (
    <Tag color={color} style={{ borderWidth: 0 }}>
      {ProposalState[state]}
    </Tag>
  );
}
