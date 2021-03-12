import React from 'react';
import { GithubOutlined, TwitterOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
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
      >
        <Link to={'https://github.com/solana-labs/oyster'}></Link>
      </Button>
      <Button shape={'circle'} icon={<TwitterOutlined />}>
        <Link to={'https://twitter.com/solana'}></Link>
      </Button>
    </div>
  );
};
