export type Transfer = {
  toAddress: string;
  points: string;
};
export interface IBlastBatches {
  batchId: string;
  batch: Transfer[];
}
