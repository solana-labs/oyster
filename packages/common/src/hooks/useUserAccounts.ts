import { TokenAccount } from '../models';
import { useAccountsContext } from '../contexts';

export function useUserAccounts() {
  const context = useAccountsContext();
  return {
    userAccounts: context.userAccounts as TokenAccount[],
  };
}
