import { ParsedAccount, TokenIcon } from '@oyster/common';
import { Avatar, Badge, Tooltip } from 'antd';
import React from 'react';
import { Governance, ProposalState, Realm } from '../../models/accounts';

import { useProposalsByGovernance } from '../../hooks/apiHooks';

import './style.less';
import { SafetyCertificateOutlined } from '@ant-design/icons';

export function GovernanceBadge({
  realm,
  governance,
  size = 40,
  showVotingCount = true,
}: {
  realm: ParsedAccount<Realm> | undefined;
  governance: ParsedAccount<Governance>;
  size?: number;
  showVotingCount?: boolean;
}) {
  const proposals = useProposalsByGovernance(governance?.pubkey);
  const color = governance.info.isProgramGovernance() ? 'green' : 'gray';
  const useAvatar =
    governance.info.isProgramGovernance() ||
    governance.info.isAccountGovernance();

  return (
    <Badge
      count={
        showVotingCount
          ? proposals.filter(p => p.info.state === ProposalState.Voting).length
          : 0
      }
    >
      <div style={{ width: size * 1.3, height: size }}>
        {governance.info.isMintGovernance() && (
          <TokenIcon
            mintAddress={governance.info.governedAccount}
            size={size}
          />
        )}
        {governance.info.isTokenGovernance() && (
          <div
            style={{ position: 'relative' }}
            className="token-icon-container"
          >
            <TokenIcon
              style={{ position: 'absolute', left: size * 0.5 }}
              mintAddress={governance.info.governedAccount}
              size={size * 0.6}
            />
            <TokenIcon
              mintAddress={governance.info.governedAccount}
              size={size * 0.6}
            />
            <TokenIcon
              style={{
                position: 'absolute',
                left: size * 0.25,
                top: size * 0.3,
              }}
              mintAddress={governance.info.governedAccount}
              size={size * 0.6}
            />
          </div>
        )}
        {useAvatar && (
          <Avatar
            size={size}
            gap={2}
            style={{ background: color, marginRight: 5 }}
          >
            {governance.info.governedAccount.toBase58().slice(0, 5)}
          </Avatar>
        )}
      </div>
      {realm?.info.authority?.toBase58() === governance.pubkey.toBase58() && (
        <Tooltip title="realm authority">
          <SafetyCertificateOutlined
            style={{ position: 'absolute', left: size, top: size * 0.75 }}
          />
        </Tooltip>
      )}
    </Badge>
  );
}
