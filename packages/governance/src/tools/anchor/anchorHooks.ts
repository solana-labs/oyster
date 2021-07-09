import { AccountInfo, PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { idlAddress as getIdlAddress } from './idlInstructions';

import { contexts } from '@oyster/common';

const { useConnection } = contexts.Connection;

export function useAnchorIdlAddress(programId: PublicKey) {
  const [idlAddress, setIdlAddress] = useState<PublicKey | undefined>();
  useEffect(() => {
    (async () => {
      setIdlAddress(await getIdlAddress(programId));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId.toBase58()]);

  return idlAddress;
}

export function useAnchorIdlAccount(programId: PublicKey) {
  const [idlAccount, setIdlAccount] = useState<
    AccountInfo<Buffer> | undefined
  >();

  const connection = useConnection();

  useEffect(() => {
    (async () => {
      const idlAddress = await getIdlAddress(programId);

      // TODO: we should also inspect the account to ensure it was not closed
      //       It's also possible the program can opt out of idl at some point so we should also call the actual program as well
      const accountInfo = await connection.getAccountInfo(idlAddress);

      if (accountInfo) {
        setIdlAccount(accountInfo);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId.toBase58(), connection]);

  return idlAccount;
}
