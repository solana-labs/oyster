import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateAccountGovernance } from '../models/withCreateAccountGovernance';
import { GovernanceType } from '../models/enums';
import { GovernanceConfig } from '../models/accounts';
import { withCreateProgramGovernance } from '../models/withCreateProgramGovernance';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { withCreateMintGovernance } from '../models/withCreateMintGovernance';
import { withCreateTokenGovernance } from '../models/withCreateTokenGovernance';

export const registerGovernance = async (
  connection: Connection,
  wallet: any,
  governanceType: GovernanceType,
  realm: PublicKey,
  config: GovernanceConfig,
  transferAuthority?: boolean,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  let governanceAddress;

  switch (governanceType) {
    case GovernanceType.Account: {
      governanceAddress = (
        await withCreateAccountGovernance(
          instructions,
          realm,
          config,
          wallet.publicKey,
        )
      ).governanceAddress;
      break;
    }
    case GovernanceType.Program: {
      governanceAddress = (
        await withCreateProgramGovernance(
          instructions,
          realm,
          config,
          transferAuthority!,
          wallet.publicKey,
          wallet.publicKey,
        )
      ).governanceAddress;
      break;
    }
    case GovernanceType.Mint: {
      governanceAddress = (
        await withCreateMintGovernance(
          instructions,
          realm,
          config,
          transferAuthority!,
          wallet.publicKey,
          wallet.publicKey,
        )
      ).governanceAddress;
      break;
    }
    case GovernanceType.Token: {
      governanceAddress = (
        await withCreateTokenGovernance(
          instructions,
          realm,
          config,
          transferAuthority!,
          wallet.publicKey,
          wallet.publicKey,
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
