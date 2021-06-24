import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { utils, sendTransaction } from '@oyster/common';
import { withCreateAccountGovernance } from '../models/withCreateAccountGovernance';
import { GovernanceType } from '../models/enums';
import { GovernanceConfig } from '../models/accounts';
import { withCreateProgramGovernance } from '../models/withCreateProgramGovernance';

const { notify } = utils;

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

  notify({
    message: 'Registering governance...',
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    let tx = await sendTransaction(connection, wallet, instructions, []);

    notify({
      message: 'Governance has been registered.',
      type: 'success',
      description: `Transaction - ${tx}`,
    });

    return governanceAddress;
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
};
