// STAJ commission structure (flat tiers, set by the founder). Pure functions so the server and the booking form share the rules.
export const DEPOSIT_PERCENT = 30;

/** Commission percent for a whole-service price in KES: 1-12,999 -> 10%, 13,000-25,000 -> 8%, 25,001+ -> 4%. */
export const commissionRate = (total: number) => total <= 12999 ? 10 : total <= 25000 ? 8 : 4;

/**
 * - The customer pays 30% of the total as a deposit.
 * - STAJ's commission is calculated on the FULL price and taken entirely from the deposit.
 * - The salon's share of the deposit is what is left; the remaining 70% is paid to the salon directly, with no extra commission.
 */
export function breakdown(total: number) {
  const rate = commissionRate(total), deposit = Math.round(total * DEPOSIT_PERCENT / 100), commission = Math.round(total * rate / 100);
  return { total, rate, deposit, commission, salonDeposit: deposit - commission, balance: total - deposit };
}
