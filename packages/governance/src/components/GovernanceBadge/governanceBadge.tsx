import { TokenIcon } from '@oyster/common';
import { Avatar, Badge, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { Governance, ProgramAccount, ProposalState, Realm } from '@solana/spl-governance';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { useProposalsByGovernance } from '../../hooks/apiHooks';
import TokenGovernanceIcon from './TokenGovernanceIcon';
import './style.less';

export interface GovernanceBadgeProps {
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance>;
  size?: number;
  showVotingCount?: boolean;
}

export function GovernanceBadge(props: GovernanceBadgeProps) {
  const { realm, governance, size = 40, showVotingCount = true } = props;
  const proposals = useProposalsByGovernance(governance?.pubkey);

  const color = governance.account.isProgramGovernance() ? 'green' : 'gray';
  const useAvatar =
    governance.account.isProgramGovernance() ||
    governance.account.isAccountGovernance();

  const showCount = useMemo(() => {
    return showVotingCount ? proposals.filter(p => p.account.state === ProposalState.Voting).length : 0;
  }, [showVotingCount, proposals]);

  return (
    <Badge count={showCount}>
      <div style={{ width: size * 1.3, height: size }}>
        {governance.account.isMintGovernance() && (
          <TokenIcon
            mintAddress={governance.account.governedAccount}
            size={size}
          />
        )}
        {governance.account.isTokenGovernance() &&
          <TokenGovernanceIcon governedAccount={governance.account.governedAccount} size={size} />}
        {useAvatar && (
          <Avatar size={size} gap={2} style={{ background: color, marginRight: 5 }}>
            {governance.account.governedAccount.toBase58().slice(0, 5)}
          </Avatar>
        )}
      </div>
      {realm?.account.authority?.toBase58() ===
        governance.pubkey.toBase58() && (
          <Tooltip title='realm authority'>
            <SafetyCertificateOutlined
              style={{ position: 'absolute', left: size, top: size * 0.75 }}
            />
          </Tooltip>
        )}
    </Badge>
  );
}
