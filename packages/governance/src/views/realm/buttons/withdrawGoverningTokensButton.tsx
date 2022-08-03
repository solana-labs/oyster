import { Button, Col, Modal, Row } from 'antd';
import React from 'react';
import { ProgramAccount, Realm } from '@solana/spl-governance';
import { LABELS } from '../../../constants';
import { hooks } from '@oyster/common';
import { ExclamationCircleOutlined } from '@ant-design/icons';

import {
  withdrawGoverningTokens,
} from '../../../actions/withdrawGoverningTokens';

import { PublicKey } from '@solana/web3.js';
import { useRpcContext } from '../../../hooks/useRpcContext';
import { useVestingProgramId } from '../../../hooks/useVestingProgramId';
import { useDepositedAccounts } from '../../../hooks/useDepositedAccounts';
import { useVoterWeightRecord } from '../../../hooks/apiHooks';

const { useAccountByMint } = hooks;

const { confirm } = Modal;

export function WithdrawGoverningTokensButton ({
  realm,
  governingTokenMint,
  tokenName,
}: {
  realm: ProgramAccount<Realm>;
  governingTokenMint?: PublicKey;
  tokenName?: string;
}) {
  const rpcContext = useRpcContext();
  const governingTokenAccount = useAccountByMint(governingTokenMint);
  const vestingProgramId = useVestingProgramId(realm);
  const voterWeightRecord = useVoterWeightRecord(realm);
  let ownerPubkey = rpcContext.wallet?.publicKey || undefined;
  const activeDeposits = useDepositedAccounts(
    rpcContext, vestingProgramId, ownerPubkey,
    governingTokenMint,
  );

  if (!governingTokenMint || !activeDeposits) {
    return null;
  }

  const isVisible = activeDeposits.length;
  const depositToWithdraw = activeDeposits.length
    ? activeDeposits[activeDeposits.length - 1] : null;

  return isVisible ? (
    <Button
      type="ghost"
      onClick={() => {
        /* // TODO: add check for vote-locked deposits
        if (tokenOwnerRecord.account.unrelinquishedVotesCount > 0) {
          error({
            title: 'Can\'t withdraw tokens',
            content: `You have tokens staked in ${tokenOwnerRecord.account.unrelinquishedVotesCount} proposal(s). Please release your tokens from the proposals before withdrawing the tokens from the realm.`,
          });
          return;
        }
        */
        confirm({
          title: LABELS.WITHDRAW_TOKENS,
          icon: <ExclamationCircleOutlined />,
          content: (
            <Row>
              <Col span={24}>
                <p>{LABELS.WITHDRAW_TOKENS_QUESTION}</p>
                {activeDeposits?.length > 1 &&
                  <>
                    <p>There is total {activeDeposits?.length} deposits:</p>
                    <p>{activeDeposits.map(d =>
                      <span key={d.pubkey.toString()}>
                        <code>{d.pubkey.toBase58()} of value {d.balance.toString()}</code><br />
                      </span>,
                    )}</p>
                    <p>
                      Now withdrawing deposit:<br />
                      <code>{depositToWithdraw!.pubkey.toBase58()}</code>
                    </p>
                  </>
                }
              </Col>
            </Row>
          ),
          okText: LABELS.WITHDRAW,
          cancelText: LABELS.CANCEL,
          onOk: async () => {
            if (governingTokenAccount) {
              // TODO: after successful withdraw reload list of deposited accounts
              await withdrawGoverningTokens(
                rpcContext,
                realm!.pubkey,
                governingTokenAccount.pubkey,
                governingTokenMint,
                vestingProgramId,
                voterWeightRecord!.voterWeight.pubkey,
                voterWeightRecord!.maxVoterWeight.pubkey,
                depositToWithdraw!.pubkey,
                depositToWithdraw!.address,
              );
            }
          },
        });
      }}
    >
      {LABELS.WITHDRAW_TOKENS(tokenName)}
    </Button>
  ) : null;
}
