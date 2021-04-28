import React, { useEffect, useMemo, useState } from 'react';
import {
  Divider,
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
  Radio,
} from 'antd';
import { ArtCard } from './../../components/ArtCard';
import { UserSearch, UserValue } from './../../components/UserSearch';
import { Confetti } from './../../components/Confetti';
import { ArtSelector } from './artSelector';
import './../styles.less';
import {
  MAX_METADATA_LEN,
  MAX_NAME_SYMBOL_LEN,
  useConnection,
  useWallet,
  useConnectionConfig,
  Metadata,
  ParsedAccount,
  deserializeBorsh,
  WinnerLimit,
  WinnerLimitType,
} from '@oyster/common';
import { getAssetCostToStore, LAMPORT_MULTIPLIER } from '../../utils/assets';
import { Connection, ParsedAccountData, PublicKey } from '@solana/web3.js';
import { MintLayout, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useHistory, useParams } from 'react-router-dom';
import { useUserArts } from '../../hooks';
import Masonry from 'react-masonry-css';
import { capitalize } from 'lodash';
import {
  AuctionManager,
  AuctionManagerSettings,
  AuctionManagerState,
  AuctionManagerStatus,
  EditionType,
  NonWinningConstraint,
  SCHEMA,
  WinningConfig,
  WinningConstraint,
} from '../../models/metaplex';
import { serialize } from 'borsh';
import moment from 'moment';
import {
  createAuctionManager,
  SafetyDepositDraft,
} from '../../actions/createAuctionManager';
import BN from 'bn.js';
import { ZERO } from '@oyster/common/dist/lib/constants';

const { Step } = Steps;
const { Option } = Select;
const { Dragger } = Upload;
const { TextArea } = Input;

export enum AuctionCategory {
  Limited,
  Single,
  Open,
  Tiered,
}

interface Tier {
  to: number;
  name: string;
  description?: string;
  items: SafetyDepositDraft[];
}

export interface AuctionState {
  // Min price required for the item to sell
  reservationPrice: number;

  // listed NFTs
  items: SafetyDepositDraft[];
  participationNFT?: SafetyDepositDraft;
  // number of editions for this auction (only applicable to limited edition)
  editions?: number;

  // date time when auction should start UTC+0
  startDate?: Date;

  // suggested date time when auction should end UTC+0
  endDate?: Date;

  //////////////////
  category: AuctionCategory;
  saleType?: 'auction' | 'sale';

  price?: number;
  priceFloor?: number;
  priceTick?: number;

  startSaleTS?: number; // Why do I prefer to work with unix ts?
  startListTS?: number;
  endTS?: number;

  auctionDuration?: number;
  gapTime?: number;
  tickSizeEndingPhase?: number;

  spots?: number;
  tiers?: Array<Tier>;

  winnersCount: number;
}

export const AuctionCreateView = () => {
  const connection = useConnection();
  const { env } = useConnectionConfig();
  const items = useUserArts();
  const { wallet, connected } = useWallet();
  const { step_param }: { step_param: string } = useParams();
  const history = useHistory();

  const [step, setStep] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [attributes, setAttributes] = useState<AuctionState>({
    reservationPrice: 0,
    items: [],
    category: AuctionCategory.Open,
    saleType: 'auction',
    winnersCount: 1,
  });

  useEffect(() => {
    if (step_param) setStep(parseInt(step_param));
    else gotoNextStep(0);
  }, [step_param]);

  const gotoNextStep = (_step?: number) => {
    const nextStep = _step === undefined ? step + 1 : _step;
    history.push(`/auction/create/${nextStep.toString()}`);
  };

  const createAuction = async () => {
    let settings: AuctionManagerSettings;
    let winnerLimit: WinnerLimit;
    if (attributes.category == AuctionCategory.Open) {
      settings = new AuctionManagerSettings({
        openEditionWinnerConstraint: WinningConstraint.OpenEditionGiven,
        openEditionNonWinningConstraint:
          NonWinningConstraint.GivenForFixedPrice,
        winningConfigs: [],
        openEditionConfig: 0,
        openEditionFixedPrice: new BN(attributes.reservationPrice),
      });

      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Unlimited,
        usize: ZERO,
      });
    } else if (
      attributes.category == AuctionCategory.Limited ||
      attributes.category == AuctionCategory.Single
    ) {
      settings = new AuctionManagerSettings({
        openEditionWinnerConstraint: attributes.participationNFT
          ? WinningConstraint.OpenEditionGiven
          : WinningConstraint.NoOpenEdition,
        openEditionNonWinningConstraint: attributes.participationNFT
          ? NonWinningConstraint.GivenForFixedPrice
          : NonWinningConstraint.NoOpenEdition,
        winningConfigs: attributes.items.map(
          (item, index) =>
            new WinningConfig({
              // TODO: check index
              safetyDepositBoxIndex: index,
              amount: 1,
              editionType:
                attributes.category == AuctionCategory.Limited
                  ? EditionType.LimitedEdition
                  : item.masterEdition
                  ? EditionType.MasterEdition
                  : EditionType.NA,
            }),
        ),
        openEditionConfig: attributes.participationNFT
          ? attributes.items.length
          : null,
        openEditionFixedPrice: attributes.participationNFT
          ? new BN(attributes.reservationPrice)
          : null,
      });
      winnerLimit = new WinnerLimit({
        type: WinnerLimitType.Capped,
        usize: new BN(attributes.winnersCount),
      });
      console.log('Settings', settings);
    } else {
      throw new Error('Not supported');
    }

    await createAuctionManager(
      connection,
      wallet,
      settings,
      winnerLimit,
      new BN((attributes.auctionDuration || 1) * 60),
      new BN((attributes.gapTime || 1) * 60),
      [
        ...attributes.items,
        ...(attributes.participationNFT ? [attributes.participationNFT] : []),
      ],
      // TODO: move to config
      new PublicKey('3EVo6RQfu5D1DC18jsqrQnbiKLYoig8yckJC7QgMiJVY'),
    );
  };

  const categoryStep = (
    <CategoryStep
      confirm={(category: AuctionCategory) => {
        setAttributes({
          ...attributes,
          category,
        });
        gotoNextStep();
      }}
    />
  );

  const copiesStep = (
    <CopiesStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const winnersStep = (
    <NumberOfWinnersStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const tierStep = (
    <TierStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const typeStep = (
    <SaleTypeStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const priceStep = (
    <PriceStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const initialStep = (
    <InitialPhaseStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const endingStep = (
    <EndingPhaseStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const participationStep = (
    <ParticipationStep
      attributes={attributes}
      setAttributes={setAttributes}
      confirm={() => gotoNextStep()}
    />
  );

  const reviewStep = (
    <ReviewStep
      attributes={attributes}
      confirm={() => gotoNextStep()}
      connection={connection}
    />
  );

  const waitStep = (
    <WaitingStep
      createAuction={createAuction}
      confirm={() => gotoNextStep()}
    />
  );

  const congratsStep = <Congrats />;

  const stepsByCategory = {
    [AuctionCategory.Limited]: [
      ['Category', categoryStep],
      ['Copies', copiesStep],
      ['Sale Type', typeStep],
      ['Price', priceStep],
      ['Initial Phase', initialStep],
      ['Ending Phase', endingStep],
      ['Participation NFT', participationStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
    [AuctionCategory.Single]: [
      ['Category', categoryStep],
      ['Copies', copiesStep],
      ['Price', priceStep],
      ['Initial Phase', initialStep],
      ['Ending Phase', endingStep],
      ['Participation NFT', participationStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
    [AuctionCategory.Open]: [
      ['Category', categoryStep],
      ['Copies', copiesStep],
      ['Price', priceStep],
      ['Initial Phase', initialStep],
      ['Ending Phase', endingStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
    [AuctionCategory.Tiered]: [
      ['Category', categoryStep],
      ['Number of Winners', winnersStep],
      ['Tiers', tierStep],
      ['Price', priceStep],
      ['Initial Phase', initialStep],
      ['Ending Phase', endingStep],
      ['Participation NFT', participationStep],
      ['Review', reviewStep],
      ['Publish', waitStep],
      [undefined, congratsStep],
    ],
  };

  return (
    <>
      <Row style={{ paddingTop: 50 }}>
        {!saving && (
          <Col xl={5}>
            <Steps
              progressDot
              direction="vertical"
              current={step}
              style={{ width: 200, marginLeft: 20, marginRight: 30 }}
            >
              {stepsByCategory[attributes.category]
                .filter(_ => !!_[0])
                .map(step => (
                  <Step title={step[0]} />
                ))}
            </Steps>
          </Col>
        )}
        <Col {...(saving ? { xl: 24 } : { xl: 16, md: 17 })}>
          {stepsByCategory[attributes.category][step][1]}
          {0 < step && step < stepsByCategory[attributes.category].length - 1 && (
            <Button
              style={{ width: '100%' }}
              onClick={() => gotoNextStep(step - 1)}
            >
              Back
            </Button>
          )}
        </Col>
      </Row>
    </>
  );
};

const CategoryStep = (props: {
  confirm: (category: AuctionCategory) => void;
}) => {
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
                <div className="type-btn-description">
                  Sell a limited copy or copies of a single Master NFT
                </div>
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
                <div className="type-btn-description">
                  Sell unlimited copies of a single Master NFT
                </div>
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
                <div className="type-btn-description">
                  Participants get unique rewards based on their leaderboard
                  rank
                </div>
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
                <div className="type-btn-description">
                  Sell an existing item in your NFT collection, including Master
                  NFTs
                </div>
              </div>
            </Button>
          </Row>
        </Col>
      </Row>
    </>
  );
};

const CopiesStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  let filter: ((i: SafetyDepositDraft) => boolean) | undefined;
  if (props.attributes.category == AuctionCategory.Limited) {
    filter = (i: SafetyDepositDraft) => !!i.masterEdition;
  } else if (
    props.attributes.category == AuctionCategory.Single ||
    props.attributes.category == AuctionCategory.Tiered
  ) {
    filter = undefined;
  } else if (props.attributes.category == AuctionCategory.Open) {
    filter = (i: SafetyDepositDraft) =>
      !!(
        i.masterEdition &&
        (i.masterEdition.info.maxSupply == undefined ||
          i.masterEdition.info.maxSupply == null)
      );
  }

  return (
    <>
      <Row className="call-to-action" style={{ marginBottom: 0 }}>
        <h2>Select which item to sell</h2>
        <p style={{ fontSize: '1.2rem' }}>
          Select the item(s) that you want to list.
        </p>
      </Row>
      <Row className="content-action">
        <Col xl={24}>
          <ArtSelector
            filter={filter}
            selected={props.attributes.items}
            setSelected={items => {
              props.setAttributes({ ...props.attributes, items });
            }}
            allowMultiple={false}
          >
            Select NFT
          </ArtSelector>
          {props.attributes.category !== AuctionCategory.Open && (
            <label className="action-field">
              <span className="field-title">
                How many copies do you want to create?
              </span>
              <span className="field-info">
                Each copy will be given unique edition number e.g. 1 of 30
              </span>
              <Input
                autoFocus
                className="input"
                placeholder="Enter number of copies sold"
                allowClear
                onChange={info =>
                  props.setAttributes({
                    ...props.attributes,
                  })
                }
              />
            </label>
          )}
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={() => {
            props.setAttributes({
              ...props.attributes,
              tiers:
                !props.attributes.tiers || props.attributes.tiers?.length == 0
                  ? [
                      {
                        to: 0,
                        name: 'Default Tier',
                        items: props.attributes.items,
                      },
                    ]
                  : props.attributes.tiers,
            });
            props.confirm();
          }}
          className="action-btn"
        >
          Continue to Terms
        </Button>
      </Row>
    </>
  );
};

const NumberOfWinnersStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Tiered Auction</h2>
        <p>Create a Tiered Auction</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">
              How many participants can win the auction?
            </span>
            <span className="field-info">
              This is the number of spots in the leaderboard.
            </span>
            <Input
              type="number"
              autoFocus
              className="input"
              placeholder="Number of spots in the leaderboard"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  spots: parseInt(info.target.value),
                })
              }
            />
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
          Continue
        </Button>
      </Row>
    </>
  );
};

const TierWinners = (props: {
  idx: number;
  tier: Tier;
  setTier: Function;
  previousTo?: number;
  lastTier?: Tier;
}) => {
  const from = (props.previousTo || 0) + 1;
  return (
    <>
      <Divider />
      <label className="action-field">
        <span className="field-title">Winners</span>
        <div>
          <InputNumber
            disabled={true}
            value={from}
            type="number"
            className="input"
            style={{ width: '30%' }}
            onChange={value => null}
          />
          &nbsp;to&nbsp;
          <InputNumber
            min={from + 1}
            disabled={props.lastTier?.to == props.tier.to}
            defaultValue={props.tier.to}
            type="number"
            className="input"
            style={{ width: '30%' }}
            onChange={value =>
              props.setTier(props.idx, {
                ...props.tier,
                to: value || props.tier.to,
              })
            }
          />
        </div>
      </label>

      <label className="action-field">
        <span className="field-title">Tier Name</span>
        <Input
          className="input"
          placeholder="Max 50 characters"
          onChange={info =>
            props.setTier(props.idx, {
              ...props.tier,
              name: info.target.value || '',
            })
          }
        />
      </label>

      <label className="action-field">
        <span className="field-title">Tier Description</span>
        <TextArea
          className="input"
          style={{ height: 150 }}
          placeholder="Max 500 characters"
          onChange={info =>
            props.setTier(props.idx, {
              ...props.tier,
              description: info.target.value || '',
            })
          }
        />
      </label>

      <ArtSelector
        selected={props.tier.items}
        setSelected={items => props.setTier({ ...props.tier, items })}
        allowMultiple={true}
      />
    </>
  );
};

const TierStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const setTier = (idx: number, tier: Tier) => {
    let tiers = props.attributes.tiers as Array<Tier>;
    tiers[idx] = tier;
    props.setAttributes({
      ...props.attributes,
      tiers,
    });
  };

  const tiers = props.attributes.tiers || [];

  return (
    <>
      <Row className="call-to-action">
        <h2>Tiers</h2>
        <p>
          Winners in the same tier will receive the next lowest edition number
          based on their leaderboard standing.
        </p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">Number of Tiers</span>
            <span className="field-info">
              Each winner in a given tier will receive the same reward.
            </span>
            <Input
              type="number"
              min={1}
              autoFocus
              className="input"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  tiers: [...Array(parseInt(info.target.value) || 0)].map(
                    (_, idx) => ({
                      to: Math.trunc(
                        ((idx + 1) * (props.attributes.spots as number)) /
                          parseInt(info.target.value),
                      ),
                      name: '',
                      description: '',
                      items: [],
                    }),
                  ),
                })
              }
            />
          </label>

          {tiers.map((tier, idx) => (
            <TierWinners
              key={idx}
              idx={idx}
              tier={tier}
              setTier={setTier}
              previousTo={tiers[idx - 1]?.to}
              lastTier={tiers.slice(-1)[0]}
            />
          ))}
        </Col>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue
        </Button>
      </Row>
    </>
  );
};

const SaleTypeStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Sale Type</h2>
        <p>Sell a limited copy or copies of a single Master NFT.</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">
              How do you want to sell your NFT(s)?
            </span>
            <Radio.Group
              defaultValue={props.attributes.saleType}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  saleType: info.target.value,
                })
              }
            >
              <Radio className="radio-field" value="auction">
                Auction
              </Radio>
              <div className="radio-subtitle">
                Allow bidding on your NFT(s).
              </div>
              <Radio className="radio-field" value="sale">
                Instant Sale
              </Radio>
              <div className="radio-subtitle">
                Allow buyers to purchase your NFT(s) at a fixed price.
              </div>
            </Radio.Group>
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
          Continue
        </Button>
      </Row>
    </>
  );
};

const PriceStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      {props.attributes.saleType == 'auction' ? (
        <PriceAuction {...props} />
      ) : (
        <PriceSale {...props} />
      )}
    </>
  );
};

const PriceSale = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Price</h2>
        <p>Set the price for your auction.</p>
      </Row>
      <Row className="content-action">
        <label className="action-field">
          <span className="field-title">Sale price</span>
          <span className="field-info">
            This is the starting bid price for your auction.
          </span>
          <Input
            type="number"
            min={0}
            autoFocus
            className="input"
            placeholder="Price"
            prefix="$"
            suffix="USD"
            onChange={info =>
              props.setAttributes({
                ...props.attributes,
                price: parseFloat(info.target.value) || undefined,
              })
            }
          />
        </label>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue
        </Button>
      </Row>
    </>
  );
};

const PriceAuction = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Price</h2>
        <p>Set the price for your auction.</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">Price Floor</span>
            <span className="field-info">
              This is the starting bid price for your auction.
            </span>
            <Input
              type="number"
              min={0}
              autoFocus
              className="input"
              placeholder="Price"
              prefix="$"
              suffix="USD"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  priceFloor: parseFloat(info.target.value),
                })
              }
            />
            {/* <span className="field-info">= ◎ 4.84</span> */}
          </label>
          <label className="action-field">
            <span className="field-title">Tick Size</span>
            <span className="field-info">
              All bids must fall within this price increment.
            </span>
            <Input
              type="number"
              min={0}
              className="input"
              placeholder="Tick size in USD"
              prefix="$"
              suffix="USD"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  priceTick: parseFloat(info.target.value),
                })
              }
            />
            {/* <span className="field-info">= ◎ 4.84</span> */}
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
          Continue
        </Button>
      </Row>
    </>
  );
};

const InitialPhaseStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const [startNow, setStartNow] = useState<boolean>(true);
  const [listNow, setListNow] = useState<boolean>(true);

  const [saleMoment, setSaleMoment] = useState<moment.Moment | undefined>(
    props.attributes.startSaleTS
      ? moment.unix(props.attributes.startSaleTS)
      : undefined,
  );
  const [listMoment, setListMoment] = useState<moment.Moment | undefined>(
    props.attributes.startListTS
      ? moment.unix(props.attributes.startListTS)
      : undefined,
  );

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      startSaleTS: saleMoment && saleMoment.unix() * 1000,
    });
  }, [saleMoment]);

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      startListTS: listMoment && listMoment.unix() * 1000,
    });
  }, [listMoment]);

  useEffect(() => {
    if (startNow) setSaleMoment(moment());
  }, [startNow]);

  useEffect(() => {
    if (listNow) setListMoment(moment());
  }, [listNow]);

  return (
    <>
      <Row className="call-to-action">
        <h2>Initial Phase</h2>
        <p>Set the terms for your {props.attributes.saleType}.</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">
              When do you want the {props.attributes.saleType} to begin?
            </span>
            <Radio.Group
              defaultValue="now"
              onChange={info => setStartNow(info.target.value === 'now')}
            >
              <Radio className="radio-field" value="now">
                Immediately
              </Radio>
              <div className="radio-subtitle">
                Participants can buy the NFT as soon as you finish setting up
                the auction.
              </div>
              <Radio className="radio-field" value="later">
                At a specified date
              </Radio>
              <div className="radio-subtitle">
                Participants can start buying the NFT at a specified date.
              </div>
            </Radio.Group>
          </label>

          {!startNow && (
            <>
              <label className="action-field">
                <span className="field-title">
                  {capitalize(props.attributes.saleType)} Start Date
                </span>
                <DatePicker
                  className="field-date"
                  size="large"
                  onChange={(dt, dtString) => console.log({ dt, dtString })}
                />
                <TimePicker
                  className="field-date"
                  size="large"
                  onChange={(dt, dtString) => console.log({ dt, dtString })}
                />
              </label>

              <label className="action-field">
                <span className="field-title">
                  When do you want the listing to go live?
                </span>
                <Radio.Group
                  defaultValue="now"
                  onChange={info => setListNow(info.target.value === 'now')}
                >
                  <Radio
                    className="radio-field"
                    value="now"
                    defaultChecked={true}
                  >
                    Immediately
                  </Radio>
                  <div className="radio-subtitle">
                    Participants will be able to view the listing with a
                    countdown to the start date as soon as you finish setting up
                    the sale.
                  </div>
                  <Radio className="radio-field" value="later">
                    At a specified date
                  </Radio>
                  <div className="radio-subtitle">
                    Participants will be able to view the listing with a
                    countdown to the start date at the specified date.
                  </div>
                </Radio.Group>
              </label>

              {!listNow && (
                <label className="action-field">
                  <span className="field-title">Preview Start Date</span>
                  <DatePicker className="field-date" size="large" />
                  <TimePicker className="field-date" size="large" />
                </label>
              )}
            </>
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
          Continue
        </Button>
      </Row>
    </>
  );
};

const EndingPhaseStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      {props.attributes.saleType == 'auction' ? (
        <EndingPhaseAuction {...props} />
      ) : (
        <EndingPhaseSale {...props} />
      )}
    </>
  );
};

const EndingPhaseAuction = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Ending Phase</h2>
        <p>Set the terms for your auction.</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">Auction Duration</span>
            <span className="field-info">
              This is how long the auction will last for.
            </span>
            <Input
              type="number"
              autoFocus
              className="input"
              placeholder="Duration in minutes"
              suffix="minutes"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  auctionDuration: parseInt(info.target.value),
                })
              }
            />
          </label>

          <label className="action-field">
            <span className="field-title">Gap Time</span>
            <span className="field-info">
              The final phase of the auction will begin when there is this much
              time left on the countdown. Any bids placed during the final phase
              will extend the end time by this same duration.
            </span>
            <Input
              type="number"
              className="input"
              placeholder="Duration in minutes"
              suffix="minutes"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  gapTime: parseInt(info.target.value),
                })
              }
            />
          </label>

          <label className="action-field">
            <span className="field-title">Tick Size for Ending Phase</span>
            <span className="field-info">
              In order for winners to move up in the auction, they must place a
              bid that’s at least this percentage higher than the next highest
              bid.
            </span>
            <Input
              type="number"
              className="input"
              placeholder="Percentage"
              suffix="%"
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  tickSizeEndingPhase: parseInt(info.target.value),
                })
              }
            />
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
          Continue
        </Button>
      </Row>
    </>
  );
};

const EndingPhaseSale = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  const [untilSold, setUntilSold] = useState<boolean>(true);
  const [endMoment, setEndMoment] = useState<moment.Moment | undefined>(
    props.attributes.endTS ? moment.unix(props.attributes.endTS) : undefined,
  );

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      endTS: endMoment && endMoment.unix() * 1000,
    });
  }, [endMoment]);

  useEffect(() => {
    if (untilSold) setEndMoment(undefined);
  }, [untilSold]);

  return (
    <>
      <Row className="call-to-action">
        <h2>Ending Phase</h2>
        <p>Set the terms for your sale.</p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <label className="action-field">
            <span className="field-title">
              When do you want the sale to end?
            </span>
            <Radio.Group
              defaultValue="now"
              onChange={info => setUntilSold(info.target.value === 'now')}
            >
              <Radio className="radio-field" value="now">
                Until sold
              </Radio>
              <div className="radio-subtitle">
                The sale will end once the supply goes to zero.
              </div>
              <Radio className="radio-field" value="later">
                At a specified date
              </Radio>
              <div className="radio-subtitle">
                The sale will end at this date, regardless if there is remaining
                supply.
              </div>
            </Radio.Group>
          </label>

          {!untilSold && (
            <label className="action-field">
              <span className="field-title">End Date</span>
              <DatePicker
                className="field-date"
                size="large"
                disabledDate={current =>
                  current && current < moment().endOf('day')
                }
                value={endMoment}
                onChange={value => {
                  if (!value) return;
                  if (!endMoment) return setEndMoment(value);

                  const currentMoment = endMoment.clone();
                  currentMoment.hour(value.hour());
                  currentMoment.minute(value.minute());
                  currentMoment.second(value.second());
                  setEndMoment(currentMoment);
                }}
              />
              <TimePicker
                className="field-date"
                size="large"
                value={endMoment}
                onChange={value => {
                  if (!value) return;
                  if (!endMoment) return setEndMoment(value);

                  const currentMoment = endMoment.clone();
                  currentMoment.hour(value.hour());
                  currentMoment.minute(value.minute());
                  currentMoment.second(value.second());
                  setEndMoment(currentMoment);
                }}
              />
            </label>
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
          Continue
        </Button>
      </Row>
    </>
  );
};

const ParticipationStep = (props: {
  attributes: AuctionState;
  setAttributes: (attr: AuctionState) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Participation NFT</h2>
        <p>
          Provide NFT that will be awarded as an Open Edition NFT for auction
          participation.
        </p>
      </Row>
      <Row className="content-action">
        <Col className="section" xl={24}>
          <ArtSelector
            filter={(i: SafetyDepositDraft) => !!i.masterEdition}
            selected={
              props.attributes.participationNFT
                ? [props.attributes.participationNFT]
                : []
            }
            setSelected={items => {
              props.setAttributes({
                ...props.attributes,
                participationNFT: items[0],
              });
            }}
            allowMultiple={false}
          >
            Select Participation NFT
          </ArtSelector>
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
      props.connection.getMinimumBalanceForRentExemption(MintLayout.span),
      props.connection.getMinimumBalanceForRentExemption(MAX_METADATA_LEN),
      props.connection.getMinimumBalanceForRentExemption(MAX_NAME_SYMBOL_LEN),
    ]);

    // TODO: add
  }, [setCost]);

  let item = props.attributes.items?.[0];

  return (
    <>
      <Row className="call-to-action">
        <h2>Review and list</h2>
        <p>Review your listing before publishing.</p>
      </Row>
      <Row className="content-action">
        <Col xl={12}>
          {item?.metadata.info && (
            <ArtCard
              image={item.metadata.info.extended?.image}
              category={item.metadata.info.extended?.category}
              name={item.metadata.info.name}
              symbol={item.metadata.info.symbol}
              small={true}
            />
          )}
        </Col>
        <Col className="section" xl={12}>
          <Statistic
            className="create-statistic"
            title="Copies"
            value={
              props.attributes.editions === undefined
                ? 'Unique'
                : props.attributes.editions
            }
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
      <Row style={{ display: 'block' }}>
        <Divider />
        {props.attributes.startSaleTS && (
          <Statistic
            className="create-statistic"
            title="Start date"
            value={props.attributes.startSaleTS}
          />
        )}
        <br />
        {props.attributes.startListTS && (
          <Statistic
            className="create-statistic"
            title="Listing go live date"
            value={moment.unix((props.attributes.startListTS as number) / 1000).format("dddd, MMMM Do YYYY, h:mm a")}
          />
        )}
        <Divider />
        {props.attributes.endTS && (
          <Statistic
            className="create-statistic"
            title="Sale ends"
            value={props.attributes.endTS}
          />
        )}
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
  createAuction: () => Promise<void>;
  confirm: () => void;
}) => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const func = async () => {
      const inte = setInterval(() => setProgress(prog => prog + 1), 600);
      await props.createAuction();
      clearInterval(inte);
      props.confirm();
    };
    func();
  }, []);

  return (
    <div style={{ marginTop: 70 }}>
      <Progress type="circle" percent={progress} />
      <div className="waiting-title">
        Your creation is being listed with Metaplex...
      </div>
      <div className="waiting-subtitle">This can take up to 30 seconds.</div>
    </div>
  );
};

const Congrats = () => {
  return (
    <>
      <div style={{ marginTop: 70 }}>
        <div className="waiting-title">
          Congratulations! Your auction is now live.
        </div>
        <div className="congrats-button-container">
          <Button className="congrats-button">
            <span>Share it on Twitter</span>
            <span>&gt;</span>
          </Button>
          <Button className="congrats-button">
            <span>See it in your collection</span>
            <span>&gt;</span>
          </Button>
          <Button className="congrats-button">
            <span>Sell it via auction</span>
            <span>&gt;</span>
          </Button>
        </div>
      </div>
      <Confetti />
    </>
  );
};
