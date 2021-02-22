import { ParsedAccount } from '@oyster/common';
import { Badge, Tag } from 'antd';
import React from 'react';
import { STATE_COLOR, TimelockSet } from '../../models/timelock';

export function StateBadgeRibbon({
  proposal,
  children,
}: {
  proposal: ParsedAccount<TimelockSet>;
  children: any;
}) {
  const status = proposal.info.state.status;
  let color = STATE_COLOR[status];
  return (
    <Badge.Ribbon style={{ backgroundColor: color }} text={status}>
      {children}
    </Badge.Ribbon>
  );
}

export function StateBadge({
  proposal,
}: {
  proposal: ParsedAccount<TimelockSet>;
}) {
  const status = proposal.info.state.status;
  let color = STATE_COLOR[status];
  return <Tag color={color}>{status}</Tag>;
}
