import { useWallet } from '@oyster/common';
import { Button } from 'antd';
import React from 'react';

import { Proposal, TokenOwnerRecord } from '@solana/governance-sdk';

import { postChatMessage } from '../../../../actions/chat/postChatMessage';

import { useRpcContext } from '../../../../hooks/useRpcContext';
import { ChatMessageBody, ChatMessageBodyType } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

export function PostChatMessageButton({
  tokenOwnerRecord,
  proposal,
}: {
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>;
  proposal: ProgramAccount<Proposal>;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();

  const isVisible = connected;
  const body = new ChatMessageBody({
    type: ChatMessageBodyType.Text,
    value: 'My comment',
  });

  return isVisible ? (
    <Button
      type="default"
      onClick={async () => {
        try {
          await postChatMessage(
            rpcContext,
            proposal,
            tokenOwnerRecord.pubkey,
            undefined,
            body,
          );
        } catch (ex) {
          console.error(ex);
        }
      }}
    >
      Comment
    </Button>
  ) : null;
}
