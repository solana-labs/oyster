import React from 'react';
import { Alert, Button, Space, Typography, Collapse } from 'antd';
import { FallbackProps } from 'react-error-boundary';

const { Text } = Typography;
const { Panel } = Collapse;

export function AppErrorBanner({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <Alert
      type="error"
      banner
      message={
        <Space direction="vertical">
          <Text>Sorry, something went wrong.</Text>
          <Text type="warning">{error.message}</Text>
        </Space>
      }
      description={
        <Collapse>
          <Panel header="error details" key="1">
            <pre>{error.stack}</pre>
          </Panel>
        </Collapse>
      }
      closable
      action={
        <Button onClick={resetErrorBoundary} size="small">
          try again
        </Button>
      }
    ></Alert>
  );
}
