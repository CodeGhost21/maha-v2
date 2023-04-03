export const calculateBoost = (
  loyalty: number, // 0-1
  maxBoost: number // 0-inf
) => {
  return (maxBoost * (1 + loyalty)) / 2;
};
