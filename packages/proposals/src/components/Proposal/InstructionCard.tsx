import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { ParsedAccount, contexts } from '@oyster/common';
import { Card, Spin } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useState } from 'react';
import { execute } from '../../actions/execute';
import {
  TimelockSet,
  TimelockStateStatus,
  TimelockTransaction,
} from '../../models/timelock';
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
  instruction: ParsedAccount<TimelockTransaction>;
  proposal: ParsedAccount<TimelockSet>;
  position: number;
}) {
  const [tabKey, setTabKey] = useState('info');
  const [playing, setPlaying] = useState(
    instruction.info.executed === 1 ? Playstate.Played : Playstate.Unplayed,
  );
  const contentList: Record<string, JSX.Element> = {
    info: (
      <Meta
        title={'Program: TODO'}
        description={
          <>
            <p>Instruction: TODO</p>
            <p>Slot: {instruction.info.slot.toNumber()}</p>
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
  proposal: ParsedAccount<TimelockSet>;
  instruction: ParsedAccount<TimelockTransaction>;
  playing: Playstate;
  setPlaying: React.Dispatch<React.SetStateAction<Playstate>>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const [currSlot, setCurrSlot] = useState(0);
  connection.getSlot().then(setCurrSlot);

  const run = async () => {
    setPlaying(Playstate.Playing);
    try {
      await execute(connection, wallet.wallet, proposal, instruction);
    } catch (e) {
      console.error(e);
      setPlaying(Playstate.Error);
      return;
    }
    setPlaying(Playstate.Played);
  };

  if (proposal.info.state.status != TimelockStateStatus.Executing) return null;
  if (currSlot < instruction.info.slot.toNumber()) return null;

  if (playing === Playstate.Unplayed)
    return (
      <a onClick={run}>
        <PlayCircleOutlined style={{ color: 'green' }} key="play" />
      </a>
    );
  else if (playing === Playstate.Playing)
    return <LoadingOutlined style={{ color: 'orange' }} key="loading" />;
  else if (playing === Playstate.Error)
    return (
      <a onClick={run}>
        <RedoOutlined style={{ color: 'orange' }} key="play" />
      </a>
    );
  else return <CheckCircleOutlined style={{ color: 'green' }} key="played" />;
}
