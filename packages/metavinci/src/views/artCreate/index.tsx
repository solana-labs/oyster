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

  const [step, setStep] = useState<number>(0);
  const [saving, setSaving] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
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
    }
    setSaving(true)
    const inte = setInterval(() => setProgress(prog => prog + 1), 600)
    // Update progress inside mintNFT
    await mintNFT(connection, wallet, env, (attributes?.files || []), metadata)
    clearInterval(inte)
  }

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
            <Step title="Category" />
            <Step title="Upload" />
            <Step title="Info" />
            <Step title="Royalties" />
            <Step title="Launch" />
          </Steps>
        </Col>}
        <Col {...(saving ? { xl: 24 } : { xl: 16 })}>
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
              confirm={() => gotoStep(5)}
              connection={connection}
            />
          )}
          {step === 5 && (
            <WaitingStep
              mint={mint}
              progress={progress}
              confirm={() => gotoStep(6)}
            />
          )}
          {step === 6 && (
            <Congrats />
          )}
          {(0 < step && step < 5) && <Button onClick={() => gotoStep(step - 1)}>Back</Button>}
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
  const [mainFile, setMainFile] = useState<any>()
  const [coverFile, setCoverFile] = useState<any>()
  const [image, setImage] = useState<string>("")

  useEffect(() => {
    props.setAttributes({
      ...props.attributes,
      files: []
    })
  }, [])

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
            if (file) setMainFile(file)
            if (props.attributes.category != MetadataCategory.Audio) {
              const reader = new FileReader();
              reader.onload = function (event) {
                setImage((event.target?.result as string) || '')
              }
              if (file) reader.readAsDataURL(file)
            }
          }}
        >
          <div className="ant-upload-drag-icon">
            <h3 style={{ fontWeight: 700 }}>Upload your creation</h3>
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
              if (file) setCoverFile(file)
              if (props.attributes.category == MetadataCategory.Audio) {
                const reader = new FileReader();
                reader.onload = function (event) {
                  setImage((event.target?.result as string) || '')
                }
                if (file) reader.readAsDataURL(file)
              }
            }}
          >
            <div className="ant-upload-drag-icon">
              <h3 style={{ fontWeight: 700 }}>Upload your cover image or video</h3>
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
          onClick={() => {
            props.setAttributes({
              ...props.attributes,
              files: [mainFile, coverFile].filter(f => f),
              image,
            })
            props.confirm()
          }}
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
    files: files.map(f => f?.name),
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

const WaitingStep = (props: {
  mint: Function,
  progress: number,
  confirm: Function,
}) => {

  useEffect(() => {
    const func = async () => {
      await props.mint()
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
        Your creation is being uploaded to the decentralized web...
      </div>
      <div className="waiting-subtitle">This can take up to 1 minute.</div>
    </div>
  )
}

const Congrats = () => {
  return <>
    <div style={{ marginTop: 70 }}>
      <div className="waiting-title">
        Congratulations! Your creation is now live.
      </div>
      <div className="congrats-button-container">
        <Button className="congrats-button"><span>Share it on Twitter</span><span>&gt;</span></Button>
        <Button className="congrats-button"><span>See it in your collection</span><span>&gt;</span></Button>
        <Button className="congrats-button"><span>Sell it via auction</span><span>&gt;</span></Button>
      </div>
    </div>
    <Conffeti />
  </>
}

interface Particle {
  top: number,
  left: number,
  speed: number,
  angle: number,
  angle_speed: number,
  size: number,
}

const Conffeti = () => {
  const [particles, setParticles] = useState<Array<Particle>>(Array.from({ length: 30 }).map(_ => ({
    top: -Math.random() * 100,
    left: Math.random() * 100,
    speed: Math.random() * 1 + 3,
    angle: 0,
    angle_speed: Math.random() * 10 + 5,
    size: Math.floor(Math.random() * 8 + 12),
  })))

  useEffect(() => {
    setInterval(() => {
      setParticles(parts => parts.map(part => ({
        ...part,
        top: (part.top > 130 ? -30 : part.top + part.speed),
        angle: (part.angle > 360 ? 0 : part.angle + part.angle_speed),
      })))
    }, 40)
  }, [])

  const getStyle = (particle: Particle) => ({
    top: `${particle.top}%`,
    left: `${particle.left}%`,
    transform: `rotate(${particle.angle}deg)`,
    width: particle.size,
    height: particle.size,
  })

  return <div>
    {particles.map((particle, idx) => <span key={idx} className="particle" style={getStyle(particle)}></span>)}
  </div>
}
