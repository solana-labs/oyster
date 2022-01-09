import { TokenIcon, useConnectionConfig, useAccount } from '@oyster/common';
import { Avatar, Badge, Tooltip } from 'antd';
import React from 'react';
import { Governance, ProposalState, Realm } from '@solana/governance-sdk';

import { useProposalsByGovernance } from '../../hooks/apiHooks';

import './style.less';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import { ProgramAccount } from '@solana/governance-sdk';

export function GovernanceBadge({
  realm,
  governance,
  size = 40,
  showVotingCount = true,
}: {
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance>;
  size?: number;
  showVotingCount?: boolean;
}) {
  const proposals = useProposalsByGovernance(governance?.pubkey);
  const { tokenMap } = useConnectionConfig();
  const tokenAccount = useAccount(governance.account.governedAccount);

  const color = governance.account.isProgramGovernance() ? 'green' : 'gray';
  const useAvatar =
    governance.account.isProgramGovernance() ||
    governance.account.isAccountGovernance();

  const tokenMint = tokenAccount ? tokenAccount.info.mint : undefined;

  return (
    <Badge
      count={
        showVotingCount
          ? proposals.filter(p => p.account.state === ProposalState.Voting)
              .length
          : 0
      }
    >
      <div style={{ width: size * 1.3, height: size }}>
        {governance.account.isMintGovernance() && (
          <TokenIcon
            mintAddress={governance.account.governedAccount}
            size={size}
          />
        )}
        {governance.account.isTokenGovernance() && (
          <div
            style={{ position: 'relative' }}
            className="token-icon-container"
          >
            <TokenIcon
              style={{ position: 'absolute', left: size * 0.5 }}
              mintAddress={tokenMint}
              tokenMap={tokenMap}
              size={size * 0.6}
            />
            <TokenIcon
              mintAddress={tokenMint}
              tokenMap={tokenMap}
              size={size * 0.6}
            />
            <TokenIcon
              style={{
                position: 'absolute',
                left: size * 0.25,
                top: size * 0.3,
              }}
              mintAddress={tokenMint}
              tokenMap={tokenMap}
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
            {governance.account.governedAccount.toBase58().slice(0, 5)}
          </Avatar>
        )}
      </div>
      {realm?.account.authority?.toBase58() ===
        governance.pubkey.toBase58() && (
        <Tooltip title="realm authority">
          <SafetyCertificateOutlined
            style={{ position: 'absolute', left: size, top: size * 0.75 }}
          />
        </Tooltip>
      )}
    </Badge>
  );
}
