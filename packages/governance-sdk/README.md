# `governance-sdk`

SPL Governance Client API for spl-governance program

## Usage

```typescript
import { getRealms } from '@solana/spl-governance';

const governanceProgramId = new PublicKey('GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw');
const rpcEndpoint = "https://api.mainnet-beta.solana.com";

const realms = getRealms(rpcEndpoint, governanceProgramId);

