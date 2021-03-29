import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  PlayCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons';
import { ParsedAccount, contexts } from '@oyster/common';
import { Card } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useEffect, useState } from 'react';
import { execute } from '../../actions/execute';
import { LABELS } from '../../constants';
import {
  TimelockSet,
  TimelockState,
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
  state,
  position,
}: {
  instruction: ParsedAccount<TimelockTransaction>;
  proposal: ParsedAccount<TimelockSet>;
  state: ParsedAccount<TimelockState>;
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
            <p>
              {LABELS.DELAY}: {instruction.info.slot.toNumber()}
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
          state={state}
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
  state,
  playing,
  setPlaying,
  instruction,
}: {
  proposal: ParsedAccount<TimelockSet>;
  state: ParsedAccount<TimelockState>;
  instruction: ParsedAccount<TimelockTransaction>;
  playing: Playstate;
  setPlaying: React.Dispatch<React.SetStateAction<Playstate>>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const [currSlot, setCurrSlot] = useState(0);

  const elapsedTime = currSlot - state.info.votingEndedAt.toNumber();
  const ineligibleToSee = elapsedTime < instruction.info.slot.toNumber();

  useEffect(() => {
    if (ineligibleToSee) {
      const id = setTimeout(() => {
        connection.getSlot().then(setCurrSlot);
      }, 5000);
    }
  }, [ineligibleToSee, connection, currSlot]);

  const run = async () => {
    setPlaying(Playstate.Playing);
    try {
      await execute(connection, wallet.wallet, proposal, state, instruction);
    } catch (e) {
      console.error(e);
      setPlaying(Playstate.Error);
      return;
    }
    setPlaying(Playstate.Played);
  };

  if (
    state.info.status != TimelockStateStatus.Executing &&
    state.info.status != TimelockStateStatus.Completed
  )
    return null;
  if (ineligibleToSee) return null;

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
