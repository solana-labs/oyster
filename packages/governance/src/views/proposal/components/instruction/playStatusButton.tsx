import { useEffect, useState } from 'react';
import { ParsedAccount, useWallet } from '@oyster/common';
import { executeInstruction } from '../../../../actions/executeInstruction';
import {
  InstructionExecutionStatus,
  Proposal,
  ProposalInstruction,
  ProposalState,
} from '../../../../models/accounts';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import React from 'react';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { Button } from 'antd';

export enum PlayState {
  Played,
  Unplayed,
  Playing,
  Error,
}

export function PlayStatusButton({
  proposal,
  playing,
  setPlaying,
  instruction,
}: {
  proposal: ParsedAccount<Proposal>;
  instruction: ParsedAccount<ProposalInstruction>;
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
      await executeInstruction(rpcContext, proposal, instruction);
    } catch (e) {
      setPlaying(PlayState.Error);
      return;
    }
    setPlaying(PlayState.Played);
  };

  if (
    proposal.info.state !== ProposalState.Executing &&
    proposal.info.state !== ProposalState.ExecutingWithErrors &&
    proposal.info.state !== ProposalState.Succeeded
  )
    return null;
  if (ineligibleToSee) return null;

  if (
    playing === PlayState.Unplayed &&
    instruction.info.executionStatus !== InstructionExecutionStatus.Error
  ) {
    return (
      <Button onClick={onExecuteInstruction} disabled={!connected}>
        <PlayCircleOutlined style={{ color: 'green' }} key="play" />
      </Button>
    );
  } else if (playing === PlayState.Playing)
    return <LoadingOutlined style={{ color: 'orange' }} key="loading" />;
  else if (
    playing === PlayState.Error ||
    instruction.info.executionStatus === InstructionExecutionStatus.Error
  )
    return (
      <Button onClick={onExecuteInstruction} disabled={!connected}>
        <RedoOutlined style={{ color: 'orange' }} key="play" />
      </Button>
    );
  else return <CheckCircleOutlined style={{ color: 'green' }} key="played" />;
}
