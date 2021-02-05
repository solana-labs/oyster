export interface TotalItem {
  key: string;
  marketSize: number;
  borrowed: number;
  name: string;
}

export interface Totals {
  marketSize: number;
  borrowed: number;
  lentOutPct: number;
  items: TotalItem[];
}
