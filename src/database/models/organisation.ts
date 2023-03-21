import mongoose from "mongoose";

export interface IOrganization {
  name: string;
  channelId: string;
  guildId: string;
  maxBoost: number;
}

const organization = new mongoose.Schema({
  name: String,
  channelId: String,
  guildId: String,
  maxBoost: Number, //eg: 10
});

export type IOrganizationModel = IOrganization & mongoose.Document;
export const Organization = mongoose.model<IOrganizationModel>(
  "Organization",
  organization
);
