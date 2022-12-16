import { DeleteOutlined } from '@ant-design/icons';
import {useConnectionConfig, useWallet} from '@oyster/common';
import { Button, Card, Space } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useMemo, useState } from 'react';
import {
  GovernanceAccountType,
  InstructionData,
  ProgramAccount,
  Proposal,
  ProposalState,
  ProposalTransaction
} from '@solana/spl-governance';
import { getGovernanceInstructionSchema } from '@solana/spl-governance/lib/governance/serialisation-fork';
import { serialize } from 'borsh';

import '../style.less';

import { removeInstruction } from '../../../../actions/removeInstruction';
import { useAccountChangeTracker } from '../../../../contexts/GovernanceContext';
import { useProposalAuthority } from '../../../../hooks/apiHooks';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { LABELS } from '../../../../constants';
import { FlagInstructionErrorButton } from './buttons/flagInstructionErrorButton';
import { ExecuteInstructionButton, PlayState } from './buttons/executeInstructionButton';
import { DryRunInstructionButton } from './buttons/dryRunInstructionButton';
import BN from "bn.js";
import {useTokenAccountByMint} from "../../../../hooks/useTokenAccountByMint";

// Mint metadata for Well known tokens displayed on the instruction card
export const MINT_METADATA: Record<string, Record<string, string>> = {
  EjLGfD8mpxKLwGDi8AiTisAbGtWWM2L3htkJ6MpvS8Hk: { symbol: 'NEON' }
}

export interface InstructionCardProps {
  proposalInstruction: ProgramAccount<ProposalTransaction>;
  proposal: ProgramAccount<Proposal>;
  position: number;
}

export interface TransferInstruction {
  source: string;
  destination: string;
  signer: string;
  amount: string;
}

export function InstructionCard({ proposalInstruction, proposal, position }: InstructionCardProps) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();
  const changeTracker = useAccountChangeTracker();
  const { tokens } = useConnectionConfig();
  const { tokenMint, tokenAmount } = useTokenAccountByMint(proposalInstruction.account.instructions[0]);

  const proposalAuthority = useProposalAuthority(
    proposal.account.tokenOwnerRecord
  );

  const [tabKey, setTabKey] = useState('info');
  const [playing, setPlaying] = useState(
    proposalInstruction.account.executedAt
      ? PlayState.Played
      : PlayState.Unplayed
  );

  const instructionData = useMemo<InstructionData | undefined>(() => {
    let instruction = undefined;

    if (proposalInstruction.account.instructions?.length > 0) {
      instruction = proposalInstruction.account.instructions[0];
    } else if (proposalInstruction.account.instruction) {
      instruction = proposalInstruction.account.getSingleInstruction();
    }

    return instruction;
  }, [proposalInstruction]);

  const transferInstructionData = useMemo<TransferInstruction | undefined>( () => {
    const tokenName = tokenMint
      ? tokens.find(t => t.address === tokenMint!.publicKey.toString())?.symbol ?? MINT_METADATA[tokenMint!.publicKey.toString()].symbol
      : undefined;

    return instructionData
    && instructionData.programId.toString().indexOf('Tokenkeg') >= 0
    && instructionData.data[0] === 3
      ?
      {
        source: instructionData!.accounts[0].pubkey,
        destination: instructionData!.accounts[1]?.pubkey,
        signer: (instructionData!.accounts.find(acc => acc.isSigner))?.pubkey,
        amount: `${tokenAmount?.toNumber().toLocaleString() ?? new BN(0)} ${tokenName ?? 'Unknown'}`
      } as unknown as TransferInstruction
      :
        undefined;
  }, [instructionData, tokens, tokenAmount, tokenMint]);

  const instructionDetails = useMemo(() => {
    const dataBase64 = Buffer.from(serialize(getGovernanceInstructionSchema(rpcContext.programVersion), instructionData)).toString('base64');
    const programId = instructionData!.programId;
    return { programId, dataBase64 };
  }, [instructionData, rpcContext.programVersion]);

  const contentList: Record<string, JSX.Element> = {
    info: (
      <Meta
        title={`${LABELS.PROGRAM_ID}: ${instructionDetails.programId}`}
        description={
          <>
            <p>{`${LABELS.INSTRUCTION}: ${instructionDetails.dataBase64}`}</p>
            <p>
              {LABELS.HOLD_UP_TIME_DAYS}:{' '}
              {proposalInstruction.account.holdUpTime / 86400}
            </p>
            {
              transferInstructionData ?
              <>
                <p>
                  {`${LABELS.ACCOUNT} 1 (${LABELS.TRANSFER_ACCOUNT_SOURCE}): ${transferInstructionData.source}`}
                </p>
                <p>
                  {`${LABELS.ACCOUNT} 2 (${LABELS.TRANSFER_ACCOUNT_DESTINATION}): ${transferInstructionData.destination}`}
                </p>
                <p>
                  {`${LABELS.ACCOUNT} 3 (${LABELS.TRANSFER_ACCOUNT_SIGNER}): ${transferInstructionData.signer}`}
                </p>
                <p>
                  {`${LABELS.AMOUNT}: ${transferInstructionData.amount}`}
                </p>
              </> :
                <></>
            }
          </>
        }
      />
    ),
    data: <p className='wordwrap'>{instructionDetails.dataBase64}</p>
  };

  const isEditable =
    proposal.account.state === ProposalState.Draft && proposalAuthority;

  const deleteAction = () => {
    const onDelete = async () => {
      await removeInstruction(rpcContext, proposal, proposalInstruction.pubkey);
      changeTracker.notifyAccountRemoved(
        proposalInstruction.pubkey.toBase58(),
        GovernanceAccountType.ProposalInstructionV1
      );
    };

    return (
      <Button onClick={onDelete} disabled={!connected} key='delete'>
        <DeleteOutlined />
      </Button>
    );
  };

  return (
    <Card
      extra={
        <Space>
          <DryRunInstructionButton
            proposal={proposal}
            instructionData={instructionData}
          ></DryRunInstructionButton>
          <FlagInstructionErrorButton
            playState={playing}
            proposal={proposal}
            proposalInstruction={proposalInstruction}
            proposalAuthority={proposalAuthority}
          ></FlagInstructionErrorButton>
          <ExecuteInstructionButton
            playing={playing}
            setPlaying={setPlaying}
            proposal={proposal}
            proposalInstruction={proposalInstruction}
          />
        </Space>
      }
      tabList={[
        { key: 'info', tab: 'Info' },
        { key: 'data', tab: 'Data' }
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
