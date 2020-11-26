import React, { useEffect, useMemo, useRef } from "react";
import { LendingReserve } from "../../models/lending";
import echarts from "echarts";
import {
  formatNumber,
  formatUSD,
  fromLamports,
  wadToLamports,
} from "../../utils/utils";
import { useMint } from "../../contexts/accounts";

export const ReserveUtilizationChart = (props: { reserve: LendingReserve }) => {
  const chartDiv = useRef<HTMLDivElement>(null);

  // dispose chart
  useEffect(() => {
    const div = chartDiv.current;
    return () => {
      let instance = div && echarts.getInstanceByDom(div);
      instance && instance.dispose();
    };
  }, []);

  const liquidityMint = useMint(props.reserve.liquidityMint);
  const avilableLiquidity = fromLamports(
    props.reserve.availableLiqudity.toNumber(),
    liquidityMint
  );

  const totalBorrows = useMemo(
    () =>
      fromLamports(
        wadToLamports(props.reserve.borrowedLiquidityWad),
        liquidityMint
      ),
    [props.reserve, liquidityMint]
  );

  useEffect(() => {
    if (!chartDiv.current) {
      return;
    }

    let instance = echarts.getInstanceByDom(chartDiv.current);
    if (!instance) {
      instance = echarts.init(chartDiv.current as any);
    }

    const data = [
      {
        name: "Available Liquidity",
        value: avilableLiquidity,
        tokens: avilableLiquidity,
      },
      {
        name: "Total Borrowed",
        value: totalBorrows,
        tokens: totalBorrows,
      },
    ];

    instance.setOption({
      tooltip: {
        trigger: "item",
        formatter: function (params: any) {
          var val = formatUSD.format(params.value);
          var tokenAmount = formatNumber.format(params.data.tokens);
          return `${params.name}: \n${val}\n(${tokenAmount})`;
        },
      },
      series: [
        {
          name: "Liquidity",
          type: "pie",
          radius: ["50%", "70%"],
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          animation: false,
          label: {
            fontSize: 14,
            show: true,
            formatter: function (params: any) {
              var val = formatUSD.format(params.value);
              var tokenAmount = formatNumber.format(params.data.tokens);
              return `{c|${params.name}}\n{r|${tokenAmount}}\n{r|${val}}`;
            },
            rich: {
              c: {
                color: "#999",
                lineHeight: 22,
                align: "center",
              },
              r: {
                color: "#999",
                align: "right",
              },
            },
            color: "rgba(255, 255, 255, 0.5)",
          },
          itemStyle: {
            normal: {
              borderColor: "#000",
            },
          },
          data,
        },
      ],
    });
  }, [totalBorrows, avilableLiquidity]);

  return <div ref={chartDiv} style={{ height: 300, width: 400 }} />;
};
