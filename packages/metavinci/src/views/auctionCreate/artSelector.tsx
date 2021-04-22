import React, { useEffect, useMemo, useState } from 'react';
import {
  Row,
  Button,
  Modal,
  ButtonProps,
} from 'antd';
import { ArtCard } from './../../components/ArtCard';
import './../styles.less';
import {
  Metadata,
  ParsedAccount,
} from '@oyster/common';
import { useUserArts } from '../../hooks';
import Masonry from 'react-masonry-css';

export interface ArtSelectorProps extends ButtonProps {
  selected: ParsedAccount<Metadata>[];
  setSelected: (selected: ParsedAccount<Metadata>[]) => void;
  allowMultiple: boolean;
}

export const ArtSelector = (props: ArtSelectorProps) => {
  const { selected, setSelected, allowMultiple, ...rest } = props;
  const items = useUserArts();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(props.selected.map(item => item.pubkey.toBase58())));

  const map = useMemo(() => items.reduce((acc, item) => {
    acc.set(item.pubkey.toBase58(), item.info);
    return acc;
  }, new Map<string, Metadata>()), [items]);

  const [visible, setVisible] = useState(false);

  const open = () => {
    clear();

    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const clear = () => {
    setSelectedItems(new Set());
  };

  const confirm = () => {
    let list = items.filter(item => selectedItems.has(item.pubkey.toBase58()))
    setSelected(list);
    close();
  }

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {[...selectedItems.keys()].map(m => {
          const item = map.get(m);
          if (!item) {
            return;
          }

          return <ArtCard key={m}
                image={item.extended?.image}
                category={item.extended?.category}
                name={item?.name}
                symbol={item.symbol}
                preview={false}
                onClick={open}
                close={() => {
                  setSelectedItems(new Set([...selectedItems.keys()].filter(_ => _ !== m)));
                  confirm();
                }}
                />;
        })}
        {(allowMultiple || selectedItems.size === 0) && <div className="ant-card ant-card-bordered ant-card-hoverable art-card" style={{ width: 200, height: 300, display: 'flex' }} onClick={open} >
           <span className="text-center">Add an NFT</span>
         </div>}
      </Masonry>


      <Modal visible={visible} onCancel={close} onOk={confirm} width="100" footer={null}>
        <Row className="call-to-action" style={{ marginBottom: 0 }}>
          <h2>Select the NFT you want to sell</h2>
          <p style={{ fontSize: '1.2rem' }}>
            Select the NFT that you want to sell copy/copies of.
          </p>
        </Row>
        <Row className="content-action">
          <Masonry
              breakpointCols={breakpointColumnsObj}
              className="my-masonry-grid"
              columnClassName="my-masonry-grid_column"
            >
              {items.map(m => {
                const id = m.pubkey.toBase58();
                const isSelected = selectedItems.has(id);

                const onSelect = () => {
                  let list = [...selectedItems.keys()];
                  if (allowMultiple) {
                    list = [];
                  }

                  isSelected ?
                    setSelectedItems(new Set(list.filter(item => item !== id))) :
                    setSelectedItems(new Set([...list, id]));

                  if(!allowMultiple) {
                    confirm();
                  }
                };

                return <ArtCard key={id}
                      image={m.info.extended?.image}
                      category={m.info.extended?.category}
                      name={m.info?.name}
                      symbol={m.info.symbol}
                      preview={false}
                      onClick={onSelect}
                      className={isSelected ? 'selected-card' : 'not-selected-card'}
                      />;
              })}
            </Masonry>
        </Row>
        <Row>
          <Button
            type="primary"
            size="large"
            onClick={confirm}
            className="action-btn"
          >
            Confirm
          </Button>
        </Row>
      </Modal>
    </>
  );
};
