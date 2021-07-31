import React, { useState } from 'react';
import {
  ButtonProps,
  Collapse,
  InputNumber,
  Space,
  Switch,
  Typography,
} from 'antd';
import { Form, Input } from 'antd';
import { PublicKey } from '@solana/web3.js';
import { contexts } from '@oyster/common';

import { LABELS } from '../../constants';

import { Redirect } from 'react-router';
import { MintFormItem } from '../../components/MintFormItem/mintFormItem';

import { registerRealm } from '../../actions/registerRealm';

import { ModalFormAction } from '../../components/ModalFormAction/modalFormAction';
import { useRpcContext } from '../../hooks/useRpcContext';
import { getRealmUrl } from '../../tools/routeTools';
import { MintMaxVoteWeightSource } from '../../models/accounts';

import { BigNumber } from 'bignumber.js';
import { MintInfo } from '@solana/spl-token';
import { BN } from 'bn.js';

const { Panel } = Collapse;
const { Text } = Typography;
const { useMint } = contexts.Accounts;

const getMinSupplyFractionStep = () =>
  new BigNumber(1)
    .shiftedBy(-1 * MintMaxVoteWeightSource.SUPPLY_FRACTION_DECIMALS)
    .toNumber();

const formatMintSupplyFraction = (mint: MintInfo, fraction: number) => {
  return new BigNumber(fraction)
    .multipliedBy(mint.supply.toString())
    .shiftedBy(-mint.decimals)
    .toFormat(mint.decimals);
};

const formatMintSupplyPercentage = (fraction: number) => {
  const percentage = new BigNumber(fraction).shiftedBy(2).toNumber();

  if (percentage < 0.01) {
    return '<0.01%';
  }

  const rounded = +percentage.toFixed(2);
  return rounded === percentage ? `${rounded}%` : `~${rounded}%`;
};

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

export function RegisterRealm({ buttonProps }: { buttonProps: ButtonProps }) {
  const [redirectTo, setRedirectTo] = useState('');
  const rpcContext = useRpcContext();
  const { programId } = rpcContext;

  const [councilVisible, setCouncilVisible] = useState(false);
  const [supplyFraction, setSupplyFraction] = useState<number | undefined>(1);

  const [communityMintAddress, setCommunityMintAddress] = useState('');
  const communityMint = useMint(communityMintAddress);

  const onSubmit = async (values: {
    communityMint: string;
    councilMint: string;
    name: string;
    useCouncilMint: boolean;
    communityMintMaxVoteWeightFraction: string;
  }) => {
    let supplyFraction = parseMintSupplyFraction(
      values.communityMintMaxVoteWeightFraction,
    );

    return await registerRealm(
      rpcContext,
      values.name,
      new PublicKey(values.communityMint),
      values.useCouncilMint ? new PublicKey(values.councilMint) : undefined,
      supplyFraction,
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

  const onSupplyFractionChange = (fraction: number | string) => {
    let floatFraction;

    if (typeof fraction === 'string') {
      floatFraction = parseFloat(fraction);
    } else {
      floatFraction = fraction;
    }

    setSupplyFraction(floatFraction || undefined);
  };

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
        communityMintMaxVoteWeightFraction: supplyFraction,
      }}
      isWalletRequired={false}
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
          header="advance settings"
          key="1"
          className="realm-advance-settings-panel"
        >
          <Form.Item label="community mint supply factor (max vote weight)">
            <Space align="end">
              <Form.Item
                rules={[{ required: true }]}
                noStyle
                name="communityMintMaxVoteWeightFraction"
                initialValue={supplyFraction}
                label="mint supply factor"
              >
                <InputNumber
                  min={getMinSupplyFractionStep()}
                  max={1}
                  step={getMinSupplyFractionStep()}
                  onChange={onSupplyFractionChange}
                  style={{ width: 150 }}
                  stringMode={true}
                />
              </Form.Item>

              {supplyFraction && (
                <Text type="secondary">
                  {`${
                    communityMint
                      ? formatMintSupplyFraction(communityMint, supplyFraction)
                      : ''
                  } (${formatMintSupplyPercentage(supplyFraction)})`}
                </Text>
              )}
            </Space>
          </Form.Item>
        </Panel>
      </Collapse>
    </ModalFormAction>
  );
}
