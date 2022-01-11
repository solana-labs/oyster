import { BugOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React from 'react';
import { flagInstructionError } from '../../../../../actions/flagInstructionError';
import { useRpcContext } from '../../../../../hooks/useRpcContext';
import { PlayState } from './executeInstructionButton';

import {
  InstructionExecutionStatus,
  Proposal,
  ProposalInstruction,
  TokenOwnerRecord,
} from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

export function FlagInstructionErrorButton({
  proposal,
  proposalInstruction,
  proposalAuthority,
  playState,
}: {
  proposal: ProgramAccount<Proposal>;
  proposalInstruction: ProgramAccount<ProposalInstruction>;
  proposalAuthority: ProgramAccount<TokenOwnerRecord> | undefined;
  playState: PlayState;
}) {
  const rpcContext = useRpcContext();

  if (
    playState !== PlayState.Error ||
    proposalInstruction.account.executionStatus ===
    InstructionExecutionStatus.Error ||
    !proposalAuthority
  ) {
    return null;
  }

  const onFlagError = async () => {
    try {
      await flagInstructionError(
        rpcContext,
        proposal,
        proposalInstruction.pubkey,
      );
    } catch { }
  };

  return (
    <Tooltip title="flag instruction as broken">
      <Button onClick={onFlagError}>
        <BugOutlined style={{ color: 'red' }} />
      </Button>
    </Tooltip>
  );
}
