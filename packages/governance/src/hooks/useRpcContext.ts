import {
  useConnectionConfig,
  useConnection,
  WalletSigner,
  useWallet,
} from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { RpcContext } from '../models/api';

export function useRpcContext() {
  const { endpoint } = useConnectionConfig();
  const connection = useConnection();
  const wallet = useWallet();
  const location = useLocation();

  const programId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return new PublicKey(
      params.get('programId') ?? 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw',
    );
  }, [location]);

  return useMemo(
    () => new RpcContext(programId, wallet, connection, endpoint),
    [programId, wallet, connection, endpoint],
  );
}
