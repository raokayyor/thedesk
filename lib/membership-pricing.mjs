export const MEMBERSHIP_LABEL='£89 for the year';
export const MEMBERSHIP_CHECKOUT_DESCRIPTION='£89 · 12 months’ access · no auto-renewal';
export const MEMBERSHIP_PAYMENT_NOTE='One payment · no auto-renewal · less than one CV rewrite';
export const MEMBERSHIP_AMOUNT = 8900;
export const MEMBERSHIP_VERSION = 'membership-89-v1';
export function checkoutAmountMatches(session) {
  const version = session?.metadata?.productVersion;
  return version === MEMBERSHIP_VERSION ? session.amount_total === MEMBERSHIP_AMOUNT : !version && session?.amount_total === 7900;
}

// Only this local destination can request the fixed post-login renewal screen.
export function isRenewalReturn(value){
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\x00-\x20]/.test(value))return false;
 try{const u=new URL(value,'https://desk.invalid');return u.origin==='https://desk.invalid'&&u.pathname==='/membership-start.html'&&u.searchParams.get('renew')==='1';}catch{return false;}
}
