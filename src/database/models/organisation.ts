import mongoose from "mongoose";

export interface IOrganization {
  name: string;
  // channelId: string;
  guildId: string;
  maxBoost: number;
}

const organization = new mongoose.Schema(
  {
    name: String,
    // channelId: String,
    guildId: String, // Discord server id
    maxBoost: { type: Number, min: 0, max: 100 }, //eg: 10
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
