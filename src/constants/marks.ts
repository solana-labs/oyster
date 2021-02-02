import { LABELS } from "./labels";

export const marks = {
  0: "0%",
  25: "25%",
  50: "50%",
  75: "75%",
  100: "100%",
};
export const riskMarks = {
  0: {
    style: {
      color: "darkgreen",
    },
    label: LABELS.SAFER,
  },
  100: {
    style: {
      color: "darkred",
    },
    label: LABELS.RISKIER,
  },
};
