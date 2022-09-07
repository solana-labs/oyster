import { Space } from 'antd';
import React from 'react';
import { Governance, ProgramAccount, Realm } from '@solana/spl-governance';
import { NewProposalButton } from './newProposalButton';

export interface GovernanceActionBarProps {
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance> | undefined;
}

export function GovernanceActionBar({ realm, governance }: GovernanceActionBarProps) {
  return realm ? <div className='proposals-action-bar'>
    <Space>
      <NewProposalButton governance={governance} realm={realm} />
    </Space>
  </div> : null;
}
