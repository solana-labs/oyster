import React from 'react';

import './index.less';
import { AssetsTable } from '../../components/AssetsTable';

export const ProofOfAssetsView = () => {
  return (
    <div
      className="flexColumn transfer-bg"
      style={{ flex: 1, minHeight: '90vh' }}
    >
      <AssetsTable />
    </div>
  );
};
