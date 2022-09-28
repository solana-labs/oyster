import { useConnectionConfig, useConnection, useWallet } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { RpcContext } from '@solana/spl-governance';
import { useEffect, useState } from 'react';

import { useProgramInfo } from '../contexts/GovernanceContext';

export function useRpcContext() {
  const { endpoint } = useConnectionConfig();
  const { programId, programVersion } = useProgramInfo();
  const connection = useConnection();
  const wallet = useWallet();
  const programKey = new PublicKey(programId);
  const defaultState = new RpcContext(
    programKey,
    programVersion,
    wallet,
    connection,
    endpoint,
  );
  const [rpcContext, setRpcContext] = useState<RpcContext>(defaultState);

  useEffect(
    () => {
      const state = new RpcContext(
        programKey,
        programVersion,
        wallet,
        connection,
        endpoint,
      );
      setRpcContext(state);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, connection, wallet, endpoint, programVersion],
  );

  return rpcContext;
}
