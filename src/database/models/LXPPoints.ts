import { model } from "mongoose";
import { ILXPPoints } from "../interface/lineaLXP/lxpPoints";
import { LXPPointsSchema } from "../schema/lxpPoints";

export type ILXPPointsModel = ILXPPoints & Document;
export const LXPUsers = model<ILXPPointsModel>("LXPPoints", LXPPointsSchema);
