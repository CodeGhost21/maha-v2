export const getEpoch = () => {
  // const epoch = Math.floor(Date.now() / (6 * 60 * 60 * 1000)); // 6 hr epochs
  const epoch = Math.floor(Date.now() / (86400 * 1000)); // 1 day epochs
  return epoch;
};
