import { useEffect, useState } from 'react';
import { ParsedAccount, useWallet } from '@oyster/common';
import { executeInstruction } from '../../../../../actions/executeInstruction';
import {
  InstructionExecutionStatus,
  Proposal,
  ProposalInstruction,
  ProposalState,
} from '../../../../../models/accounts';
import { useRpcContext } from '../../../../../hooks/useRpcContext';
import React from 'react';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

export enum PlayState {
  Played,
  Unplayed,
  Playing,
  Error,
}

export function ExecuteInstructionButton({
  proposal,
  playing,
  setPlaying,
  proposalInstruction,
}: {
  proposal: ParsedAccount<Proposal>;
  proposalInstruction: ParsedAccount<ProposalInstruction>;
  playing: PlayState;
  setPlaying: React.Dispatch<React.SetStateAction<PlayState>>;
}) {
  const { connected } = useWallet();

  const rpcContext = useRpcContext();
  const { connection } = rpcContext;
  const [currentSlot, setCurrentSlot] = useState(0);

  let canExecuteAt = proposal.info.votingCompletedAt
    ? proposal.info.votingCompletedAt.toNumber() + 1
    : 0;

  const ineligibleToSee = currentSlot - canExecuteAt >= 0;

  useEffect(() => {
    if (ineligibleToSee) {
      const timer = setTimeout(() => {
        connection.getSlot().then(setCurrentSlot);
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [ineligibleToSee, connection, currentSlot]);

  const onExecuteInstruction = async () => {
    setPlaying(PlayState.Playing);
    try {
      await executeInstruction(rpcContext, proposal, proposalInstruction);
    } catch (e) {
      setPlaying(PlayState.Error);
      return;
    }
    setPlaying(PlayState.Played);
  };

  if (
    proposalInstruction.info.executionStatus ===
    InstructionExecutionStatus.Success
  ) {
    return (
      <Tooltip title="instruction has been executed successfully">
        <CheckCircleOutlined style={{ color: 'green' }} />{' '}
      </Tooltip>
    );
  }

  if (
    proposal.info.state !== ProposalState.Executing &&
    proposal.info.state !== ProposalState.ExecutingWithErrors &&
    proposal.info.state !== ProposalState.Succeeded
  )
    return null;
  if (ineligibleToSee) return null;

  if (
    playing === PlayState.Unplayed &&
    proposalInstruction.info.executionStatus !==
      InstructionExecutionStatus.Error
  ) {
    return (
      <Tooltip title="execute instruction">
        <Button onClick={onExecuteInstruction} disabled={!connected}>
          <PlayCircleOutlined style={{ color: 'green' }} key="play" />
        </Button>
      </Tooltip>
    );
  } else if (playing === PlayState.Playing)
    return <LoadingOutlined style={{ color: 'orange' }} key="loading" />;
  else if (
    playing === PlayState.Error ||
    proposalInstruction.info.executionStatus ===
      InstructionExecutionStatus.Error
  )
    return (
      <Tooltip title="retry to execute instruction">
        <Button onClick={onExecuteInstruction} disabled={!connected}>
          <RedoOutlined style={{ color: 'red' }} key="play" />
        </Button>
      </Tooltip>
    );
  else return <CheckCircleOutlined style={{ color: 'green' }} key="played" />;
}
