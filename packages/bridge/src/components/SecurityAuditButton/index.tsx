import React from 'react';
import { Button } from 'antd';

import './index.less';

export const SecurityAuditButton = () => {
  return (
    <Button className={'audit-button'}
            onClick={() => window.open('https://github.com/certusone/wormhole', '_blank')}>
      Security Audit
    </Button>
  );
};
