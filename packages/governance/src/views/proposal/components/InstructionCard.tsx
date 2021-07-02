import {
  CheckCircleOutlined,
  DeleteOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { ParsedAccount, contexts } from '@oyster/common';

import { Card, Button } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useEffect, useMemo, useState } from 'react';
import { LABELS } from '../../../constants';
import {
  GovernanceAccountType,
  Proposal,
  ProposalInstruction,
  ProposalState,
} from '../../../models/accounts';
import { GOVERNANCE_SCHEMA } from '../../../models/serialisation';
import { serialize } from 'borsh';

import './style.less';
import { executeInstruction } from '../../../actions/executeInstruction';
import { removeInstruction } from '../../../actions/removeInstruction';
import { useAccountChangeTracker } from '../../../contexts/GovernanceContext';
import { useProposalAuthority } from '../../../hooks/apiHooks';
import { useRpcContext } from '../../../hooks/useRpcContext';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

enum PlayState {
  Played,
  Unplayed,
  Playing,
  Error,
}
export function InstructionCard({
  instruction,
  proposal,
  position,
}: {
  instruction: ParsedAccount<ProposalInstruction>;
  proposal: ParsedAccount<Proposal>;
  position: number;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();
  const changeTracker = useAccountChangeTracker();

  const proposalAuthority = useProposalAuthority(
    proposal.info.tokenOwnerRecord,
  );

  const [tabKey, setTabKey] = useState('info');
  const [playing, setPlaying] = useState(
    instruction.info.executedAt ? PlayState.Played : PlayState.Unplayed,
  );

  const instructionDetails = useMemo(() => {
    const dataBase64 = Buffer.from(
      serialize(GOVERNANCE_SCHEMA, instruction.info.instruction),
    ).toString('base64');

    return {
      programId: instruction.info.instruction.programId,
      dataBase64: dataBase64,
    };
  }, [instruction]);

  const contentList: Record<string, JSX.Element> = {
    info: (
      <Meta
        title={`${LABELS.PROGRAM_ID}: ${instructionDetails.programId}`}
        description={
          <>
            <p>{`${LABELS.INSTRUCTION}: ${instructionDetails.dataBase64}`}</p>
            <p>
              {LABELS.HOLD_UP_TIME_DAYS}: {instruction.info.holdUpTime / 86400}
            </p>
          </>
        }
      />
    ),
    data: <p className="wordwrap">{instructionDetails.dataBase64}</p>,
  };

  const isEditable =
    proposal.info.state === ProposalState.Draft && proposalAuthority;

  const deleteAction = () => {
    const onDelete = async () => {
      await removeInstruction(rpcContext, proposal, instruction.pubkey);
      changeTracker.notifyAccountRemoved(
        instruction.pubkey.toBase58(),
        GovernanceAccountType.ProposalInstruction,
      );
    };

    return (
      <Button onClick={onDelete} disabled={!connected} key="delete">
        <DeleteOutlined />
      </Button>
    );
  };

  return (
    <Card
      extra={
        <PlayStatusButton
          playing={playing}
          setPlaying={setPlaying}
          proposal={proposal}
          instruction={instruction}
        />
      }
      tabList={[
        { key: 'info', tab: 'Info' },
        { key: 'data', tab: 'Data' },
      ]}
      title={'Instruction #' + position}
      activeTabKey={tabKey}
      onTabChange={setTabKey}
      actions={isEditable ? [deleteAction()] : undefined}
    >
      {contentList[tabKey]}
    </Card>
  );
}

function PlayStatusButton({
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
  const { wallet, connected } = useWallet();

  const connection = useConnection();
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
      await executeInstruction(connection, wallet, proposal, instruction);
    } catch (e) {
      setPlaying(PlayState.Error);
      return;
    }
    setPlaying(PlayState.Played);
  };

  if (
    proposal.info.state !== ProposalState.Executing &&
    proposal.info.state !== ProposalState.Succeeded
  )
    return null;
  if (ineligibleToSee) return null;

  if (playing === PlayState.Unplayed)
    return (
      <Button onClick={onExecuteInstruction} disabled={!connected}>
        <PlayCircleOutlined style={{ color: 'green' }} key="play" />
      </Button>
    );
  else if (playing === PlayState.Playing)
    return <LoadingOutlined style={{ color: 'orange' }} key="loading" />;
  else if (playing === PlayState.Error)
    return (
      <Button onClick={onExecuteInstruction} disabled={!connected}>
        <RedoOutlined style={{ color: 'orange' }} key="play" />
      </Button>
    );
  else return <CheckCircleOutlined style={{ color: 'green' }} key="played" />;
}
