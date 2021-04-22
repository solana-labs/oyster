import {
  contexts,
  getTokenName,
  NumericInput,
  ParsedAccount,
  TokenDisplay,
  TokenIcon,
} from '@oyster/common';
import { Card, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  useLendingReserves,
  useUserBalance,
  useUserDeposits,
} from '../../hooks';
import { LendingMarket, Reserve, ReserveParser } from '../../models';
import './style.less';

const { cache } = contexts.Accounts;
const { useConnectionConfig } = contexts.Connection;

const { Option } = Select;

// User can choose a collateral they want to use, and then this will display the balance they have in Oyster's lending
// reserve for that collateral type.
export default function CollateralInput(props: {
  title: string;
  amount?: number | null;
  reserve: Reserve;
  disabled?: boolean;
  onCollateralReserve?: (id: string) => void;
  onLeverage?: (leverage: number) => void;
  onInputChange: (value: number | null) => void;
  hideBalance?: boolean;
  useWalletBalance?: boolean;
  useFirstReserve?: boolean;
  showLeverageSelector?: boolean;
  leverage?: number;
}) {
  const { balance: tokenBalance } = useUserBalance(props.reserve.liquidity.mint);
  const { reserveAccounts } = useLendingReserves();
  const { tokenMap } = useConnectionConfig();
  const [depositReserve, setCollateralReserve] = useState<string>();
  const [balance, setBalance] = useState<number>(0);
  const [lastAmount, setLastAmount] = useState<string>('');
  const userDeposits = useUserDeposits();

  useEffect(() => {
    if (props.useWalletBalance) {
      setBalance(tokenBalance);
    } else {
      const id: string =
        cache
          .byParser(ReserveParser)
          .find(acc => acc === depositReserve) || '';
      const parser = cache.get(id) as ParsedAccount<Reserve>;

      if (parser) {
        const collateralDeposit = userDeposits.userDeposits.find(
          u =>
            u.reserve.info.liquidity.mint.toBase58() ===
            parser.info.liquidity.mint.toBase58(),
        );
        if (collateralDeposit) setBalance(collateralDeposit.info.amount);
        else setBalance(0);
      }
    }
  }, [depositReserve, userDeposits, tokenBalance, props.useWalletBalance]);

  const market = cache.get(
    props.reserve.lendingMarket,
  ) as ParsedAccount<LendingMarket>;
  if (!market) return null;

  const onlyQuoteAllowed = !props.reserve?.liquidity.mint?.equals(
    market?.info?.quoteTokenMint,
  );

  const filteredReserveAccounts = reserveAccounts
    .filter(reserve => reserve.info !== props.reserve)
    .filter(
      reserve =>
        !onlyQuoteAllowed ||
        reserve.info.liquidity.mint.equals(market.info.quoteTokenMint),
    );

  if (
    !depositReserve &&
    props.useFirstReserve &&
    filteredReserveAccounts.length
  ) {
    const address = filteredReserveAccounts[0].pubkey.toBase58();
    setCollateralReserve(address);
  }
  const renderReserveAccounts = filteredReserveAccounts.map(reserve => {
    const mint = reserve.info.liquidity.mint.toBase58();
    const address = reserve.pubkey.toBase58();
    const name = getTokenName(tokenMap, mint);
    return (
      <Option key={address} value={address} name={name} title={address}>
        <div key={address} style={{ display: 'flex', alignItems: 'center' }}>
          <TokenIcon mintAddress={mint} />
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
          {props.showLeverageSelector && (
            <Select
              size="large"
              showSearch
              style={{ width: 80 }}
              placeholder="CCY"
              value={props.leverage}
              onChange={(item: number) => {
                if (props.onLeverage) props.onLeverage(item);
              }}
              notFoundContent={null}
              onSearch={(item: string) => {
                if (props.onLeverage && item.match(/^\d+$/)) {
                  props.onLeverage(parseFloat(item));
                }
              }}
              filterOption={(input, option) =>
                option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {[1, 2, 3, 4, 5].map(val => (
                <Option
                  key={val}
                  value={val}
                  name={val + 'x'}
                  title={val + 'x'}
                >
                  <div
                    key={val}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {val + 'x'}
                  </div>
                </Option>
              ))}
            </Select>
          )}
          {!props.disabled ? (
            <Select
              size="large"
              showSearch
              style={{ minWidth: 150 }}
              placeholder="CCY"
              value={depositReserve}
              onChange={item => {
                if (props.onCollateralReserve) props.onCollateralReserve(item);
                setCollateralReserve(item);
              }}
              filterOption={(input, option) =>
                option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {renderReserveAccounts}
            </Select>
          ) : (
            <TokenDisplay
              key={props.reserve.liquidity.mint.toBase58()}
              name={getTokenName(
                tokenMap,
                props.reserve.liquidity.mint.toBase58(),
              )}
              mintAddress={props.reserve.liquidity.mint.toBase58()}
              showBalance={false}
            />
          )}
        </div>
      </div>
    </Card>
  );
}
