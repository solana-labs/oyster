import React, { useMemo, useState } from 'react';
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

  const renderTokensChain = useMemo(() => {
    return tokens
      .filter(
        t =>
          (t.tags?.indexOf('longList') || -1) < 0 &&
          search &&
          search.length >= 3 &&
          t.symbol.includes(search.toUpperCase()),
      )
      .map(token => {
        const mint = token.address;
        return (
          <div
            key={mint}
            className="multichain-option"
            title={token.name}
            onClick={() => {
              props.onSelectToken(mint);
              setSelected(mint);
              hideModal();
            }}
            style={{ cursor: 'pointer' }}
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
          </div>
        );
      });
  }, [search, tokens]);

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
          placeholder={'ETH, SOL, ... etc'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className={'assets-scroll'}>{[...renderTokensChain]}</div>
      </Modal>
    </>
  );
};
