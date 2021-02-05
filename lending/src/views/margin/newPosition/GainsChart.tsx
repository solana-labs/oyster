import React, { useEffect, useRef } from "react";
import Chart, { ChartPluginsOptions } from "chart.js";
import { Position } from "./interfaces";

// Special thanks to
// https://github.com/bZxNetwork/fulcrum_ui/blob/development/packages/fulcrum-website/assets/js/trading.js
// For the basis of this code - I copied it directly from there and then modified it for our needs.
// You guys are real heroes - that is beautifully done.
const baseData = [
  { x: 0, y: 65 },
  { x: 1, y: 80 },
  { x: 2, y: 60 },
  { x: 3, y: 30 },
  { x: 4, y: 20 },
  { x: 5, y: 35 },
  { x: 6, y: 25 },
  { x: 7, y: 40 },
  { x: 8, y: 36 },
  { x: 9, y: 34 },
  { x: 10, y: 50 },
  { x: 11, y: 33 },
  { x: 12, y: 37 },
  { x: 13, y: 45 },
  { x: 14, y: 35 },
  { x: 15, y: 37 },
  { x: 16, y: 50 },
  { x: 17, y: 43 },
  { x: 18, y: 50 },
  { x: 19, y: 45 },
  { x: 20, y: 55 },
  { x: 21, y: 50 },
  { x: 22, y: 45 },
  { x: 23, y: 50 },
  { x: 24, y: 45 },
  { x: 25, y: 40 },
  { x: 26, y: 35 },
  { x: 27, y: 40 },
  { x: 28, y: 37 },
  { x: 29, y: 45 },
  { x: 30, y: 50 },
  { x: 31, y: 60 },
  { x: 32, y: 55 },
  { x: 33, y: 50 },
  { x: 34, y: 53 },
  { x: 35, y: 55 },
  { x: 36, y: 50 },
  { x: 37, y: 45 },
  { x: 38, y: 40 },
  { x: 39, y: 45 },
  { x: 40, y: 50 },
  { x: 41, y: 55 },
  { x: 42, y: 65 },
  { x: 43, y: 62 },
  { x: 44, y: 54 },
  { x: 45, y: 65 },
  { x: 46, y: 48 },
  { x: 47, y: 55 },
  { x: 48, y: 60 },
  { x: 49, y: 63 },
  { x: 50, y: 65 },
];

function getChartData() {
  //the only way to create an immutable copy of array with objects inside.
  const baseDashed = getBaseDashed();
  const baseSolid = JSON.parse(
    JSON.stringify(baseData.slice(0, Math.floor(baseData.length) / 2 + 1))
  );

  return {
    datasets: [
      {
        backgroundColor: "transparent",
        borderColor: "rgb(39, 107, 251)",
        borderWidth: 4,
        radius: 0,
        data: baseSolid,
      },
      {
        backgroundColor: "transparent",

        borderWidth: 4,
        radius: 0,
        data: baseDashed,
        borderDash: [15, 3],
        label: "LEVERAGE",
      },
      {
        backgroundColor: "transparent",
        borderColor: "rgb(86, 169, 255)",
        borderWidth: 2,
        radius: 0,
        data: baseDashed,
        borderDash: [8, 4],
        label: "HOLD",
      },
    ],
  };
}

const labelPlugin: ChartPluginsOptions = {};

const getBaseDashed = () => {
  return JSON.parse(
    JSON.stringify(baseData.slice(Math.floor(baseData.length) / 2))
  ) as { x: number; y: number }[];
};

function updateChartData({
  item,
  priceChange,
  chart,
}: {
  item: Position;
  priceChange: number;
  chart: Chart;
}) {
  if (!chart?.data.datasets || chart?.data.datasets.length < 2) {
    return;
  }

  labelPlugin.afterDraw = (instance: Chart) => {
    drawLabels(instance, item.leverage, priceChange);
  };

  const baseDashed = getBaseDashed();
  const leverage = item.leverage;
  var leverageData = baseDashed.map(
    (item: { x: number; y: number }, index: number) => {
      if (index === 0) {
        return { x: item.x, y: item.y };
      }
      const gain = (priceChange * leverage) / 100;
      return { x: item.x, y: item.y * (1 + gain) };
    }
  );

  chart.data.datasets[1].data = leverageData;
  chart.data.datasets[1].borderColor =
    priceChange >= 0 ? "rgb(51, 223, 204)" : "rgb(255,79,79)";

  baseDashed.forEach((item: { y: number; x: number }, index: number) => {
    if (index !== 0) item.y += (item.y * priceChange) / 100;
  });

  chart.data.datasets[2].data = baseDashed;

  // chart.chartInstance.canvas.parentNode.style.width = '100%';
  // chart.chartInstance.canvas.parentNode.style.height = 'auto';
  chart?.update();
}

function drawLabels(chart: Chart, leverage: number, priceChange: number) {
  if (
    !chart.config ||
    !chart.config.data ||
    !chart.config.data.datasets ||
    !chart.canvas
  ) {
    return;
  }

  const ctx = chart.ctx;
  if (!ctx) {
    return;
  }

  ctx.save();
  ctx.font = "normal normal bold 15px /1.5 Muli";
  ctx.textBaseline = "bottom";

  const datasets = chart.config.data.datasets;
  const element = chart?.canvas?.parentNode as HTMLElement;
  datasets.forEach((ds, index) => {
    const label = ds.label;
    ctx.fillStyle = ds.borderColor as string;

    const meta = chart.getDatasetMeta(index);
    const len = meta.data.length - 1;
    const pointPostition = Math.floor(len / 2) - Math.floor(0.2 * len);
    const x = meta.data[pointPostition]._model.x;
    const xOffset = x;
    const y = meta.data[pointPostition]._model.y;
    let yOffset;

    if (label === "HOLD") {
      yOffset = leverage * priceChange > 0 ? y * 1.2 : y * 0.8;
    } else {
      yOffset = leverage * priceChange > 0 ? y * 0.8 : y * 1.2;
    }

    if (yOffset > element.offsetHeight) {
      // yOffset = 295;
      element.style.height = `${yOffset * 1.3}px`;
    }
    if (yOffset < 0) yOffset = 5;
    if (label) ctx.fillText(label, xOffset, yOffset);
  });
  ctx.restore();
}

export default function GainsChart({
  item,
  priceChange,
}: {
  item: Position;
  priceChange: number;
}) {
  const chartRef = useRef<Chart>();
  const canvasRef = useRef<HTMLCanvasElement>();

  useEffect(() => {
    if (!canvasRef.current || chartRef.current) {
      return;
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: getChartData(),
      plugins: [labelPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scaleShowLabels: false,
        layout: {
          padding: {
            top: 30,
            bottom: 80,
          },
        },
        labels: {
          render: "title",
          fontColor: ["green", "white", "red"],
          precision: 2,
        },
        animation: {
          easing: "easeOutExpo",
          duration: 500,
        },
        scales: {
          xAxes: [
            {
              display: false,
              gridLines: {
                display: false,
              },
              type: "linear",
              position: "bottom",
            },
          ],
          yAxes: [
            {
              display: false,
              gridLines: {
                display: false,
              },
            },
          ],
        },
        legend: {
          display: false,
        },
      } as any,
    });
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      updateChartData({ item, priceChange, chart: chartRef.current });
    }
  }, [priceChange, item]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        justifyContent: "center",
      }}
    >
      <canvas ref={canvasRef as any} />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>past</span>
        <span>today</span>
        <span>future</span>
      </div>
    </div>
  );
}
