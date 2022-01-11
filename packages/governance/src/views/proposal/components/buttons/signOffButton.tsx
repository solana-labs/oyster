import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useWallet } from '@oyster/common';
import { Button, Modal } from 'antd';
import React from 'react';
import { signOffProposal } from '../../../../actions/signOffProposal';
import { useRpcContext } from '../../../../hooks/useRpcContext';

import { Proposal, SignatoryRecord } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';

const { confirm } = Modal;

export default function SignOffButton({
  proposal,
  signatoryRecord,
}: {
  proposal: ProgramAccount<Proposal>;
  signatoryRecord: ProgramAccount<SignatoryRecord>;
}) {
  const { publicKey } = useWallet();
  const rpcContext = useRpcContext();

  return (
    <>
      {signatoryRecord.account.signedOff && (
        <Button disabled={true}>Signed</Button>
      )}
      {!signatoryRecord.account.signedOff && (
        <Button
          type="primary"
          onClick={() => {
            confirm({
              title: 'Do you want to sign off this proposal?',
              icon: <ExclamationCircleOutlined />,
              okText: 'Sign off',

              onOk() {
                return signOffProposal(rpcContext, signatoryRecord, publicKey!);
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
