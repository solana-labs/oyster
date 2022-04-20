import { Button, Popover, Space } from 'antd';
import React, { useRef } from 'react';

import { MoreOutlined } from '@ant-design/icons';
import { UpdateProgramMetadataButton } from './updateProgramMetadataButton';

export function ProgramActionBar() {
  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="proposals-action-bar">
      <Space>
        <div ref={parentRef} className="realm-popup-action-container">
          <Popover
            title="Program Options"
            placement="bottomRight"
            arrowPointAtCenter
            trigger="click"
            getPopupContainer={() => parentRef.current!}
            content={
              <Space direction="vertical">
                <UpdateProgramMetadataButton></UpdateProgramMetadataButton>
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
