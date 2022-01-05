import React from 'react';

import { useRpcContext } from '../../../hooks/useRpcContext';

import { ModalFormAction } from '../../../components/ModalFormAction/modalFormAction';

import { updateProgramMetadata } from '../../../actions/updateProgramMetadata';

export function UpdateProgramMetadataButton() {
  const rpcContext = useRpcContext();

  const onSubmit = async () => {
    await updateProgramMetadata(rpcContext!);
  };

  return (
    <ModalFormAction<void>
      label="Update Program Metadata"
      formTitle="Update Program Metadata"
      formAction="Update"
      formPendingAction="Updating"
      onSubmit={() => onSubmit()}
    >
      <div>Update Program Metadata</div>
    </ModalFormAction>
  );
}
