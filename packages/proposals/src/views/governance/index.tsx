import React, { useEffect, useState } from 'react';
import { useProposals } from '../../contexts/proposals';
import { LABELS } from '../../constants';

import {
  hooks,
  useWallet,
  useConnection,
  deserializeMint,
  ParsedAccount,
} from '@oyster/common';
import {
  ExecutionType,
  Governance,
  GovernanceType,
  VotingEntryRule,
} from '../../models/governance';
import { PublicKey } from '@solana/web3.js';
import { Table } from 'antd';
import MintSourceTokens from '../../components/Proposal/MintSourceTokens';
import BN from 'bn.js';
const { useUserAccounts } = hooks;
const columns = [
  {
    title: LABELS.NAME,
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: LABELS.VOTE_PERCENT_THRESHOLD,
    dataIndex: 'voteThreshold',
    key: 'voteThreshold',
    render: (number: number) => <span>{number}</span>,
  },
  {
    title: LABELS.EXECUTION_TYPE,
    dataIndex: 'executionType',
    key: 'executionType',
    render: (number: number) => <span>{ExecutionType[number]}</span>,
  },
  {
    title: LABELS.PROPOSAL_TYPE,
    dataIndex: 'timelockType',
    key: 'timelockType',
    render: (number: number) => <span>{GovernanceType[number]}</span>,
  },
  {
    title: LABELS.VOTING_ENTRY_RULES,
    dataIndex: 'votingEntryRule',
    key: 'votingEntryRule',
    render: (number: number) => <span>{VotingEntryRule[number]}</span>,
  },
  {
    title: LABELS.MINIMUM_SLOT_WAITING_PERIOD,
    dataIndex: 'minimumSlotWaitingPeriod',
    key: 'minimumSlotWaitingPeriod',
    render: (number: BN) => <span>{number.toNumber()}</span>,
  },
  {
    title: LABELS.TIME_LIMIT,
    dataIndex: 'timeLimit',
    key: 'timeLimit',
    render: (number: BN) => <span>{number.toNumber()}</span>,
  },
  {
    title: LABELS.GOVERNANCE_MINT,
    dataIndex: 'governanceMint',
    key: 'governanceMint',
    render: (key: PublicKey) => <span>{key.toBase58()}</span>,
  },
  {
    title: LABELS.COUNCIL_MINT,
    dataIndex: 'councilMint',
    key: 'councilMint',
    render: (key: PublicKey) => <span>{key?.toBase58()}</span>,
  },
  {
    title: LABELS.PROGRAM_ID,
    dataIndex: 'program',
    key: 'program',
    render: (key: PublicKey) => <span>{key.toBase58()}</span>,
  },

  {
    title: LABELS.ACTIONS,
    dataIndex: 'config',
    key: 'config',
    render: (config: ParsedAccount<Governance>) => (
      <>
        <MintSourceTokens timelockConfig={config} useGovernance={true} />
        {config.info.councilMint && (
          <MintSourceTokens timelockConfig={config} useGovernance={false} />
        )}
      </>
    ),
  },
];

export const GovernanceDashboard = () => {
  const context = useProposals();
  const connection = useConnection();
  const wallet = useWallet();
  const configs = Object.values(context.configs);
  const [data, setData] = useState<any>([]);
  const myTokenAccts = useUserAccounts()?.userAccounts?.map(a =>
    a.info.mint.toBase58(),
  );
  useEffect(() => {
    // We look for configs that share a mint with your token accounts - we
    // assume you weren't so dumb as to delete the token account corresponding to
    // the mint you govern. If you did, you need to remake it, because we're using this to
    // limit the mints we need to query from the blockchain and save space on your machine.
    const configsWithMyMint = configs.filter(c =>
      myTokenAccts.includes(c.info.governanceMint.toBase58()),
    );
    Promise.all(
      configsWithMyMint.map(c =>
        connection
          .getAccountInfo(c.info.governanceMint)
          .then(d => (d ? deserializeMint(d.data) : null)),
      ),
    ).then(mints => {
      const configsWithMintsThatIGovern = configsWithMyMint.filter(
        (c, i) =>
          mints[i]?.mintAuthority?.toBase58() ===
          wallet.wallet?.publicKey?.toBase58(),
      );

      setData(
        configsWithMintsThatIGovern.map(c => ({
          config: c,
          ...c.info,
        })),
      );
    });
  }, [configs.length, myTokenAccts.join(',')]); //eslint-disable-line

  return <Table columns={columns} dataSource={data} />;
};
