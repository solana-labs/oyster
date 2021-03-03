import React, { useEffect, useState } from 'react';
import { contexts, utils, ParsedAccount, NumericInput, TokenIcon, TokenDisplay } from '@oyster/common';
import { Card, Select } from 'antd';
import './style.less';
import { TokenList, TokenInfo } from '@uniswap/token-lists';
const { getTokenName } = utils;
const { cache } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

const { Option } = Select;

export function EthereumInput(props: {
  title: string;
  amount?: number | null;
  disabled?: boolean;
  onInputChange: (value: number | null) => void;
  hideBalance?: boolean;
}) {
  const [balance, setBalance] = useState<number>(0);
  const [lastAmount, setLastAmount] = useState<string>('');
  const [tokens, setTokens] = useState<TokenInfo[]>([]);

  useEffect(() => {
    (async () => {
      const listResponse = await fetch('https://tokens.coingecko.com/uniswap/all.json');
      const tokenList: TokenList = await listResponse.json();

      setTokens(tokenList.tokens);
    })();
  }, [setTokens])


  const renderReserveAccounts = tokens.map((token) => {
    const mint = token.address;
    const name = token.symbol;
    return (
      <Option key={mint} value={mint} name={name} title={mint}>
        <div key={mint} style={{ display: 'flex', alignItems: 'center' }}>
          <img src={token.logoURI}/>
          {name}
        </div>
      </Option>
    );
  });

  return (
    <Card
      className="ccy-input"
      style={{ borderRadius: 20 }}
      bodyStyle={{ padding: 0 }}
    >
      <div className="ccy-input-header">
        <div className="ccy-input-header-left">{props.title}</div>

        {!props.hideBalance && (
          <div
            className="ccy-input-header-right"
            onClick={e => props.onInputChange && props.onInputChange(balance)}
          >
            Balance: {balance.toFixed(6)}
          </div>
        )}
      </div>
      <div className="ccy-input-header" style={{ padding: '0px 10px 5px 7px' }}>
        <NumericInput
          value={
            parseFloat(lastAmount || '0.00') === props.amount
              ? lastAmount
              : props.amount?.toFixed(6)?.toString()
          }
          onChange={(val: string) => {
            if (props.onInputChange && parseFloat(val) !== props.amount) {
              if (!val || !parseFloat(val)) props.onInputChange(null);
              else props.onInputChange(parseFloat(val));
            }
            setLastAmount(val);
          }}
          style={{
            fontSize: 20,
            boxShadow: 'none',
            borderColor: 'transparent',
            outline: 'transparent',
          }}
          placeholder="0.00"
        />
        <div className="ccy-input-header-right" style={{ display: 'flex' }}>
          {!props.disabled ? (
            <Select
              size="large"
              showSearch
              style={{ minWidth: 150 }}
              placeholder="CCY"
              // value={collateralReserve}
              // onChange={item => {
              //   if (props.onCollateralReserve) props.onCollateralReserve(item);
              //   setCollateralReserve(item);
              // }}
              filterOption={(input, option) =>
                option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {renderReserveAccounts}
            </Select>
          ) : (
            <TokenDisplay
              // key={props.reserve.liquidityMint.toBase58()}
              name={''}
              mintAddress={''}
              showBalance={false}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
