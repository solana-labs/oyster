import React, { useState } from 'react';
import { ButtonProps, Collapse, Switch, Typography } from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';

import { LABELS } from '../../constants';

import { Redirect } from 'react-router';
import { MintFormItem } from '../../components/MintFormItem/mintFormItem';

import { registerRealm } from '../../actions/registerRealm';

import { ModalFormAction } from '../../components/ModalFormAction/modalFormAction';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getRealmUrl } from '../../tools/routeTools';
import { MintMaxVoteWeightSource } from '../../models/accounts';

import { BigNumber } from 'bignumber.js';

import { BN } from 'bn.js';
import {
  RealmMintSupplyConfigFormItem,
  RealmMintSupplyConfigValues,
} from '../../components/realmMintSupplyConfigFormItem/realmMintSupplyConfigFormItem';
import { RealmMintTokensFormItem } from '../../components/realmMintTokensFormItem/realmMintTokensFormItem';
import { parseMinTokensToCreateProposal } from '../../components/governanceConfigFormItem/governanceConfigFormItem';

const { Panel } = Collapse;
const { Text } = Typography;

const parseMintSupplyFraction = (fraction: string) => {
  if (!fraction) {
    return MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION;
  }

  const fractionValue = new BigNumber(fraction)
    .shiftedBy(MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS)
    .toNumber();

  return new MintMaxVoteWeightSource({
    value: new BN(fractionValue),
  });
};

export function RegisterRealmButton({
  buttonProps,
}: {
  buttonProps: ButtonProps;
}) {
  const [redirectTo, setRedirectTo] = useState('');
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const [councilVisible, setCouncilVisible] = useState(false);

  const [communityMintAddress, setCommunityMintAddress] = useState('');

  const onSubmit = async (
    values: {
      communityMint: string;
      councilMint: string;
      name: string;
      useCouncilMint: boolean;
      mintDecimals: number;
      minTokensToCreateGovernance: number | string;
    } & RealmMintSupplyConfigValues,
  ) => {
    let supplyFraction = parseMintSupplyFraction(
      values.communityMintMaxVoteWeightFraction,
    );

    const minCommunityTokensToCreateGovernance = parseMinTokensToCreateProposal(
      values.minTokensToCreateGovernance,
      values.mintDecimals,
    );

    return await registerRealm(
      rpcContext,
      values.name,
      new PublicKey(values.communityMint),
      values.useCouncilMint ? new PublicKey(values.councilMint) : undefined,
      supplyFraction,
      new BN(minCommunityTokensToCreateGovernance),
    );
  };

  const onComplete = (pk: PublicKey) => {
    setRedirectTo(pk.toBase58());
  };

  const onReset = () => {
    setCouncilVisible(false);
  };

  if (redirectTo) {
    return <Redirect push to={getRealmUrl(redirectTo, programId)} />;
  }

  return (
    <ModalFormAction<PublicKey>
      label="Register Realm"
      buttonProps={buttonProps}
      formTitle="Register Realm"
      formAction="Register"
      formPendingAction="Registering"
      onSubmit={onSubmit}
      onComplete={onComplete}
      onReset={onReset}
      initialValues={{
        useCouncilMint: false,
      }}
    >
      <Form.Item
        name="name"
        label={LABELS.NAME_LABEL}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>

      <MintFormItem
        name="communityMint"
        label={LABELS.COMMUNITY_TOKEN_MINT}
        onChange={mint => setCommunityMintAddress(mint)}
      ></MintFormItem>

      <RealmMintTokensFormItem
        communityMintAddress={communityMintAddress}
      ></RealmMintTokensFormItem>

      <Form.Item
        name="useCouncilMint"
        label={LABELS.USE_COUNCIL_TOKEN}
        valuePropName="checked"
      >
        <Switch onChange={setCouncilVisible} />
      </Form.Item>
      {councilVisible && (
        <MintFormItem
          name="councilMint"
          label={LABELS.COUNCIL_TOKEN_MINT}
          required={councilVisible}
        />
      )}

      <Collapse ghost>
        <Panel
          header={<Text type="secondary">advance settings</Text>}
          key="1"
          className="realm-advance-settings-panel"
        >
          <RealmMintSupplyConfigFormItem
            communityMintAddress={communityMintAddress}
            maxVoteWeightSource={MintMaxVoteWeightSource.FULL_SUPPLY_FRACTION}
          ></RealmMintSupplyConfigFormItem>
        </Panel>
      </Collapse>
    </ModalFormAction>
  );
}
