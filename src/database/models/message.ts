import { Document, model } from "mongoose";
import { IMessage } from "../interface/message/message";
import { message } from "../schema/message";

export type IMessageModel = IMessage & Document;
export const Message = model("Message", message);
