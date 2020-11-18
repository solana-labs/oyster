import { useUserAccounts } from './useUserAccounts';

export const useAccountByMint = (mint: string) => {
  const { userAccounts } = useUserAccounts();
  const index = userAccounts.findIndex(
    (acc) => acc.info.mint.toBase58() === mint
  );

  if (index !== -1) {
    return userAccounts[index];
  }

  return;
};
