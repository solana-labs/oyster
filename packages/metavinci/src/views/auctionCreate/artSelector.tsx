import React, { useEffect, useMemo, useState } from 'react';
import { Row, Button, Modal, ButtonProps } from 'antd';
import { ArtCard } from './../../components/ArtCard';
import './../styles.less';
import { Metadata, ParsedAccount } from '@oyster/common';
import { useUserArts } from '../../hooks';
import Masonry from 'react-masonry-css';
import { SafetyDepositDraft } from '../../actions/createAuctionManager';

export interface ArtSelectorProps extends ButtonProps {
  selected: SafetyDepositDraft[];
  setSelected: (selected: SafetyDepositDraft[]) => void;
  allowMultiple: boolean;
}

export const ArtSelector = (props: ArtSelectorProps) => {
  const { selected, setSelected, allowMultiple, ...rest } = props;
  const items = useUserArts();
  const selectedItems = useMemo<Set<string>>(() =>
    new Set(selected.map(item => item.metadata.pubkey.toBase58()))
  , [selected]);

  const [visible, setVisible] = useState(false);

  const open = () => {
    clear();

    setVisible(true);
  };

  const close = () => {
    setVisible(false);
  };

  const clear = () => {
    setSelected([]);
  };

  const confirm = () => {
      close();
  };

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="my-masonry-grid"
        columnClassName="my-masonry-grid_column"
      >
        {selected.map(m => {
          let key = m?.metadata.pubkey.toBase58() || '';
          let item = m?.metadata?.info;
          if (!item) {
            return;
          }

          return (
            <ArtCard
              key={key}
              image={item.extended?.image}
              category={item.extended?.category}
              name={item?.name}
              symbol={item.symbol}
              preview={false}
              onClick={open}
              close={() => {
                setSelected(
                  selected.filter(_ => _.metadata.pubkey.toBase58() !== key)
                );
                confirm();
              }}
            />
          );
        })}
        {(allowMultiple || selectedItems.size === 0) && (
          <div
            className="ant-card ant-card-bordered ant-card-hoverable art-card"
            style={{ width: 200, height: 300, display: 'flex' }}
            onClick={open}
          >
            <span className="text-center">Add an NFT</span>
          </div>
        )}
      </Masonry>

      <Modal
        visible={visible}
        onCancel={close}
        onOk={confirm}
        width={1100}
        footer={null}
      >
        <Row className="call-to-action" style={{ marginBottom: 0 }}>
          <h2>Select the NFT you want to sell</h2>
          <p style={{ fontSize: '1.2rem' }}>
            Select the NFT that you want to sell copy/copies of.
          </p>
        </Row>
        <Row className="content-action" style={{ overflowY: 'scroll', height: "50vh" }}>
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
          >
            {items.map(m => {
              const id = m.metadata.pubkey.toBase58();
              const isSelected = selectedItems.has(id);

              const onSelect = () => {
                let list = [...selectedItems.keys()];
                if (allowMultiple) {
                  list = [];
                }

                const newSet = isSelected
                  ? new Set(list.filter(item => item !== id))
                  : new Set([...list, id]);

                  let selected = items.filter(item =>
                    newSet.has(item.metadata.pubkey.toBase58()),
                  );
                  setSelected(selected);

                if (!allowMultiple) {
                  confirm();
                }
              };

              return (
                <ArtCard
                  key={id}
                  image={m.metadata.info.extended?.image}
                  category={m.metadata.info.extended?.category}
                  name={m.metadata.info?.name}
                  symbol={m.metadata.info.symbol}
                  preview={false}
                  onClick={onSelect}
                  className={isSelected ? 'selected-card' : 'not-selected-card'}
                />
              );
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
