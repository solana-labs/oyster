

import { Connection, PublicKey } from '@solana/web3.js';
import { getTokenOwnerRecordsByOwner } from '../../src'

const programId = new PublicKey("GTesTBiEWE32WHXXE2S4XbZvA5CrEc4xs6ZgRe895dP")
const rpcEndpoint = "https://psytrbhymqlkfrhudd.dev.genesysgo.net:8899"
const connection = new Connection(rpcEndpoint, 'recent')

test('getTokenOwnerRecordsByOwner', async () => {
  // Arrange
  const tokenOwnerPk = new PublicKey("EZLvwGdGyeks3jQLWeBbjL1uGeGbqb2MYU4157pDP9ch")

  // Act
  const results = Object.values(await getTokenOwnerRecordsByOwner(connection, programId, tokenOwnerPk))

  // Assert
  expect(results.length).toBeGreaterThan(0)

  for (let tor of results) {
    expect(tor.account.governingTokenOwner.toBase58()).toBe(tokenOwnerPk.toBase58())
  }
});