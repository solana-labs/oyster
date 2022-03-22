import { clusterApiUrl, Connection, Keypair, PublicKey } from '@solana/web3.js';
import {
  getMaxVoterWeightRecord,
  getMaxVoterWeightRecordAddress,
  getVoterWeightRecord,
  getVoterWeightRecordAddress,
} from '../../src';
import { requestAirdrop } from '../tools/sdk';

const rpcEndpoint = clusterApiUrl('devnet');
const connection = new Connection(rpcEndpoint, 'recent');

test('getMaxVoterWeightRecord', async () => {
  // Arrange
  const wallet = Keypair.generate();
  const walletPk = wallet.publicKey;

  await requestAirdrop(connection, walletPk);

  const realmPk = new PublicKey('Bt9gu17V9DLQNYa6gnbtrbFSEiX4kqbeHAbNCH2dcKr');
  const governingTokenMintPk = new PublicKey(
    '2zBFETjTFMSjeS8Rfv43qYyCTLtGSRXRk1hWwJ1u7WgH',
  );

  const addinProgramId = new PublicKey(
    'FDfF7jzJDCEkFWNi3is487k8rFPJxFkU821t2pQ1vDr1',
  );

  const maxVoterWeightRecordPk = await getMaxVoterWeightRecordAddress(
    addinProgramId,
    realmPk,
    governingTokenMintPk,
  );

  // Act
  const maxVoterWeightRecord = await getMaxVoterWeightRecord(
    connection,
    maxVoterWeightRecordPk,
  );

  // Assert
  expect(maxVoterWeightRecord.account.realm).toEqual(realmPk);

  expect(maxVoterWeightRecord.account.governingTokenMint).toEqual(
    governingTokenMintPk,
  );
});

test('getVoterWeightRecord', async () => {
  // Arrange
  const wallet = Keypair.generate();
  const walletPk = wallet.publicKey;

  await requestAirdrop(connection, walletPk);

  const realmPk = new PublicKey('Bt9gu17V9DLQNYa6gnbtrbFSEiX4kqbeHAbNCH2dcKr');
  const governingTokenMintPk = new PublicKey(
    '2zBFETjTFMSjeS8Rfv43qYyCTLtGSRXRk1hWwJ1u7WgH',
  );

  const governingTokenOwnerPk = new PublicKey(
    '56CRgykvwrWcCyKY1L5UCc3NgCKz57ZE7AMJcP5tccCu',
  );

  const addinProgramId = new PublicKey(
    'FDfF7jzJDCEkFWNi3is487k8rFPJxFkU821t2pQ1vDr1',
  );

  const voterWeightRecordPk = await getVoterWeightRecordAddress(
    addinProgramId,
    realmPk,
    governingTokenMintPk,
    governingTokenOwnerPk,
  );

  // Act
  const voterWeightRecord = await getVoterWeightRecord(
    connection,
    voterWeightRecordPk,
  );

  // Assert
  expect(voterWeightRecord.account.realm).toEqual(realmPk);

  expect(voterWeightRecord.account.governingTokenMint).toEqual(
    governingTokenMintPk,
  );

  expect(voterWeightRecord.account.governingTokenOwner).toEqual(
    governingTokenOwnerPk,
  );
});
