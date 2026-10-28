export const MEMBERSHIP_AMOUNT = 8900;
export const MEMBERSHIP_VERSION = 'membership-89-v1';
export function checkoutAmountMatches(session) {
  const version = session?.metadata?.productVersion;
  return version === MEMBERSHIP_VERSION ? session.amount_total === MEMBERSHIP_AMOUNT : !version && session?.amount_total === 7900;
}
