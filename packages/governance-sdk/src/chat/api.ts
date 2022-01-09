import { PublicKey } from '@solana/web3.js';

import {
  getBorshProgramAccounts,
  MemcmpFilter,
  pubkeyFilter,
} from '../core/api';
import { ChatMessage, GOVERNANCE_CHAT_PROGRAM_ID } from './accounts';

import { GOVERNANCE_CHAT_SCHEMA } from './serialisation';

export function getGovernanceChatMessages(
  endpoint: string,
  proposal: PublicKey,
) {
  return getBorshProgramAccounts<ChatMessage>(
    GOVERNANCE_CHAT_PROGRAM_ID,
    _ => GOVERNANCE_CHAT_SCHEMA,
    endpoint,
    ChatMessage,
    [pubkeyFilter(1, proposal) as MemcmpFilter],
  );
}
