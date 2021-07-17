import { Form, Radio } from 'antd';
import React from 'react';

export enum InstructionType {
  UpgradeProgram,
  AnchorIDLSetBuffer,
  GovernanceSetConfig,
  SplTokenTransfer,
  SplTokenMintTo,
}

const instructionNames = [
  'upgrade',
  'anchor idl set-buffer',
  'governance set-config',
  'spl-token transfer',
  'spl-token mint-to',
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
