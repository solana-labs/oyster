import React from "react";
import { useLendingReserves } from "../../hooks";
import { LendingMarket, LendingReserve } from "../../models";
import { TokenIcon } from "../TokenIcon";
import { getTokenName } from "../../utils/utils";
import { Select } from "antd";
import { useConnectionConfig } from "../../contexts/connection";
import { cache, ParsedAccount } from "../../contexts/accounts";

const { Option } = Select;

export const CollateralSelector = (props: {
  reserve: LendingReserve;
  collateralReserve?: string;
  disabled?: boolean;
  onCollateralReserve?: (id: string) => void;
}) => {
  const { reserveAccounts } = useLendingReserves();
  const { tokenMap } = useConnectionConfig();

  const market = cache.get(props.reserve.lendingMarket) as ParsedAccount<
    LendingMarket
  >;
  const onlyQuoteAllowed = !props.reserve?.liquidityMint?.equals(
    market?.info?.quoteMint
  );

  return (
    <Select
      size="large"
      showSearch
      style={{ minWidth: 300, margin: "5px 0px" }}
      placeholder="Collateral"
      value={props.collateralReserve}
      disabled={props.disabled}
      defaultValue={props.collateralReserve}
      onChange={(item) => {
        if (props.onCollateralReserve) {
          props.onCollateralReserve(item);
        }
      }}
      filterOption={(input, option) =>
        option?.name?.toLowerCase().indexOf(input.toLowerCase()) >= 0
      }
    >
      {reserveAccounts
        .filter((reserve) => reserve.info !== props.reserve)
        .filter(
          (reserve) =>
            !onlyQuoteAllowed ||
            reserve.info.liquidityMint.equals(market.info.quoteMint)
        )
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
