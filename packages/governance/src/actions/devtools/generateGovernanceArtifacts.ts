import {
  Account,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';

import {
  utils,
  createMint,
  createTokenAccount,
  sendTransactions,
  SequenceType,
} from '@oyster/common';

import { AccountLayout, MintLayout, Token } from '@solana/spl-token';
import { setAuthority } from '@project-serum/serum/lib/token-instructions';
import { GOVERNANCE_PROGRAM_SEED } from '../../models/accounts';
import { serializeInstructionToBase64 } from '../../models/serialisation';

const { notify } = utils;
export interface SourceEntryInterface {
  owner: PublicKey;
  sourceAccount: PublicKey | undefined;
  tokenAmount: number;
}
export const generateGovernanceArtifacts = async (
  connection: Connection,
  wallet: any,
) => {
  const PROGRAM_IDS = utils.programIds();

  let communityMintSigners: Account[] = [];
  let communityMintInstruction: TransactionInstruction[] = [];

  // Setup community mint
  const [communityMintAddress, otherOwner] = await withMint(
    communityMintInstruction,
    communityMintSigners,
    connection,
    wallet,
    70,
    100,
  );

  let councilMinSigners: Account[] = [];
  let councilMintInstructions: TransactionInstruction[] = [];

  // Setup council mint
  const [councilMintAddress] = await withMint(
    councilMintInstructions,
    councilMinSigners,
    connection,
    wallet,
    20,
    55,
  );

  // Setup Realm, Governance and Proposal instruction
  let governanceSigners: Account[] = [];
  let governanceInstructions: TransactionInstruction[] = [];

  let realmName = `Realm-${communityMintAddress.toBase58().substring(0, 5)}`;
  let governedAccount = communityMintAddress;

  const [realmAddress] = await PublicKey.findProgramAddress(
    [Buffer.from(GOVERNANCE_PROGRAM_SEED), Buffer.from(realmName)],
    PROGRAM_IDS.governance.programId,
  );

  const [governanceAddress] = await PublicKey.findProgramAddress(
    [
      Buffer.from('account-governance'),
      realmAddress.toBuffer(),
      governedAccount.toBuffer(),
    ],
    PROGRAM_IDS.governance.programId,
  );

  // Use setAuthority from Serum because I couldn't get Token.createSetAuthorityInstruction to work
  // It looks like version mismatch because the function in the SDK takes authorityType params
  // This step will be uneccesery once we have CreateMintAuthority instruction
  let ix = setAuthority({
    target: communityMintAddress,
    currentAuthority: wallet.publicKey,
    newAuthority: governanceAddress,
    authorityType: 'MintTokens',
  });

  governanceInstructions.push(ix);

  const mintToInstruction: TransactionInstruction = Token.createMintToInstruction(
    PROGRAM_IDS.token,
    communityMintAddress,
    otherOwner,
    governanceAddress,
    [],
    1,
  );

  const instructionBase64 = serializeInstructionToBase64(mintToInstruction);

  notify({
    message: 'Creating Governance artifacts...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransactions(
      connection,
      wallet,
      [
        communityMintInstruction,
        councilMintInstructions,
        governanceInstructions,
      ],
      [communityMintSigners, councilMinSigners, governanceSigners],
      SequenceType.Sequential,
    );

    notify({
      message: 'Governance artifacts created.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return {
      realmName,
      communityMintAddress,
      councilMintAddress,
      instructionBase64,
    };
  } catch (ex) {
    console.log('ERROR', ex);
    console.error(ex);
    throw new Error();
  }
};

const withMint = async (
  instructions: TransactionInstruction[],
  signers: Account[],
  connection: Connection,
  wallet: any,
  amount: number,
  supply: number,
) => {
  const PROGRAM_IDS = utils.programIds();

  const mintRentExempt = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span,
  );

  const tokenAccountRentExempt = await connection.getMinimumBalanceForRentExemption(
    AccountLayout.span,
  );

  const accountRentExempt = await connection.getMinimumBalanceForRentExemption(
    0,
  );

  const mintAddress = createMint(
    instructions,
    wallet.publicKey,
    mintRentExempt,
    0,
    wallet.publicKey,
    wallet.publicKey,
    signers,
  );

  const tokenAccountAddress = createTokenAccount(
    instructions,
    wallet.publicKey,
    tokenAccountRentExempt,
    mintAddress,
    wallet.publicKey,
    signers,
  );

  if (amount) {
    instructions.push(
      Token.createMintToInstruction(
        PROGRAM_IDS.token,
        mintAddress,
        tokenAccountAddress,
        wallet.publicKey,
        [],
        amount,
      ),
    );
  }

  const otherOwner = new Account();
  instructions.push(
    SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: otherOwner.publicKey,
      lamports: accountRentExempt,
      space: 0,
      programId: PROGRAM_IDS.system,
    }),
  );

  signers.push(otherOwner);

  const otherOwnerTokenAccount = createTokenAccount(
    instructions,
    wallet.publicKey,
    tokenAccountRentExempt,
    mintAddress,
    otherOwner.publicKey,
    signers,
  );

  instructions.push(
    Token.createMintToInstruction(
      PROGRAM_IDS.token,
      mintAddress,
      otherOwnerTokenAccount,
      wallet.publicKey,
      [],
      supply - (amount ?? 0),
    ),
  );

  return [mintAddress, otherOwnerTokenAccount];
};
