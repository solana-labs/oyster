import { TokenAccount } from '../models';
import { useAccountsContext } from 'common/src/contexts/accounts';

export function useUserAccounts() {
  const context = useAccountsContext();
  return {
    userAccounts: context.userAccounts as TokenAccount[],
  };
}
