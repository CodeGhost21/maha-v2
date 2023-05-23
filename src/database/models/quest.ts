import mongoose, { Document, Schema } from "mongoose";

export interface IQuest {
  questId: string;
  tweetId: string;
  influencerLiked: boolean;
  influencerRetweet: boolean;
  tweetDate: any;
  influencerName: string;
  questUserId: string;
  questName: string;
}

const schema = new Schema(
  {
    questId: String,
    tweetId: String,
    influencerLiked: { type: Boolean, default: false },
    influencerRetweet: { type: Boolean, default: false },
    influencerName: String,
    tweetDate: Date,
    questUserId: String,
    questName: String,
  },
  { timestamps: true }
);

export type IQuestModel = IQuest & Document;
export const Quest = mongoose.model<IQuest>("Quest", schema);
