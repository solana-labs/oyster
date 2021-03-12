import { useEthereum } from '../contexts';
import { useEffect, useState } from 'react';
import { useConnectionConfig } from '@oyster/common';

export const useCorrectNetwork = () => {
  const { env } = useConnectionConfig();
  const [hasCorrespondingNetworks, setHasCorrespondingNetworks] = useState(
    true,
  );
  const { provider } = useEthereum();

  useEffect(() => {
    if (provider) {
      provider.getNetwork().then(network => {
        if (network.chainId === 5) {
          setHasCorrespondingNetworks(env === 'testnet');
        } else if (network.chainId === 1) {
          setHasCorrespondingNetworks(env === 'mainnet-beta');
        } else {
          setHasCorrespondingNetworks(false);
        }
      });
    }
    setHasCorrespondingNetworks(true);
  }, [provider, env]);

  return hasCorrespondingNetworks;
};
