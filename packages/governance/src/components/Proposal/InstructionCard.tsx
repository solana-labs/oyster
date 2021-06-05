import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { ParsedAccount, contexts } from '@oyster/common';
import { Message } from '@solana/web3.js';
import { Card, Button } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useEffect, useMemo, useState } from 'react';
import { LABELS } from '../../constants';
import { Proposal, ProposalState } from '../../models/accounts';
import { GovernanceTransaction } from '../../models/serialisation';

import './style.less';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

enum Playstate {
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
  instruction: ParsedAccount<GovernanceTransaction>;
  proposal: ParsedAccount<Proposal>;

  position: number;
}) {
  const [tabKey, setTabKey] = useState('info');
  const [playing, setPlaying] = useState(
    instruction.info.executed === 1 ? Playstate.Played : Playstate.Unplayed,
  );

  const instructionDetails = useMemo(() => {
    const message = Message.from(instruction.info.instruction);

    return {
      instructionProgramID:
        message.accountKeys[message.instructions[0].programIdIndex],
      instructionData: message.instructions[0].data,
    };
  }, [instruction]);

  const contentList: Record<string, JSX.Element> = {
    info: (
      <Meta
        title={`${LABELS.PROGRAM_ID}: ${instructionDetails.instructionProgramID}`}
        description={
          <>
            <p>{`${LABELS.INSTRUCTION}: ${instructionDetails.instructionData}`}</p>
            <p>
              {LABELS.HOLD_UP_TIME}: {instruction.info.slot.toNumber()}
            </p>
          </>
        }
      />
    ),
    data: <p className="wordwrap">{instruction.info.instruction}</p>,
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
      actions={[<EditOutlined key="edit" />, <DeleteOutlined key="delete" />]}
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

  instruction: ParsedAccount<GovernanceTransaction>;
  playing: Playstate;
  setPlaying: React.Dispatch<React.SetStateAction<Playstate>>;
}) {
  const wallet = useWallet();

  const connection = useConnection();
  const [currSlot, setCurrSlot] = useState(0);

  const elapsedTime = currSlot - proposal.info.votingCompletedAt!.toNumber();
  const ineligibleToSee = elapsedTime < instruction.info.slot.toNumber();

  useEffect(() => {
    if (ineligibleToSee) {
      const timer = setTimeout(() => {
        connection.getSlot().then(setCurrSlot);
      }, 5000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [ineligibleToSee, connection, currSlot]);

  const run = async () => {
    setPlaying(Playstate.Playing);
    try {
      console.log('TODO:', wallet);
      //await execute(connection, wallet.wallet, null, state, instruction);
    } catch (e) {
      console.error(e);
      setPlaying(Playstate.Error);
      return;
    }
    setPlaying(Playstate.Played);
  };

  if (
    proposal.info.state !== ProposalState.Executing &&
    proposal.info.state !== ProposalState.Completed
  )
    return null;
  if (ineligibleToSee) return null;

  if (playing === Playstate.Unplayed)
    return (
      <Button onClick={run}>
        <PlayCircleOutlined style={{ color: 'green' }} key="play" />
      </Button>
    );
  else if (playing === Playstate.Playing)
    return <LoadingOutlined style={{ color: 'orange' }} key="loading" />;
  else if (playing === Playstate.Error)
    return (
      <Button onClick={run}>
        <RedoOutlined style={{ color: 'orange' }} key="play" />
      </Button>
    );
  else return <CheckCircleOutlined style={{ color: 'green' }} key="played" />;
}
