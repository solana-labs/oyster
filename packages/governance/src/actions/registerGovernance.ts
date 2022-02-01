import { PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateGovernance } from '@solana/spl-governance';
import { GovernanceType } from '@solana/spl-governance';
import { GovernanceConfig } from '@solana/spl-governance';
import { withCreateProgramGovernance } from '@solana/spl-governance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { withCreateMintGovernance } from '@solana/spl-governance';
import { withCreateTokenGovernance } from '@solana/spl-governance';
import { RpcContext } from '@solana/spl-governance';

export const registerGovernance = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
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
      governanceAddress = await withCreateGovernance(
        instructions,
        programId,
        programVersion,
        realm,
        governedAccount,
        config,
        tokenOwnerRecord,
        walletPubkey,
        governanceAuthority,
      );
      break;
    }
    case GovernanceType.Program: {
      governanceAddress = await withCreateProgramGovernance(
        instructions,
        programId,
        programVersion,
        realm,
        governedAccount,
        config,
        transferAuthority!,
        walletPubkey,
        tokenOwnerRecord,
        walletPubkey,
        governanceAuthority,
      );
      break;
    }
    case GovernanceType.Mint: {
      governanceAddress = await withCreateMintGovernance(
        instructions,
        programId,
        programVersion,
        realm,
        governedAccount,
        config,
        transferAuthority!,
        walletPubkey,
        tokenOwnerRecord,
        walletPubkey,
        governanceAuthority,
      );
      break;
    }
    case GovernanceType.Token: {
      governanceAddress = await withCreateTokenGovernance(
        instructions,
        programId,
        programVersion,
        realm,
        governedAccount,
        config,
        transferAuthority!,
        walletPubkey,
        tokenOwnerRecord,
        walletPubkey,
        governanceAuthority,
      );
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
