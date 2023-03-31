import { CacheType, Interaction } from "discord.js";
import mongoose, { Schema } from "mongoose";
import BadRequestError from "../../errors/BadRequestError";
import { IOrganizationModel, Organization } from "./organization";
import { IUserModel, User } from "./user";

export interface IServerProfile {
  organizationId: IOrganizationModel;
  userId: IUserModel;
  isModerator: boolean;

  streak: number;
  maxStreak: number;
  totalGMs: number;
  lastGM: Date;
  gmRank: number;

  totalPoints: number;
  loyaltyWeight: number;
  stakedMaha: boolean;

  // getLoyalty: () => Promise<ILoyaltyModel>;
  getUser: () => Promise<IUserModel>;
}

const schema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    isModerator: { type: Boolean, default: false },

    streak: { type: Number, default: 0 },
    maxStreak: { type: Number, default: 0 },
    totalGMs: { type: Number, default: 0 },
    lastGM: Date,
    gmRank: { type: Number, default: 0 },

    // adding a point => totalPoints += points * ((maxBoost * loyalty) + 1)
    // eg: MaxBoost = 5; loyalty = 0%; points = 100
    // ---> totalPoints += 100 * (2.5 + 1) => 100 * 3.5 => 350
    totalPoints: { type: Number, default: 0 },

    // this gets recalculated every time a user performs a loyalty task
    loyaltyWeight: { type: Number, default: 0 }, // 0-1
    stakedMaha: { type: Boolean, default: false },

    // walletAddress: { type: String, default: "" },

    // discordVerify: { type: Boolean, default: false },
    // discordName: { type: String, default: "" },
    // discordDiscriminator: { type: String, default: "" },
    // discordAvatar: { type: String, default: "" },

    // twitterOauthAccessToken: String,
    // twitterOauthAccessTokenSecret: String,
    // twitterRequestTokenSecret: String,
    // twitterRequestToken: String,

    // discordOauthAccessToken: { type: String },
    // discordOauthAccessTokenSecret: { type: String },
    // discordOauthAccessTokenExpiry: Date,
  },
  {
    timestamps: true,
  }
);

schema.methods.getUser = async function () {
  return await User.findById(this.userId);
};

schema.index({ userId: 1, organizationId: 1 }, { unique: true });

export type IServerProfileModel = IServerProfile & mongoose.Document;
export const ServerProfile = mongoose.model<IServerProfileModel>(
  "ServerProfile",
  schema
);

export const findOrCreateServerProfile = async (
  discordId: string,
  guildId: string,
  isModerator?: boolean
) => {
  const org = await Organization.findOne({ guildId });
  if (!org) throw new BadRequestError("org not registered");

  const user = await User.findOne({ discordId });
  if (user) {
    const profile = await ServerProfile.findOne({
      userId: user.id,
      organizationId: org.id,
    });

    if (profile)
      return {
        profile,
        userCreated: false,
        profileCreated: false,
        user,
        organization: org,
      };

    const newProfile = await ServerProfile.create({
      userId: user.id,
      organizationId: org.id,
    });

    return {
      profile: newProfile,
      userCreated: false,
      profileCreated: true,
      user,
      organization: org,
    };
  }

  const newUser = await User.create({ discordId });
  const profile = await ServerProfile.create({
    userId: newUser.id,
    organizationId: org.id,
    isModerator: !isModerator ? false : isModerator,
  });

  return {
    profile,
    userCreated: true,
    profileCreated: true,
    user: newUser,
    organization: org,
  };
};

export const findOrCreateServerProfileFromDiscordInteraction = async (
  interaction: Interaction<CacheType>,
  isModerator?: boolean
) => {
  // const userId
};
