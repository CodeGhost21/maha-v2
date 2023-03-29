import mongoose from "mongoose";

export interface IOrganization {
  name: string;
  msgChannelId: string;
  feedChannelId: string;
  guildId: string;
  gmChannelId: string;
  maxBoost: number;
}

const organization = new mongoose.Schema(
  {
    name: String,
    guildId: String, // Discord server id
    maxBoost: { type: Number, min: 0, max: 100 }, // eg: 10
    msgChannelId: String,
    gmChannelId: String,
    feedChannelId: String,
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

//add twitter handle to keep a check user follow the organization
//add nft locker address for checking hold_NFT
