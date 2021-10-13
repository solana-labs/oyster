import { ParsedAccount } from '@oyster/common';
import { Button } from 'antd';
import React from 'react';

import { contexts } from '@oyster/common';

import { Proposal, TokenOwnerRecord } from '../../../../models/accounts';

import { postChatMessage } from '../../../../actions/chat/postChatMessage';

import { useRpcContext } from '../../../../hooks/useRpcContext';
import {
  ChatMessageBody,
  ChatMessageBodyType,
} from '../../../../models/chat/accounts';

const { useWallet } = contexts.Wallet;

export function PostChatMessageButton({
  tokenOwnerRecord,
  proposal,
}: {
  tokenOwnerRecord: ParsedAccount<TokenOwnerRecord>;
  proposal: ParsedAccount<Proposal>;
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
