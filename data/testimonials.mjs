// Add approved quotes here. Choose slot: 'pricing' or 'one-to-one'.
// Cydney appears once in each location; the wording is shared.
const cydney = {
 quote: 'Kayyor showed me what my CV and applications looked like from the inside. Then The Desk helped me improve them. I’m now at J.P. Morgan.',
 name: 'Cydney',
 uni: 'University of Exeter',
 outcome: 'Offer: J.P. Morgan'
};
export const TESTIMONIALS = [
 {...cydney, slot: 'pricing'},
 {...cydney, slot: 'one-to-one'}
];

// Append a new approved pricing quote to replace the current pricing card.
export function testimonialsForSlot(slot,items=TESTIMONIALS){const matches=items.filter(t=>t.slot===slot&&t.quote&&t.name);return slot==='pricing'?matches.slice(-1):matches;}
