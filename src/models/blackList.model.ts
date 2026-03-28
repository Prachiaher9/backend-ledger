import mongoose, { Schema, Document, Model } from "mongoose";

// 1. Interface for document
export interface ITokenBlacklist extends Document {
  token: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Schema
const tokenBlacklistSchema: Schema<ITokenBlacklist> = new Schema(
  {
    token: {
      type: String,
      required: [true, "Token is required to blacklist"],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// 3. TTL index (3 days)
tokenBlacklistSchema.index(
  { createdAt: 1 },
  {
    expireAfterSeconds: 60 * 60 * 24 * 3,
  }
);

// 4. Model
const TokenBlacklistModel: Model<ITokenBlacklist> =
  mongoose.model<ITokenBlacklist>("tokenBlackList", tokenBlacklistSchema);

export default TokenBlacklistModel;