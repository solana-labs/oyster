import { useWallet } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import { LABELS } from '../../../../constants';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  GovernanceAccountType,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
  VoteRecord,
} from '@solana/spl-governance';
import { useAccountChangeTracker } from '../../../../contexts/GovernanceContext';
import { relinquishVote } from '../../../../actions/relinquishVote';
import { useRpcContext } from '../../../../hooks/useRpcContext';
import { ProgramAccount } from '@solana/spl-governance';

const { confirm } = Modal;
export function RelinquishVoteButton({
  proposal,
  tokenOwnerRecord,
  voteRecord,
  hasVoteTimeExpired,
}: {
  proposal: ProgramAccount<Proposal>;
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord>;
  voteRecord: ProgramAccount<VoteRecord> | undefined;
  hasVoteTimeExpired: boolean | undefined;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();

  const accountChangeTracker = useAccountChangeTracker();

  const isVisible =
    connected &&
    voteRecord &&
    !voteRecord?.account.isRelinquished &&
    (proposal.account.state === ProposalState.Voting ||
      proposal.account.state === ProposalState.Completed ||
      proposal.account.state === ProposalState.Cancelled ||
      proposal.account.state === ProposalState.Succeeded ||
      proposal.account.state === ProposalState.Executing ||
      proposal.account.state === ProposalState.Defeated);

  const isVoting =
    proposal.account.state === ProposalState.Voting && !hasVoteTimeExpired;

  return isVisible ? (
    <Button
      type="primary"
      onClick={async () => {
        if (!isVoting) {
          try {
            await relinquishVote(
              rpcContext,
              proposal,
              tokenOwnerRecord.pubkey,
              voteRecord!.pubkey,
              false,
            );
          } catch (ex) {
            console.error(ex);
          }

          return;
        }

        confirm({
          title: LABELS.WITHDRAW_VOTE,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>{LABELS.WITHDRAW_YOUR_VOTE_MSG}</p>
              </Col>
            </Row>
          ),
          okText: LABELS.WITHDRAW,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            try {
              await relinquishVote(
                rpcContext,
                proposal,
                tokenOwnerRecord.pubkey,
                voteRecord!.pubkey,
                true,
              );

              accountChangeTracker.notifyAccountRemoved(
                voteRecord!.pubkey.toBase58(),
                GovernanceAccountType.VoteRecordV1,
              );
            } catch (ex) {
              console.error(ex);
            }
          },
        });
      }}
    >
      {isVoting ? LABELS.WITHDRAW_VOTE : LABELS.RELEASE_MY_TOKENS}
    </Button>
  ) : null;
}
