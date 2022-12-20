import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useWallet } from '@oyster/common';
import {Button, Modal, Tooltip} from 'antd';
import React from 'react';
import { cancelProposal } from '../../../../actions/cancelProposal';
import {useGovernance, useProposalAuthority} from '../../../../hooks/apiHooks';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { Proposal, ProposalState } from '@solana/spl-governance';
import { ProgramAccount } from '@solana/spl-governance';
import { PublicKey } from '@solana/web3.js';
import {useHasVoteTimeExpired} from "../../../../hooks/useHasVoteTimeExpired";
import {LABELS} from "../../../../constants";

const { confirm } = Modal;

export default function CancelButton({
  realm,
  proposal,
}: {
  realm: PublicKey;
  proposal: ProgramAccount<Proposal>;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();
  let governance = useGovernance(proposal?.account.governance);
  const isVoteTimeExpired = useHasVoteTimeExpired(governance, proposal);
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

  const cancelButton = <Button
    onClick={() => {
      confirm({
        title: 'Do you want to cancel this proposal?',
        icon: <ExclamationCircleOutlined />,
        okText: 'Yes, Cancel',
        cancelText: 'No',

        onOk() {
          return cancelProposal(rpcContext, realm, proposal);
        },
        onCancel() {
          // no-op
        },
      });
    }}
    disabled={!connected || isVoteTimeExpired}
  >
    Cancel Proposal
  </Button>;

  let cancelCtaDisabledReason = undefined;
  if(!connected)
    cancelCtaDisabledReason = LABELS.CANCEL_PROPOSAL_DISABLED_NOT_CONNECTED;
  if(isVoteTimeExpired)
    cancelCtaDisabledReason = LABELS.CANCEL_PROPOSAL_DISABLED_VOTE_EXPIRED;

  return (
    <>
    {!connected || isVoteTimeExpired ?
        <Tooltip color='orange' placement='left' title={cancelCtaDisabledReason}>
          {cancelButton}
        </Tooltip> :
      cancelButton}
    </>
  );
}
