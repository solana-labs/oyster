import { Form, Input } from 'antd';

import React from 'react';

import { contexts, MintParser, tryParseKey } from '@oyster/common';
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

  const mintValidator = async (rule: any, value: string) => {
    if (rule.required && !value) {
      throw new Error(`Please provide a ${label}`);
    } else {
      const pubkey = tryParseKey(value);

      if (!pubkey) {
        throw new Error('Provided value is not a valid mint address');
      }

      // Note: Do not use the accounts cache here to always get most recent result
      await connection.getAccountInfo(pubkey).then(data => {
        if (!data) {
          throw new Error('Account not found');
        }

        try {
          MintParser(pubkey, data);
        } catch {
          throw new Error('Account is not a valid mint');
        }
      });
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
