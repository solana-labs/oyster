import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils } from '@oyster/common';
import * as BufferLayout from 'buffer-layout';
import { GovernanceInstruction } from './governance';

///   0. `[]` Governance voting record key. Needs to be set with pubkey set to PDA with seeds of the
///           program account key, proposal key, your voting account key.
///   1. `[]` Proposal key
///   2. `[]` Your voting account
///   3. `[]` Payer
///   4. `[]` Governance program pub key
///   5. `[]` System account.
export const createEmptyGovernanceVotingRecordInstruction = (
  governanceRecordAccount: PublicKey,
  proposalAccount: PublicKey,
  votingAccount: PublicKey,
  payer: PublicKey,
): TransactionInstruction => {
  const PROGRAM_IDS = utils.programIds();

  const dataLayout = BufferLayout.struct([BufferLayout.u8('instruction')]);

  const data = Buffer.alloc(dataLayout.span);

  dataLayout.encode(
    {
      instruction: GovernanceInstruction.CreateGovernanceVotingRecord,
    },
    data,
  );

  const keys = [
    { pubkey: governanceRecordAccount, isSigner: false, isWritable: false },
    { pubkey: proposalAccount, isSigner: false, isWritable: false },
    { pubkey: votingAccount, isSigner: false, isWritable: false },
    { pubkey: payer, isSigner: true, isWritable: false },
    {
      pubkey: PROGRAM_IDS.governance.programId,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: PROGRAM_IDS.system, isSigner: false, isWritable: false },
  ];
  return new TransactionInstruction({
    keys,
    programId: PROGRAM_IDS.governance.programId,
    data,
  });
};
