import { ParsedAccount } from '@oyster/common';

import React from 'react';
import { Realm } from '../../../models/accounts';

import { PublicKey } from '@solana/web3.js';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';
import { AccountFormItem } from '../../../components/AccountFormItem/accountFormItem';
import { setRealmAuthority } from '../../../actions/setRealmAuthority';

export function SetRealmAuthorityButton({
  realm,
}: {
  realm: ParsedAccount<Realm>;
}) {
  const rpcContext = useRpcContext();

  const onSubmit = async (values: { newAuthority: string }) => {
    const newAuthority = new PublicKey(values.newAuthority);

    await setRealmAuthority(rpcContext, realm, newAuthority);

    return newAuthority;
  };

  return (
    <ModalFormAction<PublicKey>
      label="Set Realm Authority"
      formTitle="Set Realm Authority"
      formAction="Set Authority"
      formPendingAction="Setting Authority"
      onSubmit={onSubmit}
      initialValues={{ useCouncilMint: false }}
    >
      <AccountFormItem
        name="newAuthority"
        label="new authority"
      ></AccountFormItem>
    </ModalFormAction>
  );
}
