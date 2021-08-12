import { useConnectionConfig, useConnection } from '@oyster/common';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { RpcContext } from '../models/api';

export function useRpcContext() {
  const { endpoint } = useConnectionConfig();
  const connection = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const location = useLocation();

  const programId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return new PublicKey(
      params.get('programId') ?? 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw',
    );
  }, [location]);

  return useMemo(
    () =>
      new RpcContext(
        programId,
        { publicKey, signTransaction, signAllTransactions },
        connection,
        endpoint,
      ),
    [
      programId,
      publicKey,
      signTransaction,
      signAllTransactions,
      connection,
      endpoint,
    ],
  );
}
