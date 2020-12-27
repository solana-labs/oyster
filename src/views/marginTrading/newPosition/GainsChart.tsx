import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Position } from './interfaces';

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

function getChartData({ item, priceChange }: { item: Position; priceChange: number }) {
  //the only way to create an immutable copy of array with objects inside.
  const baseDashed = JSON.parse(JSON.stringify(baseData.slice(Math.floor(baseData.length) / 2)));
  const baseSolid = JSON.parse(JSON.stringify(baseData.slice(0, Math.floor(baseData.length) / 2 + 1)));

  const leverage = item.leverage;

  baseDashed.forEach((item: { y: number; x: number }, index: number) => {
    if (index !== 0) item.y += (item.y * priceChange) / 100;
  });
  var leverageData = baseDashed.map((item: { x: number; y: number }, index: number) => {
    if (index === 0) {
      return { x: item.x, y: item.y };
    }
    const gain = (priceChange * leverage) / 100;
    return { x: item.x, y: item.y * (1 + gain) };
  });

  return {
    datasets: [
      {
        backgroundColor: 'transparent',
        borderColor: 'rgb(39, 107, 251)',
        borderWidth: 4,
        radius: 0,
        data: baseSolid,
      },
      {
        backgroundColor: 'transparent',
        borderColor: priceChange >= 0 ? 'rgb(51, 223, 204)' : 'rgb(255,79,79)',
        borderWidth: 4,
        radius: 0,
        data: leverageData,
        borderDash: [15, 3],
        label: 'LEVERAGE',
      },
      {
        backgroundColor: 'transparent',
        borderColor: 'rgb(86, 169, 255)',
        borderWidth: 2,
        radius: 0,
        data: baseDashed,
        borderDash: [8, 4],
        label: 'HOLD',
      },
    ],
  };
}

function updateChartData({
  item,
  priceChange,
  chartRef,
}: {
  item: Position;
  priceChange: number;
  chartRef: React.RefObject<any>;
}) {
  const data = getChartData({ item, priceChange });
  chartRef.current.chartInstance.data = data;
  chartRef.current.chartInstance.canvas.parentNode.style.width = '100%';
  chartRef.current.chartInstance.canvas.parentNode.style.height = 'auto';
  chartRef.current.chartInstance.update();
}

function drawLabels(t: any, ctx: any, leverage: number, priceChange: number) {
  console.log('drawing');
  ctx.save();
  ctx.font = 'normal normal bold 15px /1.5 Muli';
  ctx.textBaseline = 'bottom';

  const chartInstance = t.chart;
  const datasets = chartInstance.config.data.datasets;
  datasets.forEach(function (ds: { label: any; borderColor: any }, index: number) {
    const label = ds.label;
    ctx.fillStyle = ds.borderColor;

    const meta = chartInstance.controller.getDatasetMeta(index);
    const len = meta.data.length - 1;
    const pointPostition = Math.floor(len / 2) - Math.floor(0.2 * len);
    const x = meta.data[pointPostition]._model.x;
    const xOffset = x;
    const y = meta.data[pointPostition]._model.y;
    let yOffset;
    if (label === 'HOLD') {
      yOffset = leverage * priceChange > 0 ? y * 1.2 : y * 0.8;
    } else {
      yOffset = leverage * priceChange > 0 ? y * 0.8 : y * 1.2;
    }

    if (yOffset > chartInstance.canvas.parentNode.offsetHeight) {
      // yOffset = 295;
      chartInstance.canvas.parentNode.style.height = `${yOffset * 1.3}px`;
    }
    if (yOffset < 0) yOffset = 5;
    if (label) ctx.fillText(label, xOffset, yOffset);
  });
  ctx.restore();
}

export default function GainsChart({ item, priceChange }: { item: Position; priceChange: number }) {
  const chartRef = useRef<any>();
  const [booted, setBooted] = useState<boolean>(false);
  const [canvas, setCanvas] = useState<any>();
  useEffect(() => {
    if (chartRef.current.chartInstance) updateChartData({ item, priceChange, chartRef });
  }, [priceChange, item.leverage]);

  useEffect(() => {
    if (chartRef.current && !booted && canvas) {
      //@ts-ignore
      const originalController = window.Chart.controllers.line;
      //@ts-ignore
      window.Chart.controllers.line = Chart.controllers.line.extend({
        draw: function () {
          originalController.prototype.draw.call(this, arguments);
          drawLabels(this, canvas.getContext('2d'), item.leverage, priceChange);
        },
      });
      setBooted(true);
    }
  }, [chartRef, canvas]);

  const chart = useMemo(
    () => (
      <Line
        ref={chartRef}
        data={(canvas: any) => {
          setCanvas(canvas);
          return getChartData({ item, priceChange });
        }}
        options={{
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
            render: 'title',
            fontColor: ['green', 'white', 'red'],
            precision: 2,
          },
          animation: {
            easing: 'easeOutExpo',
            duration: 500,
          },
          scales: {
            xAxes: [
              {
                display: false,
                gridLines: {
                  display: false,
                },
                type: 'linear',
                position: 'bottom',
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
        }}
      />
    ),
    []
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'center' }}>
      {chart}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>past</span>
        <span>today</span>
        <span>future</span>
      </div>
    </div>
  );
}
