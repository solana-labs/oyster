import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ParsedAccount, contexts } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { Button, Modal } from 'antd';
import React from 'react';
import { signOffProposal } from '../../../actions/signOffProposal';

import { SignatoryRecord } from '../../../models/accounts';

const { confirm } = Modal;

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export default function SignOffButton({
  signatoryRecord,
}: {
  signatoryRecord: ParsedAccount<SignatoryRecord>;
}) {
  const { wallet } = useWallet();
  const connection = useConnection();

  return (
    <>
      {signatoryRecord.info.signedOff && (
        <Button disabled={true}>Signed</Button>
      )}
      {!signatoryRecord.info.signedOff && (
        <Button
          onClick={() => {
            confirm({
              title: 'Do you want to sign off this proposal?',
              icon: <ExclamationCircleOutlined />,
              okText: 'Sign off',

              onOk() {
                return signOffProposal(
                  connection,
                  wallet,
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
