import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'antd';

import './index.less';

export const SecurityAuditButton = () => {
  return (
    <Button className={'audit-button'}>
      <Link to={'https://github.com/certusone/wormhole'}>Security Audit</Link>
    </Button>
  );
};
