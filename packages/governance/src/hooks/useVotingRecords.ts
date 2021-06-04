import { useEffect, useState } from 'react';

import { PublicKey } from '@solana/web3.js';
import {
  ParsedAccount,
  useConnection,
  useConnectionConfig,
  utils,
} from '@oyster/common';
import {
  GovernanceVotingRecord,
  GovernanceVotingRecordLayout,
  GovernanceVotingRecordParser,
} from '../models/serialisation';
import { getGovernanceVotingRecords } from '../utils/lookups';

export function useVotingRecords(proposal?: PublicKey) {
  const [votingRecords, setVotingRecords] = useState<
    Record<string, ParsedAccount<GovernanceVotingRecord>>
  >({});

  const { endpoint } = useConnectionConfig();
  const connection = useConnection();

  useEffect(() => {
    if (!proposal) {
      return;
    }

    const sub = (async () => {
      const records = await getGovernanceVotingRecords(proposal, endpoint);
      setVotingRecords(records);

      const { governance } = utils.programIds();

      return connection.onProgramAccountChange(governance.programId, info => {
        if (
          info.accountInfo.data.length === GovernanceVotingRecordLayout.span
        ) {
          const votingRecord = GovernanceVotingRecordParser(
            info.accountId,
            info.accountInfo,
          ) as ParsedAccount<GovernanceVotingRecord>;

          if (votingRecord.info.proposal.toBase58() !== proposal.toBase58()) {
            return;
          }

          setVotingRecords(vrs => ({
            ...vrs,
            [votingRecord.info.owner.toBase58()]: votingRecord,
          }));
        }
      });
    })();

    return () => {
      sub.then(id => connection.removeProgramAccountChangeListener(id));
    };
  }, [proposal, connection, endpoint]);

  return votingRecords;
}
