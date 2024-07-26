export interface IBlastMetadata {
  pointsGivenUSDB: number;
  pointsGivenWETH: number;

  pointsEarnedUSDB: number;
  pointsEarnedWETH: number;

  sharesPendingUSDB: number;
  sharesPendingWETH: number;
  sharesPreviousUSDB: number;
  sharesPreviousWETH: number;
  sharesTillNowUSDB: number;
  sharesTillNowWETH: number;

  shares: number;
  sharePercent: number;
  timestamp: number;
  pointsTillNowUSDB: number;
  pointsTillNowWETH: number;
}
