import { Form, Input } from 'antd';

import React from 'react';

import { contexts, tryParseKey } from '@oyster/common';
const { useConnection } = contexts.Connection;

export function MintFormItem({
  name,
  label,
  required = true,
}: {
  name: string;
  label: string;
  required?: boolean;
}) {
  const connection = useConnection();
  const { cache } = contexts.Accounts;

  const mintValidator = async (rule: any, value: string) => {
    if (rule.required && !value) {
      throw new Error(`Please provide a ${label}`);
    } else if (!tryParseKey(value)) {
      throw new Error('Provided value is not a valid mint address');
    } else {
      await cache.queryMint(connection, value);
    }
  };

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: required, validator: mintValidator }]}
    >
      <Input allowClear={true} />
    </Form.Item>
  );
}
