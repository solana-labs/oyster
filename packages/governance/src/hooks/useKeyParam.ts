import { PublicKey } from '@solana/web3.js';
import { useParams } from 'react-router-dom';

export const useKeyParam = () => {
  const { key } = useParams<{ key: string }>();
  return new PublicKey(key);
};
