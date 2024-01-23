import { WalletUser } from "../database/models/walletUsers";
import cache from "../utils/cache";

export const totalUsers = async () => {
  const allUsers = await WalletUser.count();
  cache.set("tu:allUsers", allUsers, 60 * 60);
};
