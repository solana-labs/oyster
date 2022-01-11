import { useConnectionConfig, useConnection, useWallet } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';

import { useProgramInfo } from '../contexts/GovernanceContext';
import { RpcContext } from '@solana/spl-governance';

export function useRpcContext() {
  const { endpoint } = useConnectionConfig();
  const connection = useConnection();
  const wallet = useWallet();
  const { programId, programVersion } = useProgramInfo();

  const [rpcContext, setRpcContext] = useState(
    new RpcContext(
      new PublicKey(programId),
      programVersion,
      wallet,
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
          wallet,
          connection,
          endpoint,
        ),
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, connection, wallet, endpoint, programVersion],
  );

  return rpcContext;
}
