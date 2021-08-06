import React from 'react';
import {
  Governance,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
} from '../../../../models/accounts';
import CancelButton from './cancelButton';
import { ParsedAccount } from '@oyster/common';
import SignOffButton from './signOffButton';
import { FinalizeVoteButton } from './finalizeVoteButton';
import { RelinquishVoteButton } from './relinquishVoteButton';
import { Vote } from '../../../../models/instructions';
import { CastVoteButton } from './castVoteButton';

import {
  useWalletSignatoryRecord,
  useTokenOwnerVoteRecord,
} from '../../../../hooks/apiHooks';
import { useHasVoteTimeExpired } from '../../../../hooks/useHasVoteTimeExpired';

export function ProposalActionBar({
  governance,
  tokenOwnerRecord,
  proposal,
}: {
  governance: ParsedAccount<Governance>;
  tokenOwnerRecord: ParsedAccount<TokenOwnerRecord> | undefined;
  proposal: ParsedAccount<Proposal>;
}) {
  let signatoryRecord = useWalletSignatoryRecord(proposal.pubkey);

  const voteRecord = useTokenOwnerVoteRecord(
    proposal.pubkey,
    tokenOwnerRecord?.pubkey,
  );

  const hasVoteTimeExpired = useHasVoteTimeExpired(governance, proposal);

  return (
    <div className="proposal-actions">
      <CancelButton proposal={proposal}></CancelButton>

      {signatoryRecord &&
        (proposal.info.state === ProposalState.Draft ||
          proposal.info.state === ProposalState.SigningOff) && (
          <SignOffButton
            signatoryRecord={signatoryRecord}
            proposal={proposal}
          />
        )}
      <FinalizeVoteButton
        proposal={proposal}
        governance={governance}
        hasVoteTimeExpired={hasVoteTimeExpired}
      ></FinalizeVoteButton>

      {tokenOwnerRecord && (
        <>
          <RelinquishVoteButton
            proposal={proposal}
            tokenOwnerRecord={tokenOwnerRecord}
            voteRecord={voteRecord?.tryUnwrap()}
            hasVoteTimeExpired={hasVoteTimeExpired}
          />
          <CastVoteButton
            governance={governance}
            proposal={proposal}
            tokenOwnerRecord={tokenOwnerRecord}
            vote={Vote.Yes}
            voteRecord={voteRecord}
            hasVoteTimeExpired={hasVoteTimeExpired}
          />
          <CastVoteButton
            governance={governance}
            proposal={proposal}
            vote={Vote.No}
            tokenOwnerRecord={tokenOwnerRecord}
            voteRecord={voteRecord}
            hasVoteTimeExpired={hasVoteTimeExpired}
          />
        </>
      )}
    </div>
  );
}
