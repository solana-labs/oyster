import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useWallet } from '@oyster/common';
import { Button, Modal } from 'antd';
import React from 'react';
import { cancelProposal } from '../../../../actions/cancelProposal';
import { useProposalAuthority } from '../../../../hooks/apiHooks';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { Proposal, ProposalState } from '@solana/governance-sdk';
import { ProgramAccount } from '@solana/governance-sdk';

const { confirm } = Modal;

export default function CancelButton({
  proposal,
}: {
  proposal: ProgramAccount<Proposal>;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();
  const proposalAuthority = useProposalAuthority(
    proposal.account.tokenOwnerRecord,
  );

  if (
    !proposalAuthority ||
    !(
      proposal.account.state === ProposalState.Draft ||
      proposal.account.state === ProposalState.SigningOff ||
      proposal.account.state === ProposalState.Voting
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
