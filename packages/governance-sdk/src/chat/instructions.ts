import { ChatMessageBody } from './accounts';

export enum GovernanceChatInstruction {
  PostMessage = 0,
}

export class PostChatMessageArgs {
  instruction: GovernanceChatInstruction =
    GovernanceChatInstruction.PostMessage;
  body: ChatMessageBody;
  isReply: boolean;

  constructor(args: { body: ChatMessageBody; isReply: boolean }) {
    this.body = args.body;
    this.isReply = args.isReply;
  }
}
