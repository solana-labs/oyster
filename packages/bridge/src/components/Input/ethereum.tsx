import React, { useEffect, useState } from 'react';
import { contexts, utils, ParsedAccount, NumericInput, TokenIcon, TokenDisplay, programIds } from '@oyster/common';
import { Card, Select } from 'antd';
import './style.less';
import { useEthereum } from '../../contexts';
import { WrappedAssetFactory } from '../../contracts/WrappedAssetFactory';
import { WormholeFactory } from '../../contracts/WormholeFactory';
import { ASSET_CHAIN } from '../../utils/assets';
import { TransferRequestInfo } from '../../models/bridge';
import BN from 'bn.js';

const { Option } = Select;

export function EthereumInput(props: {
  title: string;
  disabled?: boolean;
  hideBalance?: boolean;

  asset?: string;
  setAsset: (asset: string) => void;

  setInfo: (info: TransferRequestInfo) => void;
  amount?: number | null;
  onInputChange: (value: number | null) => void;
}) {
  const [balance, setBalance] = useState<number>(0);
  const [lastAmount, setLastAmount] = useState<string>('');
  const { tokens, provider } = useEthereum();

  const renderReserveAccounts = tokens.filter(t => (t.tags?.indexOf('longList') || -1) < 0).map((token) => {
    const mint = token.address;
    const name = token.symbol;
    return (
      <Option key={mint} value={mint} name={name} title={mint}>
        <div key={mint} style={{ display: 'flex', alignItems: 'center' }}>
          <img style={{ width: 30, height: 30 }} src={token.logoURI}/>
          {name}
        </div>
      </Option>
    );
  });

  const updateBalance = async (fromAddress: string) => {
    props.setAsset(fromAddress);

    if(!provider) {
      return;
    }

    const bridgeAddress  = programIds().wormhole.bridge;

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
        assetAddress: Buffer.from(fromAddress.slice(2), "hex"),
        mint: "",
    }

    setBalance(new BN(info.balance.toString()).div(new BN(10).pow(new BN(info.decimals))).toNumber());

    let b = WormholeFactory.connect(bridgeAddress, provider);

    let isWrapped = await b.isWrappedAsset(fromAddress)
    if (isWrapped) {
        info.chainID = await e.assetChain()
        info.assetAddress = Buffer.from((await e.assetAddress()).slice(2), "hex")
        info.isWrapped = true
    }

    props.setInfo(info);
  };

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
            parseFloat(lastAmount || '0.00') ===  props.amount
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
