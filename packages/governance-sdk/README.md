# `spl-governance SDK`

SPL Governance Client API for spl-governance program

## Installation

`(npm|pnpm|yarn) add @solana/spl-governance @solana/web3.js`

## Usage

```typescript
import { getRealms } from '@solana/spl-governance';
import { Connection, PublicKey } from '@solana/web3.js';

const connection = new Connection("https://api.mainnet-beta.solana.com", 'recent');
const programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');

const realms = getRealms(connection, programId);

