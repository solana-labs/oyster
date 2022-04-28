import React from 'react';
import {
  Governance,
  Proposal,
  ProposalState,
  TokenOwnerRecord,
} from '@solana/spl-governance';

import SignOffButton from './signOffButton';
import { FinalizeVoteButton } from './finalizeVoteButton';
import { RelinquishVoteButton } from './relinquishVoteButton';
import { YesNoVote } from '@solana/spl-governance';
import { CastVoteButton } from './castVoteButton';

import {
  useWalletSignatoryRecord,
  useTokenOwnerVoteRecord,
} from '../../../../hooks/apiHooks';
import { useHasVoteTimeExpired } from '../../../../hooks/useHasVoteTimeExpired';
import { ProgramAccount } from '@solana/spl-governance';
import CancelButton from './cancelButton';
import { AccountVoterWeightRecord } from '../../../../hooks/governance-sdk';

export function ProposalActionBar({
  governance,
  tokenOwnerRecord,
  voterWeightRecord,
  proposal,
}: {
  governance: ProgramAccount<Governance>;
  tokenOwnerRecord?: ProgramAccount<TokenOwnerRecord>;
  voterWeightRecord?: AccountVoterWeightRecord;
  proposal: ProgramAccount<Proposal>;
}) {
  const signatoryRecord = useWalletSignatoryRecord(proposal.pubkey);

  const voteRecord = useTokenOwnerVoteRecord(
    proposal.pubkey,
    tokenOwnerRecord?.pubkey,
  );

  const hasVoteTimeExpired = useHasVoteTimeExpired(governance, proposal);

  return (
    <div className="proposal-actions">
      <CancelButton
        proposal={proposal}
        realm={governance.account.realm}
      ></CancelButton>

      {signatoryRecord &&
        (proposal.account.state === ProposalState.Draft ||
          proposal.account.state === ProposalState.SigningOff) && (
          <SignOffButton
            realm={governance.account.realm}
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
            voterWeightRecord={voterWeightRecord}
            vote={YesNoVote.Yes}
            voteRecord={voteRecord}
            hasVoteTimeExpired={hasVoteTimeExpired}
          />
          <CastVoteButton
            governance={governance}
            proposal={proposal}
            vote={YesNoVote.No}
            tokenOwnerRecord={tokenOwnerRecord}
            voterWeightRecord={voterWeightRecord}
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
