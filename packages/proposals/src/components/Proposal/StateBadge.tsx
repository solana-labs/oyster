import { ParsedAccount } from '@oyster/common';
import { Badge, Tag } from 'antd';
import React from 'react';
import {
  STATE_COLOR,
  TimelockState,
  TimelockStateStatus,
} from '../../models/timelock';

export function StateBadgeRibbon({
  state,
  children,
}: {
  state: ParsedAccount<TimelockState>;
  children?: any;
}) {
  const status = state.info.status;
  let color = STATE_COLOR[status];
  return (
    <Badge.Ribbon
      style={{ backgroundColor: color }}
      text={TimelockStateStatus[status]}
    >
      {children}
    </Badge.Ribbon>
  );
}

export function StateBadge({ state }: { state: ParsedAccount<TimelockState> }) {
  const status = state.info.status;
  let color = STATE_COLOR[status];
  return (
    <Tag color={color} style={{ borderWidth: 0 }}>
      {TimelockStateStatus[status]}
    </Tag>
  );
}
