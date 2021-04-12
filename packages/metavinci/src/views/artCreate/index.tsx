import React, { useEffect, useState } from 'react';
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
} from 'antd';
import { ArtCard } from './../../components/ArtCard';
import './styles.less';
import { mintNFT } from '../../models';
import {
  MAX_METADATA_LEN,
  MAX_OWNER_LEN,
  MAX_URI_LENGTH,
  Metadata,
  NameSymbolTuple,
  useConnection,
  useWallet,
  IMetadataExtension,
  MetadataCategory,
  useConnectionConfig,
} from '@oyster/common';
import { getAssetCostToStore, LAMPORT_MULTIPLIER } from '../../utils/assets';
import { Connection } from '@solana/web3.js';
import { MintLayout } from '@solana/spl-token';
import { useHistory, useParams } from 'react-router-dom';

const { Step } = Steps;
const { Dragger } = Upload;

export const ArtCreateView = () => {
  const connection = useConnection();
  const { env } = useConnectionConfig();
  const { wallet, connected } = useWallet();
  const { step_param }: { step_param: string } = useParams()
  const history = useHistory()

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [attributes, setAttributes] = useState<IMetadataExtension>({
    name: '',
    symbol: '',
    description: '',
    externalUrl: '',
    image: '',
    royalty: 0,
    files: [],
    category: MetadataCategory.Image,
  });

  useEffect(() => {
    if (step_param) setStep(parseInt(step_param))
    else gotoStep(0)
  }, [step_param])

  const gotoStep = (_step: number) => {
    history.push(`/art/create/${_step.toString()}`)
  }

  // store files
  const mint = async () => {
    const metadata = {
      ...(attributes as any),
      image: attributes.files && attributes.files?.[0] && attributes.files[0].name,
      files: (attributes?.files || []).map(f => f.name),
    };
    setSaving(true);
    await mintNFT(connection, wallet, env, (attributes?.files || []), metadata);
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
              confirm={(category: MetadataCategory) => {
                setAttributes({
                  ...attributes,
                  category,
                });
                gotoStep(1);
              }}
            />
          )}
          {step === 1 && (
            <UploadStep
              attributes={attributes}
              setAttributes={setAttributes}
              confirm={() => gotoStep(2)}
            />
          )}

          {step === 2 && (
            <InfoStep
              attributes={attributes}
              setAttributes={setAttributes}
              confirm={() => gotoStep(3)}
            />
          )}
          {step === 3 && (
            <RoyaltiesStep
              attributes={attributes}
              confirm={() => gotoStep(4)}
              setAttributes={setAttributes}
            />
          )}
          {step === 4 && (
            <LaunchStep
              attributes={attributes}
              confirm={() => mint()}
              connection={connection}
            />
          )}
          {step > 0 && <Button onClick={() => gotoStep(step - 1)}>Back</Button>}
        </Col>
      </Row>
    </>
  );
};

const CategoryStep = (props: { confirm: (category: MetadataCategory) => void }) => {
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
          onClick={() => props.confirm(MetadataCategory.Image)}
        >
          Image
        </Button>
        <Button
          className="type-btn"
          size="large"
          onClick={() => props.confirm(MetadataCategory.Video)}
        >
          Video
        </Button>
        <Button
          className="type-btn"
          size="large"
          onClick={() => props.confirm(MetadataCategory.Audio)}
        >
          Audio
        </Button>
      </Row>
    </>
  );
};

const UploadStep = (props: {
  attributes: IMetadataExtension;
  setAttributes: (attr: IMetadataExtension) => void;
  confirm: () => void;
}) => {
  const [mainFile, setMainFile] = useState<any>(props.attributes.files?.slice(-1)[0])
  const [coverFile, setCoverFile] = useState<any>(props.attributes.files?.slice(0, 1)[0])

  const uploadMsg = (category: MetadataCategory) => {
    switch (category) {
      case MetadataCategory.Audio:
        return "Upload your audio creation (MP3, FLAC, WAV)"
      case MetadataCategory.Image:
        return "Upload your image creation (PNG, JPG, GIF)"
      case MetadataCategory.Video:
        return "Upload your video creation (MP4)"
      default:
        return "Please go back and choose a category"
    }
  }

  return (
    <>
      <Row className="call-to-action">
        <h2>Now, let's upload your creation</h2>
        <p style={{ fontSize: '1.2rem' }}>
          Your file will be uploaded to the decentralized web via Arweave.
          Depending on file type, can take up to 1 minute. Arweave is a new type
          of storage that backs data with sustainable and perpetual endowments,
          allowing users and developers to truly store data forever – for the
          very first time.
        </p>
      </Row>
      <Row className="content-action">
        <h3>{uploadMsg(props.attributes.category)}</h3>
        <Dragger
          style={{ padding: 20 }}
          multiple={false}
          customRequest={info => {
            // dont upload files here, handled outside of the control
            info?.onSuccess?.({}, null as any)
          }}
          fileList={mainFile ? [mainFile] : []}
          onChange={async info => {
            const file = info.file.originFileObj;
            const reader = new FileReader();
            reader.onload = function (event) {
              props.setAttributes({
                ...props.attributes,
                ...(props.attributes.category == MetadataCategory.Audio ? {} : {image: (event.target?.result as string) || ''}),
                files: [(props.attributes.files as File[])[0], file],
              })
              setMainFile(file) // Keep only the last dropped file
            }
            if (file) reader.readAsDataURL(file)
          }}
        >
          <div className="ant-upload-drag-icon">
            <h3 style={{fontWeight: 700}}>Upload your creation</h3>
          </div>
          <p className="ant-upload-text">
            Drag and drop, or click to browse
          </p>
        </Dragger>
      </Row>
      {props.attributes.category == MetadataCategory.Audio &&
        <Row className="content-action">
          <h3>Optionally, you can upload a cover image or video (PNG, JPG, GIF, MP4)</h3>
          <Dragger
            style={{ padding: 20 }}
            multiple={false}
            customRequest={info => {
              // dont upload files here, handled outside of the control
              info?.onSuccess?.({}, null as any)
            }}
            fileList={coverFile ? [coverFile] : []}
            onChange={async info => {
              const file = info.file.originFileObj;
              const reader = new FileReader();
              reader.onload = function (event) {
                props.setAttributes({
                  ...props.attributes,
                  files: [file, (props.attributes.files as File[])[1]],
                  image: (event.target?.result as string) || '',
                })
                setCoverFile(file) // Keep only the last dropped file
              }
              if (file) reader.readAsDataURL(file)
            }}
          >
            <div className="ant-upload-drag-icon">
              <h3 style={{fontWeight: 700}}>Upload your cover image or video</h3>
            </div>
            <p className="ant-upload-text">
              Drag and drop, or click to browse
            </p>
          </Dragger>
        </Row>
      }
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
  attributes: IMetadataExtension;
  setAttributes: (attr: IMetadataExtension) => void;
  confirm: () => void;
}) => {
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
          {props.attributes.image && (
            <ArtCard
              image={props.attributes.image}
              category={props.attributes.category}
              name={props.attributes.name}
              symbol={props.attributes.symbol}
              small={true}
            />
          )}
        </Col>
        <Col className="section" xl={12}>
          <label className="action-field">
            <span className="field-title">Title</span>
            <Input
              autoFocus
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
  attributes: IMetadataExtension;
  setAttributes: (attr: IMetadataExtension) => void;
  confirm: () => void;
}) => {
  const file = props.attributes.image;

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
              image={props.attributes.image}
              category={props.attributes.category}
              name={props.attributes.name}
              symbol={props.attributes.symbol}
              small={true}
            />
          )}
        </Col>
        <Col className="section" xl={12}>
          <label className="action-field">
            <span className="field-title">Royalty Percentage</span>
            <InputNumber
              autoFocus
              min={0}
              max={100}
              placeholder="Between 0 and 100"
              onChange={(val: number) => {
                props.setAttributes({ ...props.attributes, royalty: val });
              }}
              className="royalties-input"
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

const LaunchStep = (props: {
  confirm: () => void;
  attributes: IMetadataExtension;
  connection: Connection;
}) => {
  const files = props.attributes.files || [];
  const metadata = {
    ...(props.attributes as any),
    files: files.map(f => f.name),
  };
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

    getAssetCostToStore([
      ...files,
      new File([JSON.stringify(metadata)], 'metadata.json'),
    ]).then(async lamports => {
      const sol = lamports / LAMPORT_MULTIPLIER;

      // TODO: cache this and batch in one call
      const [mintRent, metadataRent, nameSymbolRent] = await rentCall;

      const uriStr = 'x';
      let uriBuilder = '';
      for (let i = 0; i < MAX_URI_LENGTH; i++) {
        uriBuilder += uriStr;
      }

      const additionalSol =
        (metadataRent + nameSymbolRent + mintRent) / LAMPORT_MULTIPLIER;

      // TODO: add fees based on number of transactions and signers
      setCost(sol + additionalSol);
    });
  }, [...files, setCost]);

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
          {props.attributes.image && (
            <ArtCard
              image={props.attributes.image}
              category={props.attributes.category}
              name={props.attributes.name}
              symbol={props.attributes.symbol}
              small={true}
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
