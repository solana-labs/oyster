import { Button, Col, Modal, Radio, Row, Space } from 'antd';
import React, { useState } from 'react';
import { ProgramAccount, Realm } from '@solana/spl-governance';
import { hooks } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { withdrawGoverningTokens } from '../../../actions/withdrawGoverningTokens';
import { LABELS } from '../../../constants';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { useVestingProgramId } from '../../../hooks/useVestingProgramId';
import {useVoterWeightRecord, useWalletTokenOwnerRecord} from '../../../hooks/apiHooks';
import { useMintFormatter } from '../../../hooks/useMintFormatter';
import { useDepositedAccountsContext } from '../../../components/RealmDepositBadge/realmDepositProvider';

const { useAccountByMint } = hooks;

export function WithdrawGoverningTokensButton(props: {
  realm: ProgramAccount<Realm>;
  governingTokenMint?: PublicKey;
  tokenName?: string;
}) {
  const { realm, governingTokenMint, tokenName } = props;
  const rpcContext = useRpcContext();
  const vestingProgramId = useVestingProgramId(realm);
  const governingTokenAccount = useAccountByMint(governingTokenMint);
  const { formatValue } = useMintFormatter(governingTokenMint);
  const { voterWeight, maxVoterWeight } = useVoterWeightRecord(realm);
  const { depositedAccounts } = useDepositedAccountsContext();
  const [depositToWithdraw, setDepositToWithdraw] = useState(() => {
    return depositedAccounts?.length ? depositedAccounts[0] : null;
  });
  const [isConfirmationVisible, setConfirmationVisible] = useState(false);

  const tokenOwnerRecord = useWalletTokenOwnerRecord(
    realm?.pubkey,
    governingTokenMint
  );

  if (!governingTokenMint || !depositedAccounts?.length) {
    return null;
  }

  const isVisible = governingTokenAccount && depositedAccounts.length;

  const onSubmit = async () => {
    if (governingTokenAccount && depositToWithdraw) {
      try {
        await withdrawGoverningTokens(
          rpcContext,
          realm!.pubkey,
          governingTokenAccount.pubkey,
          governingTokenMint,
          vestingProgramId,
          voterWeight!.pubkey,
          maxVoterWeight!.pubkey,
          depositToWithdraw!.pubkey,
          depositToWithdraw!.address
        );
        setDepositToWithdraw(null);
        //Should clear previous state
        setConfirmationVisible(false);
      } catch (e) {
        e.code !== 4001 && Modal.error({
          title: 'Cannot withdraw tokens',
          content: `Probably you have tokens staked in proposals (including draft proposals, active proposals etc).
              Please, release your tokens from all proposals before withdrawing the tokens from the realm`
        });
      }
    }
  };

  const onSetDeposit = (e: any) => {
    setDepositToWithdraw(depositedAccounts?.find(d => d.label === e.target.value) || null);
  };

  const onWithdraw = () => {
    // TODO: add check for vote-locked deposits
    if (tokenOwnerRecord && tokenOwnerRecord.account?.unrelinquishedVotesCount > 0) {
      Modal.error({
        title: 'Can\'t withdraw tokens',
        content: `You have tokens staked in ${tokenOwnerRecord?.account?.unrelinquishedVotesCount} proposal(s).
        Please release your tokens from the proposals before withdrawing the tokens from the realm.`
      });
      return;
    }
    setConfirmationVisible(true);
  };

  return isVisible ? <>
    <Button type='ghost' onClick={onWithdraw}>{LABELS.WITHDRAW_TOKENS(tokenName)}</Button>
    <Modal visible={isConfirmationVisible} title={LABELS.WITHDRAW_TOKENS(tokenName)} cancelText={LABELS.CANCEL}
           onCancel={() => setConfirmationVisible(false)} okText={LABELS.WITHDRAW} onOk={onSubmit}
           okButtonProps={{disabled: !depositToWithdraw}}
           destroyOnClose>
      <Row>
        <Col span={24}>
          <p>{LABELS.WITHDRAW_TOKENS_QUESTION}</p>
          {depositedAccounts?.length >= 1 && <>
            <p>Select a deposit to withdraw from:</p>
            <Radio.Group onChange={onSetDeposit} value={depositToWithdraw?.label}>
              <Space direction='vertical'>{
                depositedAccounts.map(d => <Radio value={d.label} key={d.label}>
                  {d.label}<br />Amount: {formatValue(d.balance)}
                </Radio>)
              }</Space>
            </Radio.Group>
          </>}
        </Col>
      </Row>
    </Modal>
  </> : null;
}
