import React, { useEffect, useMemo, useState } from 'react';
import {
  Steps,
  Row,
  Button,
  Upload,
  Col,
  Input,
  Statistic,
  Modal,
  Progress,
  Spin,
  InputNumber,
  Select,
  TimePicker,
  DatePicker,
} from 'antd';
import { ArtCard } from './../../components/ArtCard';
import { UserSearch, UserValue } from './../../components/UserSearch';
import { Confetti } from './../../components/Confetti';
import './../styles.less';
import {
  MAX_METADATA_LEN,
  MAX_OWNER_LEN,
  MAX_URI_LENGTH,
  useConnection,
  useWallet,
  useConnectionConfig,
  Metadata,
  ParsedAccount,
} from '@oyster/common';
import { getAssetCostToStore, LAMPORT_MULTIPLIER } from '../../utils/assets';
import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';
import { useHistory, useParams } from 'react-router-dom';
import { useUserArts } from '../../hooks';
import Masonry from 'react-masonry-css';

const { Step } = Steps;
const { Option } = Select;
const { Dragger } = Upload;

export enum AuctionCategory {
  Limited,
  Open,
  Tiered,
  Single,
}

export interface AuctionState {
  // Min price required for the item to sell
  reservationPrice: number;

  // listed NFTs
  items: ParsedAccount<Metadata>[];

  // number of editions for this auction (only applicable to limited edition)
  editions?: number;

  // date time when auction should start UTC+0
  startDate?: Date;

  // suggested date time when auction should end UTC+0
  endDate?: Date;

  // time interval between highest bid and end of the auction
  gapTime?: Date

  category: AuctionCategory;
}

export const AuctionCreateView = () => {
  const connection = useConnection();
  const { env } = useConnectionConfig();
  const { wallet, connected } = useWallet();
  const { step_param }: { step_param: string } = useParams()
  const history = useHistory()

  const [step, setStep] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [attributes, setAttributes] = useState<AuctionState>({
    reservationPrice: 0,
    items: [],
    category: AuctionCategory.Single,
  });

  useEffect(() => {
    if (step_param) setStep(parseInt(step_param))
    else gotoStep(0)
  }, [step_param])

  const gotoStep = (_step: number) => {
    history.push(`/auction/create/${_step.toString()}`)
  }

  const createAuction = async () => {
    // TODO: ....
  };

  return (
    <>
      <Row style={{ paddingTop: 50 }}>
        {!saving && <Col xl={5}>
          <Steps
            progressDot
            direction="vertical"
            current={step}
            style={{ width: 200, marginLeft: 20, marginRight: 30 }}
          >
            <Step title="List" />
            <Step title="Select" />
            <Step title="Terms" />
            <Step title="Review" />
          </Steps>
        </Col>}
        <Col {...(saving ? { xl: 24 } : { xl: 16 })}>
          {step === 0 && (
            <CategoryStep
              confirm={(category: AuctionCategory) => {
                setAttributes({
                  ...attributes,
                  category,
                });
                gotoStep(1);
              }}
            />
          )}
          {step === 1 && (
            <SelectItemsStep
              attributes={attributes}
              setAttributes={setAttributes}
              confirm={() => gotoStep(2)}
            />
          )}

          {step === 2 && (
            <TermsStep
              attributes={attributes}
              setAttributes={setAttributes}
              confirm={() => gotoStep(3)}
            />
          )}
          {step === 3 && (
            <ReviewStep
              attributes={attributes}
              confirm={() => gotoStep(5)}
              connection={connection}
            />
          )}
          {step === 4 && (
            <WaitingStep
              createAuction={createAuction}
              progress={progress}
              confirm={() => gotoStep(6)}
            />
          )}
          {step === 5 && (
            <Congrats />
          )}
          {(0 < step && step < 5) && <Button onClick={() => gotoStep(step - 1)}>Back</Button>}
        </Col>
      </Row>
    </>
  );
};

const CategoryStep = (props: { confirm: (category: AuctionCategory) => void }) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>List an item</h2>
        <p>
          First time listing on Metaplex? <a>Read our sellers' guide.</a>
        </p>
      </Row>
      <Row>
        <Col>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.Limited)}
            >
              <div>
                <div>Limited Edition</div>
                <div className="type-btn-description">Sell a limited copy or copies of a single Master NFT</div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.Open)}
            >
              <div>
                <div>Open Edition</div>
                <div className="type-btn-description">Sell unlimited copies of a single Master NFT</div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.Tiered)}
            >
              <div>
                <div>Tiered Auction</div>
                <div className="type-btn-description">Participants get unique rewards based on their leaderboard rank</div>
              </div>
            </Button>
          </Row>
          <Row>
            <Button
              className="type-btn"
              size="large"
              onClick={() => props.confirm(AuctionCategory.Single)}
            >
              <div>
                <div>Sell an Existing Item</div>
                <div className="type-btn-description">Sell an existing item in your NFT collection, including Master NFTs</div>
              </div>
            </Button>
          </Row>
        </Col>
      </Row>
    </>
  );
};

const SelectItemsStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const items = useUserArts();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(props.attributes.items.map(item => item.pubkey.toBase58())));

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      // TODO: add items
      items: items.filter(item => selectedItems.has(item.pubkey.toBase58()))
    })
  }, [selectedItems]);

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <>
      <Row className="call-to-action" style={{ marginBottom: 0 }}>
        <h2>Select which item to sell</h2>
        <p style={{ fontSize: '1.2rem' }}>
          Select the item(s) that you want to list.
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
                if (props.attributes.category !== AuctionCategory.Tiered) {
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
            props.setAttributes({
              ...props.attributes,

            })
            props.confirm()
          }}
          className="action-btn"
        >
          Continue to Terms
        </Button>
      </Row>
    </>
  );
};

const TermsStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const [creators, setCreators] = useState<Array<UserValue>>([]);



  return (
    <>
      <Row className="call-to-action">
        <h2>Specify the terms of your auction</h2>
        <p>
          Provide detailed auction parameters such as price, start time, etc.
        </p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">Number of copies</span>
            <Input
              autoFocus
              className="input"
              placeholder="Enter reservation price"
              allowClear
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                })
              }
            />
            <span className="field-info">= ◎ 4.84</span>
          </label>

          <label className="action-field">
            <span className="field-title">Price Floor (USD)</span>
            <Input
              autoFocus
              className="input"
              placeholder="Enter reservation price"
              allowClear
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                })
              }
            />
            <span className="field-info">= ◎ 4.84</span>
          </label>
          <label className="action-field">
            <span className="field-title">Tick Size (USD)</span>
            <Input
              className="input"
              placeholder="Enter tick size"
              allowClear
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                })
              }
            />
            <span className="field-info">= ◎ 4.84</span>
          </label>
          <label className="action-field">
            <span className="field-title">Preview Start Date</span>
            <DatePicker className="field-date" size="large" />
            <TimePicker className="field-date" size="large" />
          </label>
          <label className="action-field">
            <span className="field-title">When do you want the auction to begin?</span>
            <span>Immediately</span>
            <span>At a specified data</span>
          </label>
          <label className="action-field">
            <span className="field-title">Auction Start Date</span>
            <DatePicker className="field-date" size="large" />
            <TimePicker className="field-date" size="large" />
          </label>
          <label className="action-field">
            <span className="field-title">End Start Date</span>
            <DatePicker className="field-date" size="large" />
            <TimePicker className="field-date" size="large" />
          </label>
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue to Review
        </Button>
      </Row>
    </>
  );
};

const ReviewStep = (props: {
  confirm: () => void;
  attributes: AuctionState;
  connection: Connection;
}) => {
  const [cost, setCost] = useState(0);
  useEffect(() => {
    const rentCall = Promise.all([
      props.connection.getMinimumBalanceForRentExemption(
        MintLayout.span,
      ),
      props.connection.getMinimumBalanceForRentExemption(
        MAX_METADATA_LEN,
      ),
      props.connection.getMinimumBalanceForRentExemption(
        MAX_OWNER_LEN,
      )
    ]);

    // TODO: add
  }, [setCost]);

  let item = props.attributes.items?.[0];

  return (
    <>
      <Row className="call-to-action">
        <h2>Review and list</h2>
        <p>
          Review your listing before publishing.
        </p>
      </Row>
      <Row className="content-action">
        <Col xl={12}>
          {item?.info && (
            <ArtCard
              image={item.info.extended?.image}
              category={item.info.extended?.category}
              name={item.info.name}
              symbol={item.info.symbol}
              small={true}
            />
          )}
        </Col>
        <Col className="section" xl={12}>
          <Statistic
            className="create-statistic"
            title="Copies"
            value={props.attributes.editions === undefined ? 'Unique' : props.attributes.editions }
          />
          {cost ? (
            <Statistic
              className="create-statistic"
              title="Cost to Create"
              value={cost.toPrecision(3)}
              prefix="◎"
            />
          ) : (
            <Spin />
          )}
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Publish Auction
        </Button>
      </Row>
    </>
  );
};

const WaitingStep = (props: {
  createAuction: () => Promise<void>,
  progress: number,
  confirm: () => void,
}) => {

  useEffect(() => {
    const func = async () => {
      await props.createAuction()
      props.confirm()
    }
    func()
  }, [])

  return (
    <div style={{ marginTop: 70 }}>
      <Progress
        type="circle"
        percent={props.progress}
      />
      <div className="waiting-title">
        Your creation is being listed with Metaplex...
      </div>
      <div className="waiting-subtitle">This can take up to 30 seconds.</div>
    </div>
  )
}

const Congrats = () => {
  return <>
    <div style={{ marginTop: 70 }}>
      <div className="waiting-title">
        Congratulations! Your auction is now live.
      </div>
      <div className="congrats-button-container">
        <Button className="congrats-button"><span>Share it on Twitter</span><span>&gt;</span></Button>
        <Button className="congrats-button"><span>See it in your collection</span><span>&gt;</span></Button>
        <Button className="congrats-button"><span>Sell it via auction</span><span>&gt;</span></Button>
      </div>
    </div>
    <Confetti />
  </>
}

