import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { withCreateAccountGovernance } from '../models/withCreateAccountGovernance';
import { GovernanceType } from '../models/enums';
import { GovernanceConfig } from '../models/accounts';
import { withCreateProgramGovernance } from '../models/withCreateProgramGovernance';
import { sendTransactionWithNotifications } from '../tools/transactions';

export const registerGovernance = async (
  connection: Connection,
  wallet: any,
  governanceType: GovernanceType,
  realm: PublicKey,
  config: GovernanceConfig,
  transferUpgradeAuthority?: boolean,
): Promise<PublicKey> => {
  let instructions: TransactionInstruction[] = [];

  let governanceAddress;

  if (governanceType === GovernanceType.Account) {
    governanceAddress = (
      await withCreateAccountGovernance(
        instructions,
        realm,
        config,
        wallet.publicKey,
      )
    ).governanceAddress;
  } else if (governanceType === GovernanceType.Program) {
    governanceAddress = (
      await withCreateProgramGovernance(
        instructions,
        realm,
        config,
        transferUpgradeAuthority!,
        wallet.publicKey,
        wallet.publicKey,
      )
    ).governanceAddress;
  } else {
    throw new Error(`Governance type ${governanceType} is not supported yet.`);
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
