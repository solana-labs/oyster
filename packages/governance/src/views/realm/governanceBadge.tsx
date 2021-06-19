import { ParsedAccount, TokenIcon, useMint } from '@oyster/common';
import { Avatar, Badge } from 'antd';
import React from 'react';
import { Governance, ProposalState } from '../../models/accounts';

import { useProposalsByGovernance } from '../../hooks/apiHooks';

export function GovernanceBadge({
  governance,
}: {
  governance: ParsedAccount<Governance>;
}) {
  // We don't support MintGovernance account yet, but we can check the governed account type here
  const governedMint = useMint(governance.info.config.governedAccount);
  const proposals = useProposalsByGovernance(governance?.pubkey);
  const color = governance.info.isProgramGovernance() ? 'green' : 'gray';

  return (
    <Badge
      count={
        proposals.filter(p => p.info.state === ProposalState.Voting).length
      }
    >
      <div style={{ width: 55, height: 45 }}>
        {governedMint ? (
          <TokenIcon
            mintAddress={governance.info.config.governedAccount}
            size={40}
          />
        ) : (
          <Avatar size="large" gap={2} style={{ background: color }}>
            {governance.info.config.governedAccount.toBase58().slice(0, 5)}
          </Avatar>
        )}
      </div>
    </Badge>
  );
}
