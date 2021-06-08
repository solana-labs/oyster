import React from 'react';

import { useWallet, useConnection } from '@oyster/common';
import { Button } from 'antd';

export const DevToolsView = () => {
  const connection = useConnection();
  const wallet = useWallet();

  return (
    <div>
      <GovernanceArtifacts></GovernanceArtifacts>
    </div>
  );
};

const GovernanceArtifacts = () => {
  const onGenerateArtifacts = () => {
    console.log('generating');
  };

  return (
    <div>
      <h2>Governance Artifacts</h2>
      <Button onClick={() => onGenerateArtifacts()}>Generate</Button>
    </div>
  );
};
