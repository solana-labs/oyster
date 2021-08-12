import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ParsedAccount } from '@oyster/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button, Modal } from 'antd';
import React from 'react';
import { signOffProposal } from '../../../../actions/signOffProposal';
import { useRpcContext } from '../../../../hooks/useRpcContext';

import { Proposal, SignatoryRecord } from '../../../../models/accounts';

const { confirm } = Modal;

export default function SignOffButton({
  proposal,
  signatoryRecord,
}: {
  proposal: ParsedAccount<Proposal>;
  signatoryRecord: ParsedAccount<SignatoryRecord>;
}) {
  const { publicKey } = useWallet();
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
                  publicKey!,
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
