import { Button, Popover, Space } from 'antd';
import React, { useRef } from 'react';
import { Governance, Realm } from '@solana/governance-sdk';

import { MoreOutlined } from '@ant-design/icons';
import { NewProposalButton } from './newProposalButton';
import { CreateNativeTreasuryButton } from './addNativeTreasuryButton';
import { ProgramAccount } from '@solana/governance-sdk';

export function GovernanceActionBar({
  realm,
  governance,
}: {
  realm: ProgramAccount<Realm> | undefined;
  governance: ProgramAccount<Governance> | undefined;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  if (!realm) {
    return null;
  }

  return (
    <div className="proposals-action-bar">
      <Space>
        <NewProposalButton governance={governance} realm={realm} />
        <div ref={parentRef} className="realm-popup-action-container">
          <Popover
            title="Governance Options"
            placement="bottomRight"
            arrowPointAtCenter
            trigger="click"
            getPopupContainer={() => parentRef.current!}
            content={
              <Space direction="vertical">
                <CreateNativeTreasuryButton
                  realm={realm}
                  governance={governance}
                ></CreateNativeTreasuryButton>
              </Space>
            }
          >
            <Button style={{ paddingLeft: 8, paddingRight: 8 }}>
              <MoreOutlined rotate={90} />
            </Button>
          </Popover>
        </div>
      </Space>
    </div>
  );
}
