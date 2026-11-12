
// The Desk: firm logos shown next to practitioners' career history ("previously at").
// Reuses the bank logos we already hold; any firm without a logo falls back to its name as text.
// TODO (Rao/Codex): add official logo files for the firms marked null, from each firm's own brand/press page.
export const FIRM_LOGOS = {
  // The Barclays and JP Morgan images in bank-logos.mjs are small thumbnails that look worse than text here,
  // so every firm shows as its name until proper logo files are added (e.g. '/assets/logos/ubs.svg').
  'Barclays': '/assets/practitioner-firms/barclays.svg', 'J.P. Morgan': '/assets/practitioner-firms/jpm-im.svg',
  'UBS': '/assets/practitioner-firms/ubs.svg', 'Commerzbank': '/assets/practitioner-firms/commerzbank.svg', 'BGC': '/assets/practitioner-firms/bgc-mark.svg', 'Société Générale': '/assets/practitioner-firms/socgen.svg',
  'Knight': '/assets/practitioner-firms/knight.svg', 'Stifel': '/assets/practitioner-firms/stifel.svg', 'EY': '/assets/practitioner-firms/ey.svg', 'Lancashire Insurance': '/assets/practitioner-firms/lancashire.png'
};
export const PRACTITIONERS = [
  { init: 'KR', name: 'Kayyor Rao', area: 'Banking · 20+ years', firms: ['UBS', 'Commerzbank', 'BGC'], photo: '/assets/kayyor-rao.jpg' },
  { init: 'PC', name: 'Peter Cheley', area: 'Banking & asset management · 30 years', firms: ['Société Générale', 'J.P. Morgan', 'BGC'] },
  { init: 'NR', name: 'Neil Robertson', area: 'Banking · 30 years', firms: ['UBS', 'Knight', 'Stifel'] },
  { init: 'JS', name: 'Jim Staples', area: 'Banking · 30 years', firms: ['Barclays', 'BGC'] },
  { init: 'CS', name: 'Chris Sharkey', area: 'Audit & insurance · 20+ years', firms: ['EY', 'Lancashire Insurance'] }
];
