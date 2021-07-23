import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ParsedAccount, contexts } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { Button, Modal } from 'antd';
import React from 'react';
import { signOffProposal } from '../../../../actions/signOffProposal';
import { useRpcContext } from '../../../../hooks/useRpcContext';

import { Proposal, SignatoryRecord } from '../../../../models/accounts';

const { confirm } = Modal;

const { useWallet } = contexts.Wallet;

export default function SignOffButton({
  proposal,
  signatoryRecord,
}: {
  proposal: ParsedAccount<Proposal>;
  signatoryRecord: ParsedAccount<SignatoryRecord>;
}) {
  const { wallet } = useWallet();
  const rpcContext = useRpcContext();

  return (
    <>
      {signatoryRecord.info.signedOff && (
        <Button disabled={true}>Signed</Button>
      )}
      {!signatoryRecord.info.signedOff && (
        <Button
          type="primary"
          onClick={() => {
            confirm({
              title: 'Do you want to sign off this proposal?',
              icon: <ExclamationCircleOutlined />,
              okText: 'Sign off',

              onOk() {
                return signOffProposal(
                  rpcContext,
                  signatoryRecord,
                  wallet!.publicKey as PublicKey,
                );
              },
              onCancel() {
                // no-op
              },
            });
          }}
        >
          Sign Off
        </Button>
      )}
    </>
  );
}
