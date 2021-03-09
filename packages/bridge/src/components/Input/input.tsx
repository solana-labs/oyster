import React, { useState } from 'react';
import { NumericInput, programIds } from '@oyster/common';
import { Card, Select } from 'antd';
import './style.less';
import { useEthereum } from '../../contexts';
import { WrappedAssetFactory } from '../../contracts/WrappedAssetFactory';
import { WormholeFactory } from '../../contracts/WormholeFactory';
import { TransferRequestInfo } from '../../models/bridge';
import { TokenDisplay } from '../TokenDisplay';
import BN from 'bn.js';
import { ASSET_CHAIN } from '../../models/bridge/constants';

const { Option } = Select;

export function EthereumInput(props: {
  title: string;
  hideBalance?: boolean;

  asset?: string;
  chain?: ASSET_CHAIN;
  setAsset: (asset: string) => void;

  setInfo: (info: TransferRequestInfo) => void;
  amount?: number | null;
  onInputChange: (value: number | null) => void;
}) {
  const [balance, setBalance] = useState<number>(0);
  const [lastAmount, setLastAmount] = useState<string>('');
  const { tokens, provider } = useEthereum();

  const renderReserveAccounts = tokens
    .filter(t => (t.tags?.indexOf('longList') || -1) < 0)
    .map(token => {
      const mint = token.address;
      return (
        <Option
          key={mint}
          className="multichain-option"
          value={mint}
          name={token.symbol}
          title={token.name}
        >
          <div className="multichain-option-content">
            <TokenDisplay
              asset={props.asset}
              token={token}
              chain={props.chain}
            />
            <div className="multichain-option-name">
              <span className={'token-name'}>{token.symbol}</span>
            </div>
          </div>
        </Option>
      );
    });

  const updateBalance = async (fromAddress: string) => {
    props.setAsset(fromAddress);

    if (!provider) {
      return;
    }

    const bridgeAddress = programIds().wormhole.bridge;

    let signer = provider.getSigner();
    let e = WrappedAssetFactory.connect(fromAddress, provider);
    let addr = await signer.getAddress();
    let balance = await e.balanceOf(addr);
    let decimals = await e.decimals();
    let symbol = await e.symbol();

    let allowance = await e.allowance(addr, bridgeAddress);

    let info = {
      address: fromAddress,
      name: symbol,
      balance: balance,
      allowance: allowance,
      decimals: decimals,
      isWrapped: false,
      chainID: ASSET_CHAIN.Ethereum,
      assetAddress: Buffer.from(fromAddress.slice(2), 'hex'),
      mint: '',
    };

    setBalance(
      new BN(info.balance.toString())
        .div(new BN(10).pow(new BN(info.decimals)))
        .toNumber(),
    );

    let b = WormholeFactory.connect(bridgeAddress, provider);

    let isWrapped = await b.isWrappedAsset(fromAddress);
    if (isWrapped) {
      info.chainID = await e.assetChain();
      info.assetAddress = Buffer.from((await e.assetAddress()).slice(2), 'hex');
      info.isWrapped = true;
    }

    props.setInfo(info);
  };

  return (
    <Card
      className="ccy-input from-input"
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
      <div
        className="ccy-input-header"
        style={{ padding: '0px 10px 5px 7px', height: 80 }}
      >
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
            fontSize: 24,
            boxShadow: 'none',
            borderColor: 'transparent',
            outline: 'transparent',
          }}
          placeholder="0.00"
        />
        <div className="ccy-input-header-right" style={{ display: 'flex' }}>
          <Select
            size="large"
            showSearch
            style={{ minWidth: 150 }}
            placeholder="CCY"
            value={props.asset}
            onChange={(item: string) => {
              updateBalance(item);
            }}
            filterOption={(input, option) =>
              option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {renderReserveAccounts}
          </Select>
        </div>
      </div>
    </Card>
  );
}
