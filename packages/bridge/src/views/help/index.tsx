import React from 'react';
import { Row, Col, Button } from 'antd';

import './index.less';

export const HelpView = () => {
  return (
    <div
      className="flexColumn transfer-bg"
      style={{ flex: 1, minHeight: '90vh', paddingTop: '100px' }}
    >
      <div className={'description-container'}>
        <Row>
          <Col xs={24} sm={12}>
            <div className={'q-title'}>How does Wormhole Work?</div>
            <p className={'q-description'}>
              Wormhole allows existing projects, platforms, and communities to
              move tokenized assets seamlessly across blockchains to benefit
              from Solana’s high speed and low cost. Wormhole does this by
              wrapping ERC-20 tokens, which are then usable in Solana’s low-cost
              defi ecosystem.
            </p>
          </Col>
          <Col xs={24} sm={12}>
            <div className={'main-logo'}>
              <img src={'/help/overview.svg'} />
            </div>
          </Col>
        </Row>
        <Row>
          <Col xs={24} sm={12}>
            <Button
              className="action-button"
              onClick={() =>
                window.open('https://github.com/solana-labs/oyster', '_blank')
              }
            >
              View the Code
            </Button>
          </Col>
          <Col xs={24} sm={12}>
            <div className={'q-title'}>
              How can I integrate Wormhole into my wallet or dapp?
            </div>
            <p className={'q-description'}>
              Wormhole is an open-source project accessible to all.
            </p>
          </Col>
        </Row>
      </div>
    </div>
  );
};
