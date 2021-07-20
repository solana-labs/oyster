import { Form, Input } from 'antd';

import React from 'react';

import { contexts, tryParseKey } from '@oyster/common';
import { AccountInfo, ParsedAccountData } from '@solana/web3.js';

const { useConnection } = contexts.Connection;

export function AccountFormItem({
  name,
  label,
  required = true,
  accountInfoValidator,
}: {
  name: string;
  label: string;
  required?: boolean;
  accountInfoValidator?: (
    account: AccountInfo<Buffer | ParsedAccountData>,
  ) => void;
}) {
  const connection = useConnection();

  const accountValidator = async (rule: any, value: string) => {
    if (rule.required && !value) {
      throw new Error(`Please provide ${label}`);
    } else {
      const pubkey = tryParseKey(value);

      if (!pubkey) {
        throw new Error('Provided value is not a valid account address');
      }

      // Note: Do not use the accounts cache here to always get most recent result
      await connection.getParsedAccountInfo(pubkey).then(data => {
        if (!data || !data.value) {
          throw new Error('Account not found');
        }

        if (accountInfoValidator) {
          accountInfoValidator(data.value);
        }
      });
    }
  };

  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: required, validator: accountValidator }]}
    >
      <Input allowClear={true} />
    </Form.Item>
  );
}
