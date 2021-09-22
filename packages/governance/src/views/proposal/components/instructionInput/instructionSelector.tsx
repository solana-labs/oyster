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
  SplTokenMintTo,
  GovernanceSetRealmConfig,
}

const instructionNames = [
  'upgrade',
  'anchor idl set-buffer',
  'set-governance-config',
  'spl-token transfer',
  'ray-add-liquidity',
  'ray-stake-LP',
  'ray-harvest-LP',
  'spl-token mint-to',
  'set-realm-config',
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
