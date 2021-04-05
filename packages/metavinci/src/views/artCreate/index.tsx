import React, { useState } from 'react';
import { Steps, Row, Button, Upload, Col, Input, } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { ArtCard } from './../../components/ArtCard';
import './styles.less';
import { mintNFT } from '../../models';
import { useConnection, useWallet } from '@oyster/common';

const { Step } = Steps;
const { Dragger } = Upload;

export const ArtCreateView = () => {
  const connection = useConnection();
  const { wallet, connected } = useWallet();
  const [step, setStep] = useState(0);
  const [attributes, setAttributes] = useState({
    files: [],
  });

  // store files
  const mint = () => {
    mintNFT(connection, wallet, attributes.files, attributes);
  };

  return (
    <>
      <Row style={{ paddingTop: 50 }}>
        <Col xl={5}>
          <Steps
            progressDot
            direction="vertical"
            current={step}
            style={{ width: 200, marginLeft: 20, marginRight: 30 }}
          >
            <Step title="Select category" />
            <Step title="Upload creation" />
            <Step title="Add metadata" />
          </Steps>
        </Col>
        <Col xl={19}>
          {step === 0 && <CategoryStep confirm={() => setStep(1)} />}
          {step === 1 && <UploadStep attributes setAttributes={setAttributes} confirm={() => setStep(2)} />}
          {step === 2 && <MintStep confirm={() => mint()} />}
        </Col>
      </Row>
    </>
  );
};

const CategoryStep = (props: { confirm: () => void }) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>What type of artwork are you creating?</h2>
      </Row>
      <Row>
        <Button size="large">Image</Button>
        <Button size="large">Movie</Button>
        <Button size="large">Audio</Button>
      </Row>
      <Row>
        <Button type="primary" size="large" onClick={props.confirm}>
          Continue to Upload
        </Button>
      </Row>
    </>
  );
};

const UploadStep = (props: { attributes: any, setAttributes: (attr: any) => void, confirm: () => void }) => {


  return (
    <>
      <Row className="call-to-action">
        <h2>Now, let's upload your creation</h2>
      </Row>
      <Row>
        <Dragger multiple={false}
          customRequest={(info) => {
            // dont upload files here, handled outside of the control
            info?.onSuccess?.({}, null as any);
          }}
          style={{ padding: 20 }} onChange={(info) => {
          props.setAttributes({
            ...props.attributes,
            files: [
              info.file,
            ],
          });
        }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            Click or drag file to this area to upload
          </p>
        </Dragger>
      </Row>
      <Row>
        <Button type="primary" size="large" onClick={props.confirm}>
          Continue to Mint
        </Button>
      </Row>
    </>
  );
};

const MintStep = (props: { confirm: () => void }) => {
  return (
    <>
      <Row className="call-to-action">
        <h2>Add details about your artwork</h2>
      </Row>
      <Row>
        <Col className="section" xl={12}>
          <Input className="input" placeholder="Title" />
          <Input.TextArea
            className="input textarea"
            placeholder="Description"
          />
        </Col>
        <Col xl={12}>
          <ArtCard />
        </Col>
      </Row>
      <Row>
        <Button type="primary" size="large" onClick={props.confirm}>
          Mint NFT
        </Button>
      </Row>
    </>
  );
};
