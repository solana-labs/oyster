import React, { useMemo, useRef, useState } from 'react';
import List from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import _ from 'lodash';
import './style.less';
import { Input, Modal } from 'antd';
import { useEthereum } from '../../contexts';
import { TokenDisplay } from '../TokenDisplay';
import { ASSET_CHAIN } from '../../models/bridge/constants';
import { useConnectionConfig } from '@oyster/common';
import { filterModalEthTokens, filterModalSolTokens } from '../../utils/assets';

export const TokenSelectModal = (props: {
  onSelectToken: (token: string) => void;
  onChain: (chain: ASSET_CHAIN) => void;
  asset?: string;
  chain?: ASSET_CHAIN;
  showIconChain?: boolean;
}) => {
  const { tokens: ethTokens } = useEthereum();
  const { tokens: solTokens } = useConnectionConfig();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const inputRef = useRef<Input>(null);
  const tokens = useMemo(
    () => [
      ...filterModalEthTokens(ethTokens),
      ...filterModalSolTokens(solTokens),
    ],
    [ethTokens, solTokens],
  );

  const tokenList = useMemo(() => {
    if (tokens && search) {
      return tokens.filter(token => {
        return (
          (token.tags?.indexOf('longList') || -1) < 0 &&
          token.symbol.includes(search.toUpperCase())
        );
      });
    }
    return tokens;
  }, [tokens, search]);

  const showModal = () => {
    if (inputRef && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };
  const firstToken = useMemo(() => {
    return tokens.find(el => el.address === props.asset);
  }, [tokens, props.asset]);

  const delayedSearchChange = _.debounce(val => {
    setSearch(val);
  });

  const rowRender = (rowProps: { index: number; key: string; style: any }) => {
    const token = tokenList[rowProps.index];
    const mint = token.address;
    return [ASSET_CHAIN.Solana, ASSET_CHAIN.Ethereum].map((chain, index) => {
      return (
        <div
          key={rowProps.key + mint + chain}
          className="multichain-option"
          title={token.name}
          onClick={() => {
            props.onSelectToken(mint);
            props.onChain(chain);
            hideModal();
          }}
          style={{
            ...rowProps.style,
            cursor: 'pointer',
            height: '70px',
            top: `${rowProps.style.top + 70 * index}px`,
          }}
        >
          <div
            className="multichain-option-content"
            style={{ position: 'relative' }}
          >
            <TokenDisplay asset={props.asset} token={token} chain={chain} />
            <div
              className="multichain-option-name"
              style={{ marginLeft: '20px' }}
            >
              <em className={'token-symbol'}>{token.symbol}</em>
              <span className={'token-name'}>{token.name}</span>
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <>
      {firstToken ? (
        <div
          key={firstToken.address}
          className="multichain-option"
          title={firstToken.name}
          onClick={() => showModal()}
          style={{ cursor: 'pointer' }}
        >
          <div className="multichain-option-content">
            <TokenDisplay
              asset={props.asset}
              token={firstToken}
              chain={props.showIconChain ? props.chain : undefined}
            />
          </div>
          <div className={'multichain-option-symbol'}>{firstToken.symbol}</div>
          <span className={'down-arrow'}></span>
        </div>
      ) : null}
      <Modal
        visible={isModalVisible}
        onCancel={() => hideModal()}
        footer={null}
        className={'token-select-modal'}
      >
        <Input
          autoFocus
          ref={inputRef}
          className={'input-token-search'}
          placeholder={'SOL, SRM, ... etc'}
          value={search}
          onChange={e => {
            e.persist();
            delayedSearchChange(e.target.value);
          }}
        />
        <div style={{ height: '90%' }}>
          <AutoSizer>
            {({ width, height }) => (
              <List
                ref="List"
                height={height}
                rowHeight={140}
                rowCount={tokenList.length || 0}
                rowRenderer={rowRender}
                width={width}
              />
            )}
          </AutoSizer>
        </div>
      </Modal>
    </>
  );
};
