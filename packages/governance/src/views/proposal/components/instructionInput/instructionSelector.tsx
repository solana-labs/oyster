import { Form, Radio } from 'antd';
import React from 'react';

export enum InstructionType {
  UpgradeProgram,
  AnchorIDLSetBuffer,
  GovernanceSetConfig,
  SplTokenTransfer,
  RaydiumAddLiquidity,
  RaydiumStakeLP,
  RaydiumHarvestLP,
  RaydiumStakeRAY,
  RaydiumHarvestRAY,
  SplTokenMintTo,
  SetRealmConfig,
  SetRealmAuthority,
  VoterStakeCreateRegistrar,
  VoterStakeConfigureMint,
  NativeTransfer,
}

const instructionNames = [
  'upgrade',
  'anchor idl set-buffer',
  'set-governance-config',
  'spl-token transfer',
  'ray-add-liquidity',
  'ray-stake-LP',
  'ray-harvest-LP',
  'ray-stake-RAY',
  'ray-harvest-RAY',
  'spl-token mint-to',
  'set-realm-config',
  'set-realm-authority',
  'voter-stake create-registrar',
  'voter-stake config-mint',
  'SOL-transfer',
];

export function InstructionSelector({
  instructions,
  onChange,
}: {
  instructions: InstructionType[];
  onChange: (instruction: InstructionType) => void;
}) {
  return (
    <Form.Item name="instructionType" label="instruction">
      <Radio.Group onChange={e => onChange(e.target.value)}>
        {instructions.map(i => (
          <Radio.Button value={i} key={i}>
            {instructionNames[i]}
          </Radio.Button>
        ))}
      </Radio.Group>
    </Form.Item>
  );
}
