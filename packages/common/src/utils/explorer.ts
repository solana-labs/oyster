import { Connection, PublicKey } from '@solana/web3.js';
import { ENDPOINTS } from '../contexts';
import { ENV as ChainId } from '@solana/spl-token-registry';

export function getExplorerUrl(
  address: string | PublicKey,
  endpoint: string,
  type: string = 'address',
  connection?: Connection,
) {
  const getClusterUrlParam = () => {
    // If ExplorerLink (or any other component)is used outside of ConnectionContext, ex. in notifications, then useConnectionConfig() won't return the current endpoint
    // It would instead return the default ENDPOINT  which is not that useful to us
    // If connection is provided then we can use it instead of the hook to resolve the endpoint
    if (connection) {
      // Endpoint is stored as internal _rpcEndpoint prop
      endpoint = (connection as any)._rpcEndpoint ?? endpoint;
    }

    const env = ENDPOINTS.find(end => end.endpoint === endpoint);

    let cluster;

    if (env?.ChainId == ChainId.Testnet) {
      cluster = 'testnet';
    } else if (env?.ChainId == ChainId.Devnet) {
      if (env?.name === 'localnet') {
        cluster = `custom&customUrl=${encodeURIComponent(
          'http://127.0.0.1:8899',
        )}`;
      } else {
        cluster = 'devnet';
      }
    }

    return cluster ? `?cluster=${cluster}` : '';
  };

  return `https://explorer.solana.com/${type}/${address}${getClusterUrlParam()}`;
}
