import { EventEmitter, useConnection } from '@oyster/common';
import React, { useContext, useEffect, useState } from 'react';
import { MarketsContextState } from './market';

export interface VinciAccountsContextState {

}

const VinciAccountsContext = React.createContext<VinciAccountsContextState | null>(
  null,
);
export function VinciAccountsProvider({ children = null as any }) {
  const connection = useConnection();

  // TODO: query for metadata accounts and associated jsons


  return (
    <VinciAccountsContext.Provider value={{ }}>
      {children}
    </VinciAccountsContext.Provider>
  );
}

export const useCoingecko = () => {
  const context = useContext(VinciAccountsContext);
  return context as VinciAccountsContextState;
};
