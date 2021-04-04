import React, { useState } from 'react';
import { Steps, Row, Button, Upload, Col, Input } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { ArtCard } from './../../components/ArtCard';
import './styles.less';

const { Step } = Steps;
const { Dragger } = Upload;


export const ArtCreateView = () => {
  const [step, setStep] = useState(0);
  const [attributes, setAttributes] = useState({

  })

  const mint = () => {
    alert('Minting NFT');
  };

  return (
    <>
      <Row>
        <Steps progressDot current={step} style={{ width: 200 }}>
          <Step title="Category" />
          <Step title="Upload" />
          <Step title="Mint" />
        </Steps>
      </Row>
      {step === 0 && <CategoryStep confirm={() => setStep(1)} />}
      {step === 1 && <UploadStep confirm={() => setStep(2)} />}
      {step === 2 && <MintStep confirm={() => mint()} />}
    </>
  );
};

const CategoryStep = (props: { confirm: () => void }) => {
  return (<>
    <Row>
      <h2>Select what type of NFT artwork you’re creating</h2>
    </Row>
    <Row>
      <Button size="large">Image</Button>
      <Button size="large">Movie</Button>
      <Button size="large">Audio</Button>
    </Row>
    <Row>
      <Button type="primary" size="large" onClick={props.confirm}>Continue to Upload</Button>
    </Row>
  </>);
};

const UploadStep = (props: { confirm: () => void }) => {
  return (<>
    <Row>
      <h2>Add an image or video loop to your NFT</h2>
    </Row>
    <Row>
      <Dragger {...props} style={{ padding: 20 }}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag file to this area to upload</p>
      </Dragger>
    </Row>
    <Row>
      <Button type="primary" size="large" onClick={props.confirm}>Continue to Mint</Button>
    </Row>
  </>);
}

const MintStep = (props: { confirm: () => void }) => {
  return (<>
    <Row>
      <h2>Add details about your artwork</h2>
    </Row>
    <Row>
      <Col className="section" xl={12}>
        <Input className="input" placeholder="Title" />
        <Input.TextArea className="input textarea" placeholder="Description" />
      </Col>
      <Col xl={12}>
        <ArtCard />
      </Col>
    </Row>
    <Row>
      <Button type="primary" size="large" onClick={props.confirm}>Mint NFT</Button>
    </Row>
  </>);
}
