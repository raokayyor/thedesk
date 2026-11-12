// Keep the key benefits visible; move longer lists into an optional disclosure on phones.
const phonePlans = matchMedia('(max-width: 700px)');
const planFolds = [];
document.querySelectorAll('.plans > .plan, .offers > .offer').forEach(card => {
  const list = card.querySelector(':scope > ul');
  if (!list || list.children.length <= 3) return;
  const fold = document.createElement('details');
  fold.className = 'plan-more';
  const summary = document.createElement('summary');
  summary.textContent = 'See all features';
  const extra = document.createElement('ul');
  while (list.children.length > 3) extra.append(list.children[3]);
  fold.append(summary, extra);
  list.after(fold);
  planFolds.push(fold);
});
function resizePlans() { planFolds.forEach(fold => { fold.open = !phonePlans.matches; }); }
phonePlans.addEventListener('change', resizePlans);
resizePlans();
const compare = document.querySelector('.compare');
if (compare) {
  const fold = document.createElement('details');
  fold.className = 'plan-comparison';
  const summary = document.createElement('summary');
  summary.textContent = 'Compare every feature';
  compare.before(fold);
  fold.append(summary, compare);
}
