export function formatToCurrency2(args: number): string {
  return `$${(args / 100).toFixed(2)} XY123`;
}

export enum LockupStatus2 {
  AWAITING_VAA,
  UNCLAIMED_VAA,
  COMPLETED,
}
