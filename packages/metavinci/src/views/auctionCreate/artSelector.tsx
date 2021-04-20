import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    props.setSelected(items.filter(item => selectedItems.has(item.pubkey.toBase58())));
  }, [selectedItems]);

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <>
      <Button {...rest} />
      <Modal>
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
                  if (props.allowMultiple) {
                    list = [];
                  }

                  isSelected ?
                    setSelectedItems(new Set(list.filter(item => item !== id))) :
                    setSelectedItems(new Set([...list, id]));
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
            onClick={() => {
              // TODO;
            }}
            className="action-btn"
          >
            Confirm
          </Button>
        </Row>
      </Modal>
    </>
  );
};
