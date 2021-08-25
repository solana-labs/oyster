import { MessageBody } from './accounts';

export enum GovernanceChatInstruction {
  PostMessage = 0,
}

export class PostMessageArgs {
  instruction: GovernanceChatInstruction =
    GovernanceChatInstruction.PostMessage;
  body: MessageBody;

  constructor(args: { body: MessageBody }) {
    this.body = args.body;
  }
}
