import { Button, Col, Modal, Radio, Row, Space } from 'antd';
import React, { useState } from 'react';
import { ProgramAccount, Realm } from '@solana/spl-governance';
import { hooks } from '@oyster/common';
import { PublicKey } from '@solana/web3.js';
import { withdrawGoverningTokens } from '../../../actions/withdrawGoverningTokens';
import { LABELS } from '../../../constants';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { useVestingProgramId } from '../../../hooks/useVestingProgramId';
import { useDepositedAccounts } from '../../../hooks/useDepositedAccounts';
import { useVoterWeightRecord } from '../../../hooks/apiHooks';
import { useMintFormatter } from '../../../hooks/useMintFormatter';

const { useAccountByMint } = hooks;

export function WithdrawGoverningTokensButton(props: {
  realm: ProgramAccount<Realm>;
  governingTokenMint?: PublicKey;
  tokenName?: string;
}) {
  const { realm, governingTokenMint, tokenName } = props;
  const rpcContext = useRpcContext();
  const governingTokenAccount = useAccountByMint(governingTokenMint);
  const { formatValue } = useMintFormatter(governingTokenMint);
  const vestingProgramId = useVestingProgramId(realm);
  const { voterWeight, maxVoterWeight } = useVoterWeightRecord(realm);
  let ownerPubkey = rpcContext.wallet?.publicKey || undefined;
  const activeDeposits = useDepositedAccounts(
    rpcContext, vestingProgramId, ownerPubkey,
    governingTokenMint
  );
  const [depositToWithdraw, setDepositToWithdraw] = useState(() => {
    return activeDeposits && activeDeposits.length ? activeDeposits[activeDeposits.length - 1] : null;
  });
  const [isConfirmationVisible, setConfirmationVisible] = useState(false);

  if (!governingTokenMint || !activeDeposits) {
    return null;
  }

  const isVisible = governingTokenAccount && activeDeposits.length;

  return isVisible ? <>
    <Button
      type='ghost'
      onClick={() => {
        setConfirmationVisible(true);
        /* // TODO: add check for vote-locked deposits
        if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0) {
          error({
            title: 'Can\'t withdraw tokens',
            content: `You have tokens staked in ${tokenOwnerRecord.account.unrelinquishedVotesCount} proposal(s). Please release your tokens from the proposals before withdrawing the tokens from the realm.`,
          });
          return;
        }
        */
      }}>
      {LABELS.WITHDRAW_TOKENS(tokenName)}
    </Button>
    <Modal
      visible={isConfirmationVisible}
      title={LABELS.WITHDRAW_TOKENS(tokenName)}
      destroyOnClose
      cancelText={LABELS.CANCEL}
      onCancel={() => setConfirmationVisible(false)}
      okText={LABELS.WITHDRAW}
      onOk={async () => {
        if (governingTokenAccount && depositToWithdraw) {
          // TODO: after successful withdraw reload list of deposited accounts
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
            setConfirmationVisible(false);
          } catch (e) {
            e.code !== 4001 && Modal.error({
              title: 'Cannot withdraw tokens',
              content: `Probably you have tokens staked in proposals (including draft proposals, active proposals etc).
              Please, release your tokens from all proposals before withdrawing the tokens from the realm`
            });
            // rejection = noop
          }
        }
      }}
    >
      <Row>
        <Col span={24}>
          <p>{LABELS.WITHDRAW_TOKENS_QUESTION}</p>
          {activeDeposits?.length >= 1 && <>
            <p>Select a deposit to withdraw from:</p>
            <Radio.Group
              onChange={(e) => {
                setDepositToWithdraw(activeDeposits.find(d => d.label === e.target.value) || null);
              }}
              value={depositToWithdraw?.label}
            >
              <Space direction='vertical'>{
                activeDeposits.map(d =>
                  <Radio value={d.label} key={d.label}>
                    {d.label}<br />Amount: {formatValue(d.balance)}
                  </Radio>
                )
              }</Space>
            </Radio.Group>
          </>}
        </Col>
      </Row>
    </Modal>
  </> : null;
}
