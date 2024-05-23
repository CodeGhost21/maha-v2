import { Document, model } from "mongoose";
import { IBlastUser } from "../interface/blast/blastUser";
import { BlastUserSchema } from "../schema/blastUser";

export type IBlastUserModel = IBlastUser & Document;
export const BlastUser = model<IBlastUserModel>("BlastUser", BlastUserSchema);
