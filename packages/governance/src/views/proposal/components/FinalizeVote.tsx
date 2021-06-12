import { ParsedAccount } from '@oyster/common';
import { Button } from 'antd';
import React from 'react';

import { LABELS } from '../../../constants';

import { contexts } from '@oyster/common';

import { Governance, Proposal, ProposalState } from '../../../models/accounts';

import { finalizeVote } from '../../../actions/finalizeVote';
import { useHasVotingTimeExpired } from '../../../hooks/useHasVotingTimeExpired';

const { useWallet } = contexts.Wallet;
const { useConnection } = contexts.Connection;

export function FinalizeVote({
  governance,
  proposal,
}: {
  governance: ParsedAccount<Governance>;
  proposal: ParsedAccount<Proposal>;
}) {
  const { wallet, connected } = useWallet();
  const connection = useConnection();
  const hasVotingTimeExpired = useHasVotingTimeExpired(governance, proposal);

  const isVisible =
    hasVotingTimeExpired === true &&
    connected &&
    proposal.info.state === ProposalState.Voting;

  return isVisible ? (
    <Button
      type="primary"
      onClick={async () => {
        try {
          await finalizeVote(connection, wallet, proposal);
        } catch (ex) {
          console.error(ex);
        }
      }}
    >
      {LABELS.FINALIZE_VOTE}
    </Button>
  ) : null;
}
