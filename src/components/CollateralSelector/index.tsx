import React from "react";
import { useLendingReserves } from "../../hooks";
import { LendingReserve } from "../../models";
import { TokenIcon } from "../TokenIcon";
import { getTokenName } from "../../utils/utils";
import { Select } from "antd";
import { useConnectionConfig } from "../../contexts/connection";

const { Option } = Select;

export const CollateralSelector = (props: {
  reserve: LendingReserve;
  mint?: string;
  onMintChange: (id: string) => void;
}) => {
  const { reserveAccounts } = useLendingReserves();
  const { tokenMap } = useConnectionConfig();

  return (
    <Select
      size="large"
      showSearch
      style={{ minWidth: 120 }}
      placeholder="Collateral"
      value={props.mint}
      onChange={(item) => {
        if (props.onMintChange) {
          props.onMintChange(item);
        }
      }}
      filterOption={(input, option) =>
        option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {reserveAccounts
        .filter((reserve) => reserve.info !== props.reserve)
        .map((reserve) => {
          const mint = reserve.info.liquidityMint.toBase58();
          const address = reserve.pubkey.toBase58();
          const name = getTokenName(tokenMap, mint);
          return (
            <Option key={address} value={address} name={name} title={address}>
              <div
                key={address}
                style={{ display: "flex", alignItems: "center" }}
              >
                <TokenIcon mintAddress={mint} />
                {name}
              </div>
            </Option>
          );
        })}
    </Select>
  );
};
