export type PointType = "PHASE2_POINTS" | "PHASE2_GOLD";

export type RequestChallenge = {
    contractAddress: string; // contract with points to be distributed
    operatorAddress: string; // the EOA configured with IBlastPoints
};
export type ResponseChallenge = {
    success: boolean;
    challengeData: string;
    message: string;
};

export type RequestOAuth = {
    challengeData: string; // from challenge response
    signature: string; // ERC-191 signature of `message` from the challenge
};

export type ResponseOAuth = {
    success: boolean;
    bearerToken: string; // will last 1 hour
};

export type Transfer = {
    toAddress: string;
    points: string;
};

export type Request = {
    pointType: PointType;
    transfers: Transfer[];
    secondsToFinalize?: number | null;
};

export interface User {
    id: string;
    debt: string;
    balance: string;
    accumulatedPoints: string;
    lastUpdatedAt: number;
}

export interface Core {
    totalPointsUSDB: string;
    id: string;
    totalPointsWETH: string;
}

export interface ResponseData {
    wethusers: User[];
    usdbusers: User[];
    core: Core;
}
