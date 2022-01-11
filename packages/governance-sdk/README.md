# `spl-governance SDK`

SPL Governance Client API for spl-governance program

## Installation

`(npm|pnpm|yarn) add @solana/spl-governance`

## Usage

```typescript
import { getRealms } from '@solana/spl-governance';

const programId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');
const rpcEndpoint = "https://api.mainnet-beta.solana.com";

const realms = getRealms(rpcEndpoint, programId);

