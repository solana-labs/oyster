import React from 'react';
import {
  Governance,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
} from '../../../../models/accounts';

import SignOffButton from './signOffButton';
import { FinalizeVoteButton } from './finalizeVoteButton';
import { RelinquishVoteButton } from './relinquishVoteButton';
import { YesNoVote } from '../../../../models/instructions';
import { CastVoteButton } from './castVoteButton';

import {
  useWalletSignatoryRecord,
  useTokenOwnerVoteRecord,
} from '../../../../hooks/apiHooks';
import { useHasVoteTimeExpired } from '../../../../hooks/useHasVoteTimeExpired';
import { ProgramAccount } from '../../../../models/tools/solanaSdk';
import CancelButton from './cancelButton';

export function ProposalActionBar({
  governance,
  tokenOwnerRecord,
  proposal,
}: {
  governance: ProgramAccount<Governance>;
  tokenOwnerRecord: ProgramAccount<TokenOwnerRecord> | undefined;
  proposal: ProgramAccount<Proposal>;
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
        (proposal.account.state === ProposalState.Draft ||
          proposal.account.state === ProposalState.SigningOff) && (
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
            vote={YesNoVote.Yes}
            voteRecord={voteRecord}
            hasVoteTimeExpired={hasVoteTimeExpired}
          />
          <CastVoteButton
            governance={governance}
            proposal={proposal}
            vote={YesNoVote.No}
            tokenOwnerRecord={tokenOwnerRecord}
            voteRecord={voteRecord}
            hasVoteTimeExpired={hasVoteTimeExpired}
          />
          {/* <PostMessageButton
            proposal={proposal}
            tokenOwnerRecord={tokenOwnerRecord}
          ></PostMessageButton> */}
        </>
      )}
    </div>
  );
}
