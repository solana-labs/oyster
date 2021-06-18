import { Account, Connection, TransactionInstruction } from '@solana/web3.js';
import { contexts, utils, ParsedAccount } from '@oyster/common';

import { Proposal, ProposalInstruction } from '../models/accounts';

import { withExecuteInstruction } from '../models/withExecuteInstruction';

const { sendTransaction } = contexts.Connection;
const { notify } = utils;

export const executeInstruction = async (
  connection: Connection,
  wallet: any,
  proposal: ParsedAccount<Proposal>,
  instruction: ParsedAccount<ProposalInstruction>,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  await withExecuteInstruction(
    instructions,
    proposal.info.governance,
    proposal.pubkey,
    instruction.pubkey,
    instruction.info.instruction,
  );

  notify({
    message: 'Executing instruction...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(
      connection,
      wallet,
      instructions,
      signers,
      true,
    );

    notify({
      message: 'Instruction executed.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};
