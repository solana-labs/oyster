import { Statistic } from "antd";
import React from "react";

export const BarChartStatistic = <T,>(props: {
  items: T[];
  title?: string;
  name: (item: T) => string;
  color?: (item: T) => string;
  getPct: (item: T) => number;
}) => {
  const colors = [
    "#003f5c",
    "#2f4b7c",
    "#665191",
    "#a05195",
    "#d45087",
    "#f95d6a",
    "#ff7c43",
    "#ffa600",
  ].reverse();

  return (
    <Statistic
      title={props.title}
      valueRender={() => (
        <div
          style={{
            width: "100%",
            height: 37,
            display: "flex",
            backgroundColor: "lightgrey",
            fontSize: 12,
            lineHeight: "37px",
          }}
        >
          {props.items.map((item, i) => (
            <div
              key={props.name(item)}
              title={props.name(item)}
              style={{
                overflow: "hidden",
                width: `${100 * props.getPct(item)}%`,
                backgroundColor:
                  (props.color && props.color(item)) ||
                  colors[i % props.items.length],
              }}
            >
              {props.name(item)}
            </div>
          ))}
        </div>
      )}
    ></Statistic>
  );
};
