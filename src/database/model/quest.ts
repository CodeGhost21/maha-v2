import mongoose, { Document, Schema } from "mongoose";

export interface IQuest {
  questId: string;
  tweetId: string;
  influencerLiked: boolean;
  tweetDate: any;
  influencerName: string;
  questUserId: string;
}

const schema = new Schema(
  {
    questId: String,
    tweetId: String,
    influencerLiked: { type: Boolean, default: false },
    influencerName: String,
    tweetDate: Date,
    questUserId: String,
  },
  { timestamps: true }
);

export type IQuestModel = IQuest & Document;
export const Quest = mongoose.model<IQuest>("Quest", schema);
