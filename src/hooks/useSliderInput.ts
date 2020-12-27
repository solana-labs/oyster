import { useCallback, useState } from "react";

export enum InputType {
  AbsoluteValue = 0,
  Percent = 1,
}

export const useSliderInput = (
  convert: (val: string | number) => string | number
) => {
  const [value, setValue] = useState("");
  const [pct, setPct] = useState(0);
  const [type, setType] = useState(InputType.Percent);

  return {
    value,
    setValue: useCallback(
      (val: string) => {
        setType(InputType.AbsoluteValue);
        setValue(val);
        setPct(convert(val) as number);
      },
      [setType, setValue, setPct, convert]
    ),
    pct,
    setPct: useCallback(
      (val: number) => {
        setType(InputType.Percent);
        setPct(val);
        setValue(convert(val) as string);
      },
      [setType, setValue, setPct, convert]
    ),
    type,
  };
};
