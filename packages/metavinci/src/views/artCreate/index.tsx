import React, { useEffect, useMemo, useState } from 'react';
import {
  Steps,
  Row,
  Button,
  Upload,
  Col,
  Input,
  Statistic,
  Slider,
  Modal,
  Progress,
  Spin,
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { ArtCard } from './../../components/ArtCard';
import './styles.less';
import { mintNFT } from '../../models';
import { useConnection, useWallet } from '@oyster/common';
import { getAssetCostToStore, LAMPORT_MULTIPLIER } from '../../utils/assets';

const { Step } = Steps;
const { Dragger } = Upload;

enum Category {
  Audio = 'audio',
  Video = 'video',
  Image = 'image',
}
interface IProps {
  name: string;
  symbol: string;
  description: string;
  // preview image
  image: string;
  // stores link to item on meta
  externalUrl: string;
  royalty: number;
  files: File[];
  category: Category;
}

export const ArtCreateView = () => {
  const connection = useConnection();
  const { wallet, connected } = useWallet();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [attributes, setAttributes] = useState<IProps>({
    name: '',
    symbol: '',
    description: '',
    externalUrl: '',
    image: '',
    royalty: 0,
    files: [],
    category: Category.Image,
  });

  // store files
  const mint = async () => {
    const metadata = {
      ...(attributes as any),
      files: attributes.files.map(f => f.name),
    };
    setSaving(true);
    await mintNFT(connection, wallet, attributes.files, metadata);
    setSaving(false);
  };

  return (
    <>
      <Modal title="Saving..." footer={null} closable={false} visible={saving}>
        <Progress
          percent={100}
          strokeWidth={20}
          status="active"
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
          showInfo={false}
        />
      </Modal>
      <Row style={{ paddingTop: 50 }}>
        <Col xl={5}>
          <Steps
            progressDot
            direction="vertical"
            current={step}
            style={{ width: 200, marginLeft: 20, marginRight: 30 }}
          >
            <Step title="Category" />
            <Step title="Upload" />
            <Step title="Info" />
            <Step title="Royalties" />
            <Step title="Launch" />
          </Steps>
        </Col>
        <Col xl={16}>
          {step === 0 && (
            <CategoryStep
              confirm={(category: Category) => {
                setAttributes({
                  ...attributes,
                  category,
                });
                setStep(1);
              }}
            />
          )}
          {step === 1 && (
            <UploadStep
              attributes={attributes}
              setAttributes={setAttributes}
              confirm={() => setStep(2)}
            />
          )}

          {step === 2 && (
            <InfoStep
              attributes={attributes}
              setAttributes={setAttributes}
              confirm={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <RoyaltiesStep
              attributes={attributes}
              confirm={() => setStep(4)}
              setAttributes={setAttributes}
            />
          )}
          {step === 4 && (
            <LaunchStep attributes={attributes} confirm={() => mint()} />
          )}
        </Col>
      </Row>
    </>
  );
};

const CategoryStep = (props: { confirm: (category: Category) => void }) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Create your NFT artwork on Meta</h2>
        <p>
          Creating NFT on Solana is not only low cost for artists but supports
          environment with 20% of the fees form the platform donated to
          charities.
        </p>
      </Row>
      <Row>
        <Button
          className="type-btn"
          size="large"
          onClick={() => props.confirm(Category.Image)}
        >
          Image
        </Button>
        <Button
          className="type-btn"
          size="large"
          onClick={() => props.confirm(Category.Video)}
        >
          Video
        </Button>
        <Button
          className="type-btn"
          size="large"
          onClick={() => props.confirm(Category.Audio)}
        >
          Audio
        </Button>
      </Row>
    </>
  );
};

const UploadStep = (props: {
  attributes: IProps;
  setAttributes: (attr: IProps) => void;
  confirm: () => void;
}) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Now, let's upload your creation</h2>
        <p>
          Your file will be uploaded to the decentralized web via Arweave.
          Depending on file type, can take up to 1 minute. Arweave is a new type
          of storage that backs data with sustainable and perpetual endowments,
          allowing users and developers to truly store data forever – for the
          very first time.
        </p>
      </Row>
      <Row className="content-action">
        <Dragger
          multiple={false}
          customRequest={info => {
            // dont upload files here, handled outside of the control
            info?.onSuccess?.({}, null as any);
          }}
          style={{ padding: 20 }}
          onChange={info => {
            props.setAttributes({
              ...props.attributes,
              files: [info.file.originFileObj],
            });
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
        </Dragger>
      </Row>
      <Row>
        <Button
          type="primary"
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Continue to Mint
        </Button>
      </Row>
    </>
  );
};

const InfoStep = (props: {
  attributes: IProps;
  setAttributes: (attr: IProps) => void;
  confirm: () => void;
}) => {
  const file = props.attributes.files[0];
  return (
    <>
      <Row className="call-to-action">
        <h2>Describe your creation</h2>
        <p>
          Provide detailed description of your creative process to engage with
          your audience.
        </p>
      </Row>
      <Row className="content-action">
        <Col xl={12}>
          {file && (
            <ArtCard
              file={file}
              name={props.attributes.name}
              symbol={props.attributes.symbol}
            />
          )}
        </Col>
        <Col className="section" xl={12}>
          <label className="action-field">
            <span className="field-title">Title</span>
            <Input
              className="input"
              placeholder="Max 50 characters"
              allowClear
              value={props.attributes.name}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  name: info.target.value,
                })
              }
            />
          </label>
          <label className="action-field">
            <span className="field-title">Symbol</span>
            <Input
              className="input"
              placeholder="Max 10 characters"
              allowClear
              value={props.attributes.symbol}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  symbol: info.target.value,
                })
              }
            />
          </label>
          <label className="action-field">
            <span className="field-title">Description</span>
            <Input.TextArea
              className="input textarea"
              placeholder="Max 500 characters"
              value={props.attributes.description}
              onChange={info =>
                props.setAttributes({
                  ...props.attributes,
                  description: info.target.value,
                })
              }
              allowClear
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
          Continue to royalties
        </Button>
      </Row>
    </>
  );
};

const RoyaltiesStep = (props: {
  attributes: IProps;
  setAttributes: (attr: IProps) => void;
  confirm: () => void;
}) => {
  const file = props.attributes.files[0];

  return (
    <>
      <Row className="call-to-action">
        <h2>Set royalties for the creation</h2>
        <p>
          A royalty is a payment made by the seller of this item to the creator.
          It is charged after every successful auction.
        </p>
      </Row>
      <Row className="content-action">
        <Col xl={12}>
          {file && (
            <ArtCard
              file={file}
              name={props.attributes.name}
              symbol={props.attributes.symbol}
            />
          )}
        </Col>
        <Col className="section" xl={12}>
          <label className="action-field">
            <span className="field-title">Royalty Percentage</span>
            <Slider
              min={0}
              max={100}
              onChange={(val: number) => {
                props.setAttributes({ ...props.attributes, royalty: val });
              }}
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
          Continue to review
        </Button>
      </Row>
    </>
  );
};

const LaunchStep = (props: { confirm: () => void; attributes: IProps }) => {
  const file = props.attributes.files[0];
  const metadata = {
    ...(props.attributes as any),
    files: props.attributes.files.map(f => f.name),
  };
  const [cost, setCost] = useState(0);
  useEffect(() => {
    getAssetCostToStore([
      ...props.attributes.files,
      new File([JSON.stringify(metadata)], 'metadata.json'),
    ]).then(lamports => {
      const sol = lamports / LAMPORT_MULTIPLIER;
      setCost(sol);
    });
  }, [file]);
  return (
    <>
      <Row className="call-to-action">
        <h2>Launch your creation</h2>
        <p>
          Provide detailed description of your creative process to engage with
          your audience.
        </p>
      </Row>
      <Row className="content-action">
        <Col xl={12}>
          {file && (
            <ArtCard
              file={file}
              name={props.attributes.name}
              symbol={props.attributes.symbol}
            />
          )}
        </Col>
        <Col className="section" xl={12}>
          <Statistic
            className="create-statistic"
            title="Royalty Percentage"
            value={props.attributes.royalty}
            suffix="%"
          />
          {cost ? (
            <Statistic
              className="create-statistic"
              title="Cost to Create"
              value={cost}
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
          Pay with SOL
        </Button>
        <Button
          disabled={true}
          size="large"
          onClick={props.confirm}
          className="action-btn"
        >
          Pay with Credit Card
        </Button>
      </Row>
    </>
  );
};
