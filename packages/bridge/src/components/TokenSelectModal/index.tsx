import React, { useMemo, useState } from 'react';
import List from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import _ from 'lodash';
import './style.less';
import { Modal, Input } from 'antd';
import { useEthereum } from '../../contexts';
import { TokenDisplay } from '../TokenDisplay';
import { ASSET_CHAIN } from '../../models/bridge/constants';

export const TokenSelectModal = (props: {
  onSelectToken: (token: string) => void;
  asset?: string;
  chain?: ASSET_CHAIN;
}) => {
  const { tokens } = useEthereum();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [selected, setSelected] = useState<string>('');
  const [search, setSearch] = useState<string>('');

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
    setIsModalVisible(true);
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };
  const firstToken = useMemo(() => {
    if (!selected) {
      return tokens.find(el => el.address === props.asset);
    }
    return tokens.find(el => el.address === selected);
  }, [selected, tokens, props.asset]);

  const delayedSearchChange = _.debounce(val => {
    setSearch(val);
  });

  const rowRender = (rowProps: { index: number; key: string; style: any }) => {
    const token = tokenList[rowProps.index];
    const mint = token.address;
    return (
      <div
        key={rowProps.key}
        className="multichain-option"
        title={token.name}
        onClick={() => {
          props.onSelectToken(mint);
          setSelected(mint);
          hideModal();
        }}
        style={{ ...rowProps.style, cursor: 'pointer' }}
      >
        <div className="multichain-option-content">
          <TokenDisplay asset={props.asset} token={token} chain={props.chain} />
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
              chain={props.chain}
            />
          </div>
        </div>
      ) : null}
      <Modal
        visible={isModalVisible}
        onCancel={() => hideModal()}
        footer={null}
      >
        <Input
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
                rowHeight={70}
                rowCount={tokenList.length || 0}
                rowRenderer={rowRender}
                width={width}
              />
            )}
          </AutoSizer>
        </div>
        {/*<div className={'assets-scroll'}>{[...renderTokensChain]}</div>*/}
      </Modal>
    </>
  );
};
