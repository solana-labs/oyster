import { useCallback, useState } from "react";

export enum InputType {
  Input = 0,
  Slider = 1,
}

export const useSliderInput = (
  convert: (val: string | number) => string | number
) => {
  const [value, setValue] = useState("");
  const [mark, setMark] = useState(0);
  const [type, setType] = useState(InputType.Slider);

  return {
    value,
    setValue: useCallback(
      (val: string) => {
        console.log(val);
        setType(InputType.Input);
        setValue(val);
        setMark(convert(val) as number);
      },
      [setType, setValue, setMark, convert]
    ),
    mark,
    setMark: useCallback(
      (val: number) => {
        setType(InputType.Input);
        setMark(val);
        setValue(convert(val) as string);
      },
      [setType, setValue, setMark, convert]
    ),
    type,
  };
};
