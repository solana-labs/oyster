import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { ParsedAccount } from '@oyster/common';
import { Card } from 'antd';
import Meta from 'antd/lib/card/Meta';
import React, { useState } from 'react';
import { TimelockTransaction } from '../../models/timelock';
import './style.less';

export function InstructionCard({
  instruction,
  position,
}: {
  instruction: ParsedAccount<TimelockTransaction>;
  position: number;
}) {
  const [tabKey, setTabKey] = useState('info');

  const contentList: Record<string, JSX.Element> = {
    info: (
      <Meta
        title={'Program: TODO'}
        description={
          <>
            <p>Instruction: TODO</p>
            <p>Slot: {instruction.info.slot.toNumber()}</p>
          </>
        }
      />
    ),
    data: <p className="wordwrap">{instruction.info.instruction}</p>,
  };

  return (
    <Card
      tabList={[
        { key: 'info', tab: 'Info' },
        { key: 'data', tab: 'Data' },
      ]}
      title={'Instruction #' + position}
      activeTabKey={tabKey}
      onTabChange={setTabKey}
      actions={[<EditOutlined key="edit" />, <DeleteOutlined key="delete" />]}
    >
      {contentList[tabKey]}
    </Card>
  );
}
