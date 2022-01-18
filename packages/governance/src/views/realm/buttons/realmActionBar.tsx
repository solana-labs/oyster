import { Button, Popover, Space } from 'antd';
import React, { useRef } from 'react';
import { Realm } from '@solana/spl-governance';
import { DepositGoverningTokensButton } from './depositGoverningTokensButton';
import { RegisterGovernanceButton } from './registerGovernanceButton';
import { SetRealmAuthorityButton } from './setRealmAuthorityButton';
import { WithdrawGoverningTokensButton } from './withdrawGoverningTokensButton';
import { useWallet } from '@oyster/common';
import { MoreOutlined } from '@ant-design/icons';
import { CreateTreasuryAccountButton } from './createTreasuryAccountButton';
import { ProgramAccount } from '@solana/spl-governance';
import { ConfigureVoterStakeRegistryButton } from './configureVoterStakeRegistryButton';

export function RealmActionBar({
  realm,
  showSettings = true,
}: {
  realm: ProgramAccount<Realm> | undefined;
  showSettings?: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { publicKey, connected } = useWallet();

  if (!realm) {
    return null;
  }

  const showCreateNewGovernance = connected;

  const showSetRealmAuthority =
    realm.account.authority?.toBase58() === publicKey?.toBase58();

  const settingsVisible =
    showSettings && (showCreateNewGovernance || showSetRealmAuthority);
  const useCommunityVoterWeightAddin =
    realm.account.config.useCommunityVoterWeightAddin;
  return (
    <Space>
      <DepositGoverningTokensButton
        realm={realm}
        governingTokenMint={realm.account.communityMint}
        tokenName="Governance"
      ></DepositGoverningTokensButton>
      <WithdrawGoverningTokensButton
        realm={realm}
        governingTokenMint={realm?.account.communityMint}
        tokenName="Governance"
      ></WithdrawGoverningTokensButton>
      <DepositGoverningTokensButton
        realm={realm}
        governingTokenMint={realm.account.config.councilMint}
        tokenName="Council"
      ></DepositGoverningTokensButton>
      <WithdrawGoverningTokensButton
        realm={realm}
        governingTokenMint={realm.account.config.councilMint}
        tokenName="Council"
      ></WithdrawGoverningTokensButton>

      {settingsVisible && (
        <div ref={parentRef} className="realm-popup-action-container">
          <Popover
            title="Realm Settings"
            placement="bottomRight"
            arrowPointAtCenter
            trigger="click"
            getPopupContainer={() => parentRef.current!}
            content={
              <Space direction="vertical">
                {showCreateNewGovernance && (
                  <RegisterGovernanceButton
                    realm={realm}
                  ></RegisterGovernanceButton>
                )}
                {showCreateNewGovernance && (
                  <CreateTreasuryAccountButton
                    realm={realm}
                  ></CreateTreasuryAccountButton>
                )}
                {showSetRealmAuthority && (
                  <SetRealmAuthorityButton
                    realm={realm}
                  ></SetRealmAuthorityButton>
                )}
                {useCommunityVoterWeightAddin && (
                  <ConfigureVoterStakeRegistryButton
                    realm={realm}
                  ></ConfigureVoterStakeRegistryButton>
                )}
              </Space>
            }
          >
            <Button style={{ paddingLeft: 8, paddingRight: 8 }}>
              <MoreOutlined rotate={90} />
            </Button>
          </Popover>
        </div>
      )}
    </Space>
  );
}
