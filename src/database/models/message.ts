import mongoose, { Schema } from "mongoose";
import { IOrganizationModel } from "./organization";
import { IServerProfileModel } from "./serverProfile";

export interface IMessage {
  content: string;
  profileId: IServerProfileModel;
  organizationId: IOrganizationModel;
  dateTime: Date;
}

const schema = new Schema(
  {
    content: String,
    profileId: { type: Schema.Types.ObjectId, ref: "ServerProfile" },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
    dateTime: Date,
  },
  {
    timestamps: true,
  }
);

export type IMessageModel = IMessage & mongoose.Document;
export const Message = mongoose.model<IMessageModel>("Message", schema);
