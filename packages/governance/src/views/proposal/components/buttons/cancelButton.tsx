import { ExclamationCircleOutlined } from '@ant-design/icons';
import { ParsedAccount, contexts } from '@oyster/common';

import { Button, Modal } from 'antd';

import React from 'react';
import { cancelProposal } from '../../../../actions/cancelProposal';
import { useProposalAuthority } from '../../../../hooks/apiHooks';
import { useRpcContext } from '../../../../hooks/useRpcContext';

import { Proposal, ProposalState } from '../../../../models/accounts';

const { confirm } = Modal;

const { useWallet } = contexts.Wallet;

export default function CancelButton({
  proposal,
}: {
  proposal: ParsedAccount<Proposal>;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();
  const proposalAuthority = useProposalAuthority(
    proposal.info.tokenOwnerRecord,
  );

  if (
    !proposalAuthority ||
    !(
      proposal.info.state === ProposalState.Draft ||
      proposal.info.state === ProposalState.SigningOff ||
      proposal.info.state === ProposalState.Voting
    )
  ) {
    return null;
  }

  return (
    <Button
      onClick={() => {
        confirm({
          title: 'Do you want to cancel this proposal?',
          icon: <ExclamationCircleOutlined />,
          okText: 'Yes, Cancel',
          cancelText: 'No',

          onOk() {
            return cancelProposal(rpcContext, proposal);
          },
          onCancel() {
            // no-op
          },
        });
      }}
      disabled={!connected}
    >
      Cancel Proposal
    </Button>
  );
}
