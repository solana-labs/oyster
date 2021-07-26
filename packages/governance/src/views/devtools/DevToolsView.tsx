import React, { useState } from 'react';

import { useWallet, useConnection } from '@oyster/common';
import { Button } from 'antd';
import { generateGovernanceArtifacts } from '../../actions/devtools/generateGovernanceArtifacts';
import './style.less';
// import { ControlTestBench } from './controlTests';

export const DevToolsView = () => {
  return (
    <div>
      <GovernanceArtifacts></GovernanceArtifacts>
    </div>
  );
};

const GovernanceArtifacts = () => {
  const connection = useConnection();
  const { wallet, connected } = useWallet();

  const [realmName, setRealmName] = useState('');
  const [communityMint, setCommunityMint] = useState('');
  const [councilMint, setCouncilMint] = useState('');
  const [tokenGovernance, setTokenGovernance] = useState({
    tokenAccountAddress: '',
    beneficiaryTokenAccountAddress: '',
  });

  const [generated, setGenerated] = useState(false);

  const onGenerateArtifacts = async () => {
    setGenerated(false);

    const {
      communityMintAddress,
      councilMintAddress,
      realmName,
      tokenGovernance,
    } = await generateGovernanceArtifacts(connection, wallet);

    setCommunityMint(communityMintAddress.toBase58());
    setCouncilMint(councilMintAddress.toBase58());
    setRealmName(realmName);
    setTokenGovernance(tokenGovernance);

    setGenerated(true);
  };

  return (
    <div>
      <h2>Governance Artifacts</h2>
      <Button onClick={() => onGenerateArtifacts()} disabled={!connected}>
        Generate
      </Button>
      {generated && (
        <>
          <div>
            <h3>realm name: </h3>
            <div className="test-data">{realmName}</div>
          </div>

          <div>
            <h3>community mint / governed account: </h3>
            <div className="test-data">{communityMint}</div>
          </div>

          <div>
            <h3>council mint: </h3>
            <div className="test-data">{councilMint}</div>
          </div>

          <div>
            <h3>token governance - token account: </h3>
            <div className="test-data">
              {tokenGovernance.tokenAccountAddress}
            </div>
          </div>
          <div>
            <h3>token governance - beneficiary token account: </h3>
            <div className="test-data">
              {tokenGovernance.beneficiaryTokenAccountAddress}
            </div>
          </div>
        </>
      )}
      <div>{/* <ControlTestBench></ControlTestBench> */}</div>
    </div>
  );
};
