import { WalletUserV2 } from "../database/models/walletUsersV2";
import cache from "../utils/cache";

export const totalUsers = async () => {
  const allUsers = await WalletUserV2.count();
  cache.set("tu:allUsers", allUsers, 60 * 60);
};
