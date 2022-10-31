import React, { useEffect, useMemo, useState } from 'react';
import BN from 'bn.js';
import { Dropdown } from 'antd';
import { SPLToken, TokenAccount } from '../../models';
import { useMintFormatter, useUserAccounts } from '../../hooks';
import { WRAPPED_SOL_MINT } from '../../utils';
import './style.css';

const tokenListUrl = `https://raw.githubusercontent.com/neonlabsorg/token-list/v1.0.0/tokenlist.json`;

export interface AmountData {
  a: TokenAccount;
  t?: SPLToken;
}

export const AmountItem = ({ data }: { data: AmountData | null }) => {
  const { a, t } = data ?? {};
  const { formatValue } = useMintFormatter(a?.info.mint);

  const amount = useMemo(() => {
    return `${formatValue(new BN(a?.info.amount as BN || 0))} ${t?.symbol ?? 'NEON'}`;
  }, [data]);

  return <div className={'token-item'}>
    <span style={{ marginRight: 4 }}>{amount}</span>
  </div>;
};

export const TokenAmount = () => {
  const { userAccounts } = useUserAccounts();
  const [tokenList, setTokenList] = useState<SPLToken[]>([]);

  const accounts = useMemo(() => {
    return userAccounts.filter(u => u?.info.mint.toBase58() !== WRAPPED_SOL_MINT.toBase58());
  }, [userAccounts]);

  const tokens = useMemo<AmountData[]>(() => {
    return accounts.length > 0 ? accounts.map(a => {
      const t = tokenList.find(i => i.address_spl === a.info.mint.toBase58());
      return { a, t };
    }) : [];
  }, [tokenList, accounts]);

  const token = useMemo<AmountData | null>(() => {
    if (tokens.length > 0) {
      return tokens[0];
    }
    return null;
  }, [tokens]);

  const TokensList = () => {
    return tokens?.length > 1 ? <div className={'token-list'}>
      {tokens.map((a, k) => <AmountItem data={a} key={k} />)}
    </div> : <></>;
  };

  useEffect(() => {
    fetch(tokenListUrl).then(data => data.json()).then(data => setTokenList(data.tokens));
  }, []);

  return <>
    <div className={'tokens-wrapper'}>
      <Dropdown overlay={TokensList} placement={'bottomRight'}>
        <a className='token-dropdown' onClick={e => e.preventDefault()}>
          {<AmountItem data={token} />}
        </a>
      </Dropdown>
    </div>
  </>;
};
