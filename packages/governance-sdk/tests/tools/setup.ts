import { PublicKey } from '@solana/web3.js';

export const programId = new PublicKey(
  'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw',
);

export const rpcProgramId = programId;
export const rpcEndpoint = 'http://127.0.0.1:8899';

// Run local validator given the path to spl_governance.so
// solana-test-validator --bpf-program GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw  target/deploy/spl_governance.so --reset --clone ENmcpFCpxN1CqyUjuog9yyUVfdXBKF3LVCwLr7grJZpk  -u devnet
