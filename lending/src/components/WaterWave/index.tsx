import React, { useCallback, useEffect, useRef, useState } from "react";
import "./index.less";

export const WaterWave = (props: any) => {
  const node = useRef<HTMLCanvasElement>();
  const root = useRef<HTMLDivElement>();
  const [radio, setRadio] = useState(1);
  const { percent, title, style, color, showPercent } = props;
  const { height } = style;

  const resize = useCallback(() => {
    const { offsetWidth } = root.current?.parentNode as HTMLElement;
    setRadio(offsetWidth < height ? offsetWidth / height : 1);
  }, [height]);

  // resize
  useEffect(() => {
    resize();

    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
    };
  }, [resize]);

  useEffect(() => {
    let timer = 0;
    renderChart(
      node.current,
      percent,
      (val) => {
        timer = val;
      },
      color
    );

    return () => {
      cancelAnimationFrame(timer);
    };
  }, [percent, color]);

  return (
    <div
      className="waterWave"
      ref={root as any}
      style={{ transform: `scale(${radio})` }}
    >
      <div style={{ width: height, height, overflow: "hidden" }}>
        <canvas
          className="waterWaveCanvasWrapper"
          ref={node as any}
          width={height * 2}
          height={height * 2}
        />
      </div>
      <div className="text" style={{ width: height }}>
        {title}
        <h4>{showPercent && `${percent.toFixed(2)}%`}</h4>
      </div>
    </div>
  );
};

const renderChart = (
  canvas: HTMLCanvasElement | undefined,
  percent: number,
  setTimer: (timer: number) => void,
  color = "#1890FF"
) => {
  const data = percent / 100;
  if (!canvas || !data) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;
  const radius = canvasWidth / 2;
  const lineWidth = 2;
  const cR = radius - lineWidth;

  ctx.beginPath();
  ctx.lineWidth = lineWidth * 2;

  const axisLength = canvasWidth - lineWidth;
  const unit = axisLength / 8;
  const range = 0.2;
  let currRange = range;
  const xOffset = lineWidth;
  let sp = 0;
  let currData = 0;
  const waveupsp = 0.005;

  const bR = radius - lineWidth;
  const circleOffset = -(Math.PI / 2);
  let circleLock = true;

  const cStartPoint = [
    radius + bR * Math.cos(circleOffset),
    radius + bR * Math.sin(circleOffset),
  ];
  ctx.strokeStyle = color;
  ctx.moveTo(cStartPoint[0], cStartPoint[1]);

  const drawSin = () => {
    ctx.beginPath();
    ctx.save();

    const sinStack = [];
    for (let i = xOffset; i <= xOffset + axisLength; i += 20 / axisLength) {
      const x = sp + (xOffset + i) / unit;
      const y = Math.sin(x) * currRange;
      const dx = i;
      const dy = 2 * cR * (1 - currData) + (radius - cR) - unit * y;

      ctx.lineTo(dx, dy);
      sinStack.push([dx, dy]);
    }

    const startPoint = sinStack.shift();

    if (!startPoint) {
      return;
    }

    ctx.lineTo(xOffset + axisLength, canvasHeight);
    ctx.lineTo(xOffset, canvasHeight);
    ctx.lineTo(startPoint[0], startPoint[1]);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(1, "#1890FF");
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  };

  const render = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (circleLock) {
      circleLock = false;

      ctx.globalCompositeOperation = "destination-over";

      ctx.beginPath();
      ctx.save();
      ctx.arc(radius, radius, radius - 3 * lineWidth, 0, 2 * Math.PI, true);
      ctx.stroke();
      ctx.restore();
      ctx.clip();
      ctx.fillStyle = "#1890FF";
    } else {
      if (data >= 0.85) {
        if (currRange > range / 4) {
          const t = range * 0.01;
          currRange -= t;
        }
      } else if (data <= 0.1) {
        if (currRange < range * 1.5) {
          const t = range * 0.01;
          currRange += t;
        }
      } else {
        if (currRange <= range) {
          const t = range * 0.01;
          currRange += t;
        }
        if (currRange >= range) {
          const t = range * 0.01;
          currRange -= t;
        }
      }
      if (data - currData > 0) {
        currData += waveupsp;
      }
      if (data - currData < 0) {
        currData -= waveupsp;
      }

      sp += 0.07;
      drawSin();
    }
    setTimer(requestAnimationFrame(render));
  };

  render();
};
