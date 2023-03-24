import mongoose from "mongoose";

export interface IOrganization {
  name: string;
  msgChannelId: string;
  feedChannelId: string;
  guildId: string;
  maxBoost: number;
}

const organization = new mongoose.Schema(
  {
    name: String,
    msgChannelId: String,
    feedChannelId: String,
    guildId: String,
    maxBoost: Number, //eg: 10
  },
  {
    timestamps: true,
  }
);

export type IOrganizationModel = IOrganization & mongoose.Document;
export const Organization = mongoose.model<IOrganizationModel>(
  "Organization",
  organization
);
