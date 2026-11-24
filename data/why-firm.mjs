// "Why this firm?" helper: what each firm is really listening for.
// Facts come from interview-firm-packs.js (`know`, `why`), which sources each firm's own site.
// Everything here is coaching (angles, things to avoid), not new facts.
// Each hook is a fact the student can build on. The draft links it to THEIR evidence;
// never let the model add firm facts that aren't in `hooks`.
//
// Shape: { angle, listen, hooks:[{fact, link}], avoid:[], tip }
//   angle  – the real question behind "Why us?" for this firm (shown as the header nod)
//   listen – one line: what a good answer proves
//   hooks  – firm facts (sourced) + how a student might connect to it
//   avoid  – phrases that fit any firm, so they score nothing here
//   tip    – Kayyor's "what they're really asking" line, in his voice. This IS the angle, said
//            by a person; it is shown in the dark card with his photo. There is no separate tip.

export const WHY_FIRM_STRUCTURE = [
  'The firm’s angle: one thing true of this firm, not of every bank',
  'Your link: why that matters to you',
  'Your proof: something you did that shows it',
  'What you’d bring: one line, forward-looking'
];

export const GENERIC_AVOID = ['great reputation', 'prestigious', 'world-class', 'leading bank', 'I’ve always wanted to work here', 'the culture seems great'];

export const WHY_FIRM = {
  barclays: {
    angle: 'Why a UK bank with international reach, rather than a US bank?',
    listen: 'That you understand Barclays is UK-headquartered, serves UK companies as well as global ones, and that this matters to you.',
    hooks: [
      { fact: 'UK-headquartered, with UK corporate banking, a private bank and an investment bank under one roof.', link: 'You want to work with UK companies across their life, not only on one-off deals.' },
      { fact: 'Its values spell RISES: Respect, Integrity, Service, Excellence, Stewardship.', link: 'Pick ONE value and prove it with something you did. Don’t list them.' },
      { fact: 'Know a recent result or strategic change.', link: 'Name it and say what it means for the team you’re applying to. (Check it’s current.)' }
    ],
    avoid: ['a great British bank', 'global reach', 'strong reputation'],
    tip: 'They want to know why a UK bank with international reach, not a US bank. Answer that before they ask it.'
  },
  rothschild: {
    angle: 'Why independent advice, rather than a big bank with a balance sheet?',
    listen: 'That you understand Rothschild & Co advises rather than lends, and why conflict-free advice matters to a client.',
    hooks: [
      { fact: 'Family-controlled and independent: it advises rather than lending its own balance sheet, so it pitches conflict-free advice.', link: 'Say why advice-only appeals to you: the client’s problem is the product.' },
      { fact: 'Global Advisory covers M&A, debt advisory and restructuring.', link: 'If you’ve analysed a company under pressure, link it to restructuring or debt advisory.' },
      { fact: 'Five Arrows is its private markets arm; it also runs Wealth & Asset Management.', link: 'Only mention it if you’re applying there. Otherwise one line shows breadth.' }
    ],
    avoid: ['historic name', 'famous family', 'prestige', 'it’s a boutique'],
    tip: 'They want to know why independent advice, not a big bank with a balance sheet. Never say prestige. Say independence, and why it matters to a client.'
  },
  gs: {
    angle: 'Why Goldman Sachs, and why this division specifically?',
    listen: 'A specific reason for the division, backed by something you’ve done, in a tight answer.',
    hooks: [
      { fact: 'Global investment bank: investment banking, global markets, and asset & wealth management.', link: 'Name the division and the kind of work in it you want to do.' },
      { fact: 'First rounds are often recorded video interviews.', link: 'Keep it under 90 seconds: division, reason, proof.' }
    ],
    avoid: ['the best bank', 'prestige', 'top of the league tables'],
    tip: 'They want to know why this division, not why Goldman. The division matters more than the logo, so spend most of the answer there.'
  },
  jpm: {
    angle: 'Why J.P. Morgan, and why this team, not just any big bank?',
    listen: 'That you know what scale lets J.P. Morgan do (lend as well as advise) and why that matters for your team.',
    hooks: [
      { fact: 'The size of its balance sheet lets it lend as well as advise.', link: 'Link it to clients who need financing and advice together.' },
      { fact: 'Jamie Dimon’s annual letter to shareholders is widely read.', link: 'Quote one point from the latest letter and give your view. (Check it’s the latest.)' }
    ],
    avoid: ['biggest bank', 'great reputation', 'Jamie Dimon is inspiring'],
    tip: 'They want to know why J.P. Morgan, not just any big bank. Scale is the answer: it can lend as well as advise. Say why that matters for your team.'
  },
  ms: {
    angle: 'Why Morgan Stanley? Use how the firm is built, not its reputation.',
    listen: 'That you know wealth and investment management are a big part of the firm, and how that links to your team.',
    hooks: [
      { fact: 'Wealth management is a large part of the firm (it bought E*TRADE in 2020).', link: 'Explain what a big wealth business means for the bank as a whole.' },
      { fact: 'Stated core values include putting clients first and doing the right thing.', link: 'Prove one with your own example, not a quote.' }
    ],
    avoid: ['white-shoe', 'prestige', 'strong brand'],
    tip: 'They want to know you understand how Morgan Stanley is built, not its reputation. Wealth management is a big part of it. Show you know the firm’s shape.'
  },
  lazard: {
    angle: 'What would you get at a smaller independent adviser that you wouldn’t at a larger bank?',
    listen: 'That you want early responsibility on advice-led work, including for governments.',
    hooks: [
      { fact: 'Independent: advisory (M&A, restructuring, sovereign advisory) and asset management, no big lending book.', link: 'Same as Rothschild: why advice-only appeals to you.' },
      { fact: 'Advises governments as well as companies.', link: 'If you study economics or policy, this is your link.' },
      { fact: 'Small teams: juniors get early responsibility.', link: 'Prove you can handle it: a time you were given real responsibility early.' }
    ],
    avoid: ['boutique', 'prestige', 'smaller is better'],
    tip: 'They want to know what you’d get at a smaller adviser that you wouldn’t at a big bank. Early responsibility, and sovereign advisory if it fits you.'
  },
  evercore: {
    angle: 'Why Evercore and independent advisory, rather than a bulge-bracket bank?',
    listen: 'That you understand advice is its product, and you want to be on a lean deal team.',
    hooks: [
      { fact: 'No lending, so advice is its product.', link: 'Say why you’d rather advise than sell financing.' },
      { fact: 'Lean deal teams.', link: 'A time you did a lot with a small team.' }
    ],
    avoid: ['elite boutique', 'prestige', 'league tables'],
    tip: 'They want to know why advice-only, not a bulge bracket. Don’t compare it to other advisers by name. Say what you want from independence.'
  },
  hsbc: {
    angle: 'Why HSBC? Link it to its international network.',
    listen: 'That you understand HSBC connects clients across countries, especially to and within Asia.',
    hooks: [
      { fact: 'An international bank whose strength is connecting clients across countries, especially to and within Asia.', link: 'Any cross-border experience, language or project is your link.' },
      { fact: 'Its values include “we value difference” and “we succeed together”.', link: 'A time you worked with people from very different backgrounds.' }
    ],
    avoid: ['the world’s local bank', 'global reach', 'big in Asia'],
    tip: 'They want to know you understand the international network. Make it about a client crossing borders, not about the bank being big.'
  },
  citi: {
    angle: 'Why Citi? Use its global network or services business.',
    listen: 'That you know Citi’s services business (payments, cash, trade) is a core strength for multinationals.',
    hooks: [
      { fact: 'Its services business (payments, cash and trade for multinationals) is a core strength.', link: 'Show you understand the plumbing behind big companies, not just deals.' },
      { fact: 'Banking and markets serve the same multinational clients.', link: 'Why one client relationship across many countries appeals to you.' }
    ],
    avoid: ['global bank', 'big network', 'strong brand'],
    tip: 'They want to know you understand what Citi does for multinationals. Few candidates mention services, so that alone makes you stand out.'
  },
  blackrock: {
    angle: 'Why BlackRock, and why asset management rather than investment banking?',
    listen: 'That you know which part of BlackRock you want, and why managing money appeals more than advising on deals.',
    hooks: [
      { fact: 'Manages money for institutions and individuals rather than lending.', link: 'Why long-term investing appeals to you more than deals.' },
      { fact: 'iShares is its ETF business; Aladdin is its risk and portfolio technology.', link: 'Pick the one closest to your interests: products or technology.' },
      { fact: 'It has been growing in private markets and infrastructure.', link: 'Only if you’re applying there. Give one reason.' }
    ],
    avoid: ['biggest asset manager', 'Larry Fink', 'trillions under management'],
    tip: 'They want to know which part of BlackRock, and why managing money rather than deals. “BlackRock” alone isn’t an answer.'
  },
  ey: {
    angle: 'Why EY, and why this service line? Expect strengths questions.',
    listen: 'What you enjoy and do well, and why it fits the service line, not only past examples.',
    hooks: [
      { fact: 'Big Four firm: assurance, consulting, strategy & transactions and tax.', link: 'Name the service line and what you’d do in your first year.' },
      { fact: 'Its purpose is “building a better working world”.', link: 'Don’t quote it back. Show something you did that fits it.' }
    ],
    avoid: ['Big Four', 'great training', 'purpose-driven'],
    tip: 'They want to know what energises you, not only what you’ve done. Answer with a real moment, not a trait.'
  }
};

export function whyFirmFor(key) {
  return WHY_FIRM[key] || null;   // fall back to the generic structure when we have no pack
}
