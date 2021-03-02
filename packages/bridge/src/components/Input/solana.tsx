import React, { useEffect, useState } from 'react';
import {
  contexts,
  utils,
  ParsedAccount,
  NumericInput,
  TokenDisplay,
  useUserAccounts,
  useMint
} from '@oyster/common';
import { Card, Select } from 'antd';
import './style.less';
const { getTokenName } = utils;
const { cache } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

const { Option } = Select;

// TODO: add way to add new token account



export function SolanaInput(props: {
  title: string;
  amount?: number | null;
  disabled?: boolean;
  onInputChange: (value: number | null) => void;
  hideBalance?: boolean;
  useFirstToken?: boolean;
  onMintChange?: (value: string) => void;
}) {
  const { tokens, tokenMap } = useConnectionConfig();
  const { userAccounts } = useUserAccounts();
  const [balance, setBalance] = useState<number>(0);
  const [lastAmount, setLastAmount] = useState<string>('');
  const [currentMint, setCurrentMint] = useState<string>('')

  const mint = useMint(currentMint);

  const renderPopularTokens = tokens.map((item) => {
    const address = item.mintAddress;
    return (
      <Option key={address} value={address} name={item.tokenSymbol} title={address}>
        <TokenDisplay
          key={address}
          name={item.tokenSymbol}
          mintAddress={address}
          showBalance={true}
        />
      </Option>
    );
  });

  useEffect(() => {
    if(!currentMint && tokens.length > 0) {
      setCurrentMint(tokens[0].mintAddress)
    }
  }, [tokens, currentMint])

  useEffect(() => {

    const currentAccount = userAccounts?.find(
      (a) => a.info.mint.toBase58() === currentMint
    );
    if (currentAccount && mint) {
      setBalance(
        currentAccount.info.amount.toNumber() / Math.pow(10, mint.decimals)
      );
    } else {
      setBalance(0);
    }
  }, [currentMint, mint, userAccounts])

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
              value={currentMint}
              onChange={item => {
                if (props.onMintChange) props.onMintChange(item);
                setCurrentMint(item);
              }}
              filterOption={(input, option) =>
                option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {renderPopularTokens}
            </Select>
          ) : (
            <TokenDisplay
              // key={props.reserve.liquidityMint.toBase58()}
              name={getTokenName(
                tokenMap,
                '',
              )}
              mintAddress={''}
              showBalance={false}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
