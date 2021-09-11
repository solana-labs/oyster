import React, { useMemo, useRef, useState } from 'react';
import List from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
import _ from 'lodash';
import './style.less';
import { Input, Modal } from 'antd';
import { useEthereum } from '../../contexts';
import { TokenDisplay } from '../TokenDisplay';
import { ASSET_CHAIN } from '../../utils/assets';
import {
  useConnectionConfig,
  useUserAccounts,
  useWallet
} from '@oyster/common';
import { TokenInfo } from '@solana/spl-token-registry';

export const TokenSelectModal = (props: {
  onSelectToken: (token: string) => void;
  onChain: (chain: ASSET_CHAIN) => void;
  asset?: string;
  chain?: ASSET_CHAIN;
  showIconChain?: boolean;
}) => {
  const { tokenMap: ethTokenMap } = useEthereum();
  const { connected } = useWallet();
  const { tokenMap } = useConnectionConfig()
  const {userAccounts} = useUserAccounts()
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');

  const inputRef = useRef<Input>(null);
  // const tokens = useMemo(
  //   () => {
  //     const ethAddresses = ethTokens.reduce((set, t) => {
  //       if(t.address) {
  //         set.add(t.address.toLowerCase());
  //       }
  //       return set;
  //     }, new Set<string>());
  //     return [
  //       ...filterModalEthTokens(ethTokens),
  //       ...filterModalSolTokens(solTokens).filter(t => !ethAddresses.has((t?.extensions?.address || '').toLowerCase())),
  //     ];
  //   },
  //   [ethTokens, solTokens],
  // );

  const tokenList = useMemo(() => {
    const tokens: any [] = [];
    if (connected && userAccounts.length) {
      userAccounts.forEach(async acc => {
        const token = tokenMap.get(acc.info.mint.toBase58())
        if (token) {
          if (!token.name.toLowerCase().includes("wormhole")){
            tokens.push({token, chain: ASSET_CHAIN.Ethereum})
          } else {
            if (token.extensions?.address) {
              const ethToken = ethTokenMap.get(token.extensions.address.toLowerCase())
              if (ethToken){
                tokens.push({token: ethToken, chain: ASSET_CHAIN.Solana})
              } else {
                console.log("Wormhole token without contract info: ", token)
              }
            }
          }
        }
      })
      // if (search) {
      //   return tokens.filter(token => {
      //     return (
      //       (token.tags?.indexOf('longList') || -1) < 0 &&
      //       (token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      //         token.name.toLowerCase().includes(search.toLowerCase()))
      //     );
      //   });
      // }
    }
    return tokens;
  }, [connected, userAccounts.length]);

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
    return tokenList.find((el: any) => el.token.address === props.asset);
  }, [tokenList, props.asset]);

  const delayedSearchChange = _.debounce(val => {
    setSearch(val);
  });

  const getTokenInfo = (token: TokenInfo | undefined, chain: ASSET_CHAIN | undefined) => {
    let name = token?.name || '';
    let symbol = token?.symbol || '';
    // if (token && chain !== ASSET_CHAIN.Solana) {
    //   if((token.tags || []).indexOf('wormhole') >= 0) {
    //     name = name.replace('(Wormhole)', '').trim();
    //     symbol = symbol.startsWith('w') ? symbol.slice(1, symbol.length) : symbol;
    //   }
    // }
    return { name, symbol };
  }

  const rowRender = (rowProps: { index: number; key: string; style: any }) => {
    const tokenObject = tokenList[rowProps.index]
    const token = tokenObject.token;
    const mint = token.address;
    const chain = tokenObject.chain
    const { name , symbol } = getTokenInfo(token, chain);
    return (
      <div
        key={rowProps.key + mint + chain}
        className="multichain-option"
        title={name}
        onClick={() => {
          props.onSelectToken(mint);
          props.onChain(chain);
          hideModal();
        }}
        style={{
          ...rowProps.style,
          cursor: 'pointer',
          height: '70px',
          top: `${rowProps.style.top}px`,
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
            <em className={'token-symbol'}>{symbol}</em>
            <span className={'token-name'}>{name}</span>
          </div>
        </div>
      </div>
    );
  };

  const { name , symbol } = getTokenInfo(firstToken?.token, props.chain);
  return (
    <>
      <div
        className="multichain-option"
        title={name}
        onClick={() => showModal()}
        style={{ cursor: 'pointer' }}
      >
        <div className="multichain-option-content">
          <TokenDisplay
            asset={props.asset}
            token={firstToken?.token}
            chain={props.showIconChain ? props.chain : undefined}
          />
        </div>
        <div className={'multichain-option-symbol'}>{symbol}</div>
        <span className={'down-arrow'}></span>
      </div>
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
                rowHeight={70}
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
