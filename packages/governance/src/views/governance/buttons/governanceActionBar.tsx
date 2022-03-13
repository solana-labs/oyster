import { Space } from 'antd';
import React from 'react';
import { Governance, Realm } from '@solana/spl-governance';

import { NewProposalButton } from './newProposalButton';
import { ProgramAccount } from '@solana/spl-governance';

export function GovernanceActionBar({
  realm,
  governance,
}: {
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance> | undefined;
}) {

  if (!realm) {
    return null;
  }

  return (
    <div className="proposals-action-bar">
      <Space>
        <NewProposalButton governance={governance} realm={realm} />
      </Space>
    </div>
  );
}
