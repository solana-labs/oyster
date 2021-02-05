import React, { useEffect, useMemo, useRef } from "react";
import { PoolInfo } from "../../models";
import echarts from "echarts";
import { formatNumber, formatUSD } from "../../utils/utils";
import { useEnrichedPools } from "../../contexts/market";

export const SupplyOverview = (props: { pool?: PoolInfo }) => {
  const { pool } = props;
  const pools = useMemo(() => (pool ? [pool] : []), [pool]);
  const enriched = useEnrichedPools(pools);
  const chartDiv = useRef<HTMLDivElement>(null);

  // dispose chart
  useEffect(() => {
    const div = chartDiv.current;
    return () => {
      let instance = div && echarts.getInstanceByDom(div);
      instance && instance.dispose();
    };
  }, []);

  useEffect(() => {
    if (!chartDiv.current || enriched.length === 0) {
      return;
    }

    let instance = echarts.getInstanceByDom(chartDiv.current);
    if (!instance) {
      instance = echarts.init(chartDiv.current as any);
    }

    const data = [
      {
        name: enriched[0].names[0],
        value: enriched[0].liquidityAinUsd,
        tokens: enriched[0].liquidityA,
      },
      {
        name: enriched[0].names[1],
        value: enriched[0].liquidityBinUsd,
        tokens: enriched[0].liquidityB,
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
                color: "black",
                lineHeight: 22,
                align: "center",
              },
              r: {
                color: "black",
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
  }, [enriched]);

  if (enriched.length === 0) {
    return null;
  }

  return <div ref={chartDiv} style={{ height: 150, width: "100%" }} />;
};
