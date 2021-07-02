import { useConnectionConfig, useConnection, useWallet } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { RpcContext } from '../models/api';

export function useRpcContext() {
  const { endpoint } = useConnectionConfig();
  const connection = useConnection();
  const { wallet } = useWallet();
  const programId = new PublicKey(
    'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw',
  );
  const [rpcContext, setRpcContext] = useState(
    new RpcContext(
      programId,
      wallet?.publicKey || undefined,
      connection,
      endpoint,
    ),
  );

  useEffect(() => {
    setRpcContext(
      new RpcContext(
        programId,
        wallet?.publicKey || undefined,
        connection,
        endpoint,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId.toBase58(), connection, wallet, endpoint]);

  return rpcContext;
}
