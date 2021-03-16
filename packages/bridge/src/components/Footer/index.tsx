import React from 'react';
import { GithubOutlined, TwitterOutlined } from '@ant-design/icons';
import { SecurityAuditButton } from '../SecurityAuditButton';
import { Button } from 'antd';

import './index.less';

export const Footer = () => {
  return (
    <div className={'footer'}>
      <SecurityAuditButton />
      <Button
        shape={'circle'}
        icon={<GithubOutlined />}
        style={{ marginRight: '20px' }}
        onClick={() => window.open('https://github.com/solana-labs/oyster', '_blank')}
      >
      </Button>
      <Button shape={'circle'}
              icon={<TwitterOutlined />}
              onClick={() => window.open('https://twitter.com/solana', '_blank')}>
      </Button>
    </div>
  );
};
