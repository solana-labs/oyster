import { useConnectionConfig, useConnection, useWallet } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { IWallet, RpcContext } from '../models/api';
import { getProgramVersion } from '../models/registry/api';

export function useRpcContext() {
  const { endpoint, env } = useConnectionConfig();
  const connection = useConnection();
  const { wallet } = useWallet();
  const location = useLocation();

  const programId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return (
      params.get('programId') ?? 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw'
    );
  }, [location]);

  const programVersion = useMemo(() => getProgramVersion(programId, env), [
    programId,
    env,
  ]);

  const [rpcContext, setRpcContext] = useState(
    new RpcContext(
      new PublicKey(programId),
      programVersion,
      wallet as IWallet,
      connection,
      endpoint,
    ),
  );

  useEffect(
    () => {
      setRpcContext(
        new RpcContext(
          new PublicKey(programId),
          programVersion,
          wallet as IWallet,
          connection,
          endpoint,
        ),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, connection, wallet, endpoint],
  );

  return rpcContext;
}
