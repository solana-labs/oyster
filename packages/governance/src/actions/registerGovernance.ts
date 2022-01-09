import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateAccountGovernance } from '@solana/governance-sdk';
import { GovernanceType } from '@solana/governance-sdk';
import { GovernanceConfig } from '@solana/governance-sdk';
import { withCreateProgramGovernance } from '@solana/governance-sdk';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { withCreateMintGovernance } from '@solana/governance-sdk';
import { withCreateTokenGovernance } from '@solana/governance-sdk';
import { RpcContext } from '@solana/governance-sdk';

export const registerGovernance = async (
  { connection, wallet, programId, walletPubkey }: RpcContext,
  governanceType: GovernanceType,
  realm: PublicKey,
  governedAccount: PublicKey,
  config: GovernanceConfig,
  transferAuthority: boolean,
  tokenOwnerRecord: PublicKey,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  let governanceAddress;
  let governanceAuthority = walletPubkey;

  switch (governanceType) {
    case GovernanceType.Account: {
      governanceAddress = (
        await withCreateAccountGovernance(
          instructions,
          programId,
          realm,
          governedAccount,
          config,
          tokenOwnerRecord,
          walletPubkey,
          governanceAuthority,
        )
      ).governanceAddress;
      break;
    }
    case GovernanceType.Program: {
      governanceAddress = (
        await withCreateProgramGovernance(
          instructions,
          programId,
          realm,
          governedAccount,
          config,
          transferAuthority!,
          walletPubkey,
          tokenOwnerRecord,
          walletPubkey,
          governanceAuthority,
        )
      ).governanceAddress;
      break;
    }
    case GovernanceType.Mint: {
      governanceAddress = (
        await withCreateMintGovernance(
          instructions,
          programId,
          realm,
          governedAccount,
          config,
          transferAuthority!,
          walletPubkey,
          tokenOwnerRecord,
          walletPubkey,
          governanceAuthority,
        )
      ).governanceAddress;
      break;
    }
    case GovernanceType.Token: {
      governanceAddress = (
        await withCreateTokenGovernance(
          instructions,
          programId,
          realm,
          governedAccount,
          config,
          transferAuthority!,
          walletPubkey,
          tokenOwnerRecord,
          walletPubkey,
          governanceAuthority,
        )
      ).governanceAddress;
      break;
    }
    default: {
      throw new Error(
        `Governance type ${governanceType} is not supported yet.`,
      );
    }
  }

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    [],
    'Registering governance',
    'Governance has been registered',
  );

  return governanceAddress;
};
