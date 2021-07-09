import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { idlAddress as getIdlAddress } from './idlInstructions';

export function useProgramIdlAddress(programId: PublicKey) {
  const [idlAddress, setIdlAddress] = useState<PublicKey | undefined>();
  useEffect(() => {
    (async () => {
      setIdlAddress(await getIdlAddress(programId));
    })();
  }, [programId.toBase58()]);

  return idlAddress;
}
