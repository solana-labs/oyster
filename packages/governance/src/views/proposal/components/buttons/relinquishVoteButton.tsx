import { ParsedAccount } from '@oyster/common';
import { Button, Col, Modal, Row } from 'antd';
import React from 'react';

import { LABELS } from '../../../../constants';

import { contexts } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import {
  GovernanceAccountType,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
} from '../../../../models/accounts';
import { useAccountChangeTracker } from '../../../../contexts/GovernanceContext';
import { relinquishVote } from '../../../../actions/relinquishVote';
import { useWalletVoteRecord } from '../../../../hooks/apiHooks';
import { useRpcContext } from '../../../../hooks/useRpcContext';

const { useWallet } = contexts.Wallet;

const { confirm } = Modal;
export function RelinquishVoteButton({
  proposal,
  tokenOwnerRecord,
}: {
  proposal: ParsedAccount<Proposal>;
  tokenOwnerRecord: ParsedAccount<TokenOwnerRecord>;
}) {
  const { connected } = useWallet();
  const rpcContext = useRpcContext();

  const voteRecord = useWalletVoteRecord(proposal.pubkey);

  const accountChangeTracker = useAccountChangeTracker();

  const isVisible =
    connected &&
    voteRecord &&
    !voteRecord?.info.isRelinquished &&
    (proposal.info.state === ProposalState.Voting ||
      proposal.info.state === ProposalState.Completed ||
      proposal.info.state === ProposalState.Succeeded ||
      proposal.info.state === ProposalState.Executing ||
      proposal.info.state === ProposalState.Defeated);

  return isVisible ? (
    <Button
      type="primary"
      onClick={async () => {
        if (proposal.info.state !== ProposalState.Voting) {
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
                GovernanceAccountType.VoteRecord,
              );
            } catch (ex) {
              console.error(ex);
            }
          },
        });
      }}
    >
      {proposal.info.state === ProposalState.Voting
        ? LABELS.WITHDRAW_VOTE
        : LABELS.RELEASE_MY_TOKENS}
    </Button>
  ) : null;
}
