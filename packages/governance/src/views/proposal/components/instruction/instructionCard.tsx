import { DeleteOutlined } from '@ant-design/icons';
import { ParsedAccount, contexts } from '@oyster/common';

import { Card, Button, Space } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useMemo, useState } from 'react';
import { LABELS } from '../../../../constants';
import {
  GovernanceAccountType,
  Proposal,
  ProposalInstruction,
  ProposalState,
} from '../../../../models/accounts';
import { GOVERNANCE_SCHEMA } from '../../../../models/serialisation';
import { serialize } from 'borsh';

import '../style.less';

import { removeInstruction } from '../../../../actions/removeInstruction';
import { useAccountChangeTracker } from '../../../../contexts/GovernanceContext';
import { useProposalAuthority } from '../../../../hooks/apiHooks';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { FlagInstructionErrorButton } from './flagInstructionErrorButton';
import { PlayState, PlayStatusButton } from './playStatusButton';

const { useWallet } = contexts.Wallet;

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
        <Space>
          <FlagInstructionErrorButton
            playState={playing}
            proposal={proposal}
            proposalInstruction={instruction}
            proposalAuthority={proposalAuthority}
          ></FlagInstructionErrorButton>
          <PlayStatusButton
            playing={playing}
            setPlaying={setPlaying}
            proposal={proposal}
            instruction={instruction}
          />
        </Space>
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
