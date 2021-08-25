import {
  ChatMessage,
  GovernanceChatAccountClass,
  MessageBody,
} from './accounts';
import { BorshAccountParser } from '../core/serialisation';
import { PostMessageArgs } from './instructions';

export const GOVERNANCE_CHAT_SCHEMA = new Map<any, any>([
  [
    MessageBody,
    {
      kind: 'struct',
      fields: [
        ['type', 'u8'],
        ['value', 'string'],
      ],
    },
  ],
  [
    ChatMessage,
    {
      kind: 'struct',
      fields: [
        ['accountType', 'u8'],
        ['proposal', 'pubkey'],
        ['author', 'pubkey'],
        ['postedAt', 'u64'],
        ['replyTo', { kind: 'option', type: 'pubkey' }],
        ['body', MessageBody],
      ],
    },
  ],
  [
    PostMessageArgs,
    {
      kind: 'struct',
      fields: [
        ['instruction', 'u8'],
        ['body', MessageBody],
      ],
    },
  ],
]);

export const ChatAccountParser = (classType: GovernanceChatAccountClass) =>
  BorshAccountParser(classType, GOVERNANCE_CHAT_SCHEMA);
