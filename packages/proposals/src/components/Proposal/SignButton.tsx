import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ParsedAccount, hooks, contexts, utils } from '@oyster/common';
import { Button, Modal } from 'antd';
import React from 'react';
import { sign } from '../../actions/sign';
import { Proposal, ProposalState } from '../../models/timelock';
const { confirm } = Modal;

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;
const { useAccountByMint } = hooks;
const { notify } = utils;

export default function SignButton({
  proposal,
  state,
}: {
  proposal: ParsedAccount<Proposal>;
  state: ParsedAccount<ProposalState>;
}) {
  const wallet = useWallet();
  const connection = useConnection();
  const sigAccount = useAccountByMint(proposal.info.signatoryMint);
  return (
    <>
      {sigAccount && sigAccount.info.amount.toNumber() === 0 && (
        <Button disabled={true}>Signed</Button>
      )}
      {sigAccount && sigAccount.info.amount.toNumber() > 0 && (
        <Button
          onClick={() => {
            confirm({
              title: 'Do you want to sign this proposal?',
              icon: <ExclamationCircleOutlined />,
              content: 'This is a non-reversible action.',
              onOk() {
                if (!sigAccount) {
                  notify({
                    message: 'Signature account is not defined',
                    type: 'error',
                  });
                  return;
                }

                return sign(
                  connection,
                  wallet.wallet,
                  proposal,
                  state,
                  sigAccount.pubkey,
                );
              },
              onCancel() {
                // no-op
              },
            });
          }}
        >
          Sign
        </Button>
      )}
    </>
  );
}
