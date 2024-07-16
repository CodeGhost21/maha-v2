import { Document, model } from "mongoose";
import { IBlastUser } from "../interface/blast/blastUser";
import { BlastUserSchema } from "../schema/blastUser";

export type IBlastUserPhase2Model = IBlastUser & Document;
export const BlastUserPhase2 = model<IBlastUserPhase2Model>("BlastUserPhase2", BlastUserSchema);
