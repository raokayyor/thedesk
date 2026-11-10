// The Desk: firm interview packs.
// Load straight after /interview-bank.js (before interview-firms.js / interview-start.js read the firm list).
// Adds firms to DeskInterviewBank and makes each practice session firm-specific: the firm's own "why us" question,
// a firm-flavoured case, and two questions The Desk expects at that firm, plus a short brief of what that firm's
// interviews test. These are The Desk's view for practice, not confirmed employer questions (practitioners review them).
(() => {
  const bank = globalThis.DeskInterviewBank; if (!bank || bank.__packs) return; bank.__packs = true;
  const g = (shape, points) => ({ shape, points });
  const WHY = g('Why the work → why this firm → your evidence.', ['Name the part of the work you want to do there.', 'Give one specific, researched reason for this firm (not size or prestige).', 'Back it with something you have actually done.', 'Finish with what you would bring.']);
  const STAR = g('Situation → task → action → result → what you learned.', ['Pick one real example.', 'Make your own role clear.', 'Explain the decision you made and why.', 'Give the result and what you would do differently.']);
  const KNOW = g('What you know → why it matters → your view.', ['Show you understand how the firm makes money in that area.', 'Explain why it matters to clients.', 'Give your own view, with one reason.', 'Be honest about what you do not know.']);
  const CASE = g('Client objective → key facts → options and trade-offs → recommendation.', ['Restate what the client actually wants.', 'Ask for, or state, the facts you need.', 'Compare two options and their risks.', 'Recommend one and say what would change your mind.']);

  // New firms (existing ones in the bank keep their settings; they get a pack below).
  const NEW = {
    blackrock: { label: 'BlackRock', aliases: ['blackrock', 'black rock', 'blk', 'ishares'], roles: ['asset', 'risk', 'markets'], focus: 'Asset management: active and index investing (iShares), private markets, client portfolios and the Aladdin technology platform.', source: 'https://www.blackrock.com', cases: {} },
    rothschild: { label: 'Rothschild & Co', aliases: ['rothschild', 'rothschild & co', 'rothschild and co', 'n m rothschild'], roles: ['ibd', 'deals', 'asset'], focus: 'Independent, family-controlled financial advisory: M&A, debt advisory and restructuring, plus wealth and asset management.', source: 'https://www.rothschildandco.com', cases: {} },
    lazard: { label: 'Lazard', aliases: ['lazard'], roles: ['ibd', 'deals', 'asset'], focus: 'Independent financial advisory (M&A, restructuring, sovereign advisory) and asset management.', source: 'https://www.lazard.com', cases: {} },
    evercore: { label: 'Evercore', aliases: ['evercore'], roles: ['ibd', 'deals'], focus: 'Independent investment banking advisory: M&A, restructuring and capital markets advice.', source: 'https://www.evercore.com', cases: {} },
    ms: { label: 'Morgan Stanley', aliases: ['ms', 'morgan stanley'], roles: ['ibd', 'markets', 'asset', 'risk'], focus: 'Investment banking, sales & trading, wealth management and investment management.', source: 'https://www.morganstanley.com/people-opportunities/students-graduates', cases: {} },
    citi: { label: 'Citi', aliases: ['citi', 'citigroup', 'citibank'], roles: ['ibd', 'markets', 'corporate', 'risk'], focus: 'A global network bank: banking, markets and services (payments, trade and cash for multinationals).', source: 'https://jobs.citi.com', cases: {} },
    hsbc: { label: 'HSBC', aliases: ['hsbc'], roles: ['ibd', 'markets', 'corporate', 'risk'], focus: 'International bank connecting clients across markets, with a strong Asia franchise; banking, markets and corporate banking.', source: 'https://www.hsbc.com/careers', cases: {} },
    deloitte: { label: 'Deloitte', aliases: ['deloitte'], roles: ['audit', 'deals', 'tax'], focus: 'Audit & assurance, consulting, tax and financial advisory, with strengths and behaviour-based interviews.', source: 'https://www.deloitte.com/uk/en/careers.html', cases: {} },
    kpmg: { label: 'KPMG', aliases: ['kpmg'], roles: ['audit', 'deals', 'tax'], focus: 'Audit, tax and advisory (including deal advisory), with values and judgement in the interviews.', source: 'https://kpmg.com/uk/en/home/careers.html', cases: {} }
  };
  for (const [k, f] of Object.entries(NEW)) if (!bank.firms[k]) bank.firms[k] = f;

  // Packs: brief = what the interviews test / things to know; why = firm "why us"; cases by role; qs = firm-specific questions.
  const P = {
    blackrock: {
      tests: ['Genuine interest in markets and investing (have a view)', 'Understanding clients: pensions, insurers, savers', 'Active vs index investing, fees and risk', 'Teamwork and how you learn fast'],
      know: ['The biggest asset manager in the world; manages money for institutions and individuals rather than lending.', 'iShares is its ETF (index fund) business; Aladdin is its risk and portfolio technology, also sold to other firms.', 'It has been growing in private markets and infrastructure.'],
      why: 'Why BlackRock, and why asset management rather than investment banking? Be specific about the part of BlackRock you want to work in.',
      cases: { asset: 'A UK pension fund client is choosing between a low-cost index fund and an active equity fund with higher fees. How would you help them decide?', risk: 'A client portfolio is heavily exposed to US technology shares. How would you describe the risk to the client, and what would you look at first?', markets: 'Rates fall faster than expected. How might that affect a balanced portfolio of shares and bonds?' },
      qs: [
        { kind: 'motivation', q: 'BlackRock is known for iShares and for Aladdin. Pick one: how does it make money, and why does it matter to clients?', guide: KNOW },
        { kind: 'technical', q: 'Pitch me a stock, fund or asset class you would buy today. What is the case, what is the risk, and what would make you sell?', guide: g('Idea → why now → risk → what would change your mind.', ['State the idea in one line.', 'Give two reasons, one with a number.', 'Name the main risk.', 'Say what would make you sell.']) },
        { kind: 'motivation', q: 'What does it mean for an asset manager to act as a fiduciary for its clients? Give an example of where that would change a decision.', guide: KNOW },
        { kind: 'cv', q: 'Tell me about a time you had to learn something complicated quickly. How did you do it, and how did you check you had understood it?', guide: STAR }
      ]
    },
    rothschild: {
      tests: ['Why independent advice, not a bulge-bracket bank', 'A deal you have followed, explained clearly', 'Valuation basics and judgement', 'Polish, discretion and attention to detail'],
      know: ['Family-controlled and independent: it advises, rather than lending its own balance sheet, so it pitches conflict-free advice.', 'Main businesses: Global Advisory (M&A, debt advisory, restructuring), Wealth & Asset Management, and Five Arrows (its private markets arm).', 'Strong in restructuring and debt advisory as well as M&A.'],
      why: 'Why Rothschild & Co rather than a large bank with a balance sheet? What does independent advice give a client?',
      cases: { ibd: 'A family-owned UK manufacturer has an offer from a competitor and another from a private equity firm. As their adviser, how would you compare the two?', deals: 'A company is struggling to repay its debt in 18 months. What options would you look at, and what would you need to know first?', asset: 'A family wants to keep its wealth across generations. What would you ask before suggesting an investment approach?' },
      qs: [
        { kind: 'technical', q: 'Tell me about an M&A deal you have followed recently. Why did the buyer do it, how was it paid for, and would you have advised it?', guide: g('Deal → rationale → price and funding → your view.', ['Name the parties and the price if you know it.', 'Give the strategic reason.', 'Say how it was funded.', 'Give your own view with one reason.']) },
        { kind: 'technical', q: 'When would a company need a restructuring adviser rather than an M&A adviser? What does that adviser actually do?', guide: KNOW },
        { kind: 'cv', q: 'Tell me about a time you produced work where the detail really mattered. How did you make sure it was right?', guide: STAR }
      ]
    },
    lazard: {
      tests: ['Why an independent adviser', 'Deal knowledge and valuation', 'Intellectual curiosity and judgement'],
      know: ['Independent: advisory (M&A, restructuring, sovereign advisory) and asset management, no big lending book.', 'Advises governments as well as companies.', 'Small teams: juniors get early responsibility.'],
      why: 'Why Lazard? What would you get from a smaller independent adviser that you would not get at a larger bank?',
      cases: { ibd: 'A listed company has received an unsolicited bid at a 30% premium. The board asks whether to accept. How would you frame the advice?', deals: 'A government wants advice on restructuring its debt. What would you need to understand first?' },
      qs: [
        { kind: 'technical', q: 'Walk me through how you would value a company, and tell me which method you would trust most for a business that is not yet profitable.', guide: KNOW },
        { kind: 'cv', q: 'Tell me about a time you had to form a view with incomplete information.', guide: STAR }
      ]
    },
    evercore: {
      tests: ['Why independent advisory', 'Technical basics (valuation, accounting)', 'Work ethic and resilience'],
      know: ['Independent investment bank focused on advice: M&A, restructuring, capital markets advice.', 'No lending, so advice is its product.', 'Lean deal teams.'],
      why: 'Why Evercore and independent advisory rather than a bulge-bracket bank?',
      cases: { ibd: 'A client wants to sell a division. How would you run the process and decide which buyers to approach?' },
      qs: [
        { kind: 'technical', q: 'How do the three financial statements link? Walk me through what happens if depreciation goes up by 10.', guide: KNOW },
        { kind: 'cv', q: 'Tell me about a time you kept going on something difficult when it would have been easier to stop.', guide: STAR }
      ]
    },
    jpm: {
      tests: ['Why J.P. Morgan and the specific business', 'A view on markets or a recent deal', 'Teamwork, integrity and client focus'],
      know: ['One of the largest banks in the world, with investment banking, commercial banking, markets, payments and asset & wealth management.', 'The size of its balance sheet lets it lend as well as advise.', 'Jamie Dimon’s annual letter to shareholders is widely read; know one point from the latest.'],
      why: 'Why J.P. Morgan, and why this team? Give a reason specific to J.P. Morgan rather than to any big bank.',
      qs: [
        { kind: 'motivation', q: 'J.P. Morgan can advise a client and also lend to it. When is that an advantage for the client, and when could it be a conflict?', guide: KNOW },
        { kind: 'technical', q: 'Tell me about something in the markets that has caught your attention in the last month, and why it matters for J.P. Morgan’s clients.', guide: KNOW },
        { kind: 'cv', q: 'Tell me about a time you worked in a team that disagreed. What did you do?', guide: STAR }
      ]
    },
    gs: {
      tests: ['Clear, structured answers on video (HireVue first round)', 'Motivation for the division', 'Resilience and teamwork'],
      know: ['Global investment bank: investment banking, global markets, and asset & wealth management.', 'First rounds are often recorded video interviews.', 'Be ready for “tell me about a time…” questions with tight answers.'],
      why: 'Why Goldman Sachs, and why this division specifically?',
      qs: [
        { kind: 'cv', q: 'Tell me about a time you failed. What happened, and what did you change afterwards?', guide: STAR },
        { kind: 'technical', q: 'Pick a company you follow. Is it a good investment today? Give the case for and against.', guide: KNOW }
      ]
    },
    ms: {
      tests: ['Motivation and knowledge of the division', 'Values: doing the right thing, putting clients first', 'Market awareness'],
      know: ['Investment banking, sales & trading, wealth management and investment management.', 'Wealth management is a large part of the firm (it bought E*TRADE in 2020).', 'Its stated core values include putting clients first and doing the right thing.'],
      why: 'Why Morgan Stanley? Use something specific about how the firm is built, not just its reputation.',
      qs: [
        { kind: 'motivation', q: 'Morgan Stanley has a very large wealth management business alongside investment banking. Why might that mix be valuable for the firm?', guide: KNOW },
        { kind: 'cv', q: 'Tell me about a time you did the right thing when it was not the easy option.', guide: STAR }
      ]
    },
    barclays: {
      tests: ['Why Barclays (UK and international)', 'Values (Respect, Integrity, Service, Excellence, Stewardship)', 'Commercial awareness of UK clients'],
      know: ['A UK-headquartered bank with UK retail and corporate banking, a private bank, a US consumer bank and an investment bank.', 'Its values spell RISES: Respect, Integrity, Service, Excellence, Stewardship.', 'Know a recent result or strategic change.'],
      why: 'Why Barclays rather than a US bank? Give a reason linked to its UK and international business.',
      qs: [
        { kind: 'cv', q: 'Barclays’ values include integrity and stewardship. Tell me about a time you took responsibility for something that was not strictly your job.', guide: STAR },
        { kind: 'technical', q: 'How do higher UK interest rates affect a bank like Barclays: the good and the bad?', guide: KNOW }
      ]
    },
    hsbc: {
      tests: ['International outlook', 'Why HSBC (cross-border, Asia)', 'Values and teamwork'],
      know: ['An international bank whose strength is connecting clients across countries, especially to and within Asia.', 'Banking, markets and corporate banking for international companies.', 'Its values include “we value difference” and “we succeed together”.'],
      why: 'Why HSBC? Link your answer to its international network.',
      qs: [
        { kind: 'technical', q: 'A UK company wants to start selling into Asia. What could a bank like HSBC help it with?', guide: KNOW },
        { kind: 'cv', q: 'Tell me about a time you worked with people from very different backgrounds.', guide: STAR }
      ]
    },
    citi: {
      tests: ['Why Citi (global network)', 'Understanding of transaction services', 'Teamwork and client focus'],
      know: ['A global bank present in a large number of countries.', 'Its services business (payments, cash and trade for multinationals) is a core strength.', 'Banking and markets serve the same multinational clients.'],
      why: 'Why Citi? Use its global network or services business in your answer.',
      qs: [
        { kind: 'technical', q: 'Why would a multinational company care which bank runs its payments and cash around the world?', guide: KNOW },
        { kind: 'cv', q: 'Tell me about a time you had to deliver for someone else to a tight deadline.', guide: STAR }
      ]
    },
    db: { tests: ['Why Deutsche Bank', 'European and corporate client focus', 'Markets awareness'], know: ['Germany’s largest bank: Corporate Bank, Investment Bank (including Fixed Income & Currencies), Private Bank and asset management (DWS).', 'Strong with European and German corporate clients.'], why: 'Why Deutsche Bank? Use something about its business mix or clients.', qs: [{ kind: 'technical', q: 'How might a stronger euro affect a German exporter, and what could its bank help with?', guide: KNOW }] },
    bofa: { tests: ['Why Bank of America', 'Client focus', 'Markets awareness'], know: ['One of the largest US banks: consumer banking, global banking, global markets and Merrill wealth management.'], why: 'Why Bank of America for this role?', qs: [{ kind: 'cv', q: 'Tell me about a time you built a relationship with someone who was hard to work with.', guide: STAR }] },
    ubs: { tests: ['Why UBS', 'Wealth management understanding', 'Integration and change'], know: ['The world’s largest wealth manager, with investment banking and asset management.', 'It took over Credit Suisse in 2023.'], why: 'Why UBS? Link it to its wealth management focus.', qs: [{ kind: 'motivation', q: 'UBS took over Credit Suisse in 2023. What challenges do you think combining two banks creates?', guide: KNOW }] },
    ey: {
      tests: ['Skills: how you approach work and learn', 'Judgement and professional scepticism', 'Why EY and this service line'],
      know: ['Big Four firm: assurance, consulting, strategy & transactions and tax.', 'Its purpose is “building a better working world”.', 'Prepare real examples of curiosity, collaboration, judgement and motivation for your service line.'],
      why: 'Why EY, and why this service line? Give a reason specific to EY.',
      qs: [
        { kind: 'cv', q: 'What kind of task gives you energy, and what kind drains you? Give an example of each.', guide: g('Honest answer → example → what it says about you.', ['Be genuine: there is no right answer.', 'Give a real example of each.', 'Explain what you learned about how you work best.', 'Link it to the role.']) },
        { kind: 'cv', q: 'When were you at your best? What were you doing and why did it go well?', guide: STAR },
        { kind: 'case', q: 'A client finance director pushes you to sign off a number before you have seen the evidence. What do you do?', guide: CASE }
      ]
    },
    pwc: { tests: ['Why PwC and the service line', 'Relationships and business awareness', 'Judgement'], know: ['Big Four firm: audit, tax, deals and consulting.', 'Interviews look at how you build relationships and understand business.'], why: 'Why PwC, and why this service line?', qs: [{ kind: 'technical', q: 'Pick a UK company you know. What is the biggest risk to its business right now, and how would an auditor or adviser care about it?', guide: KNOW }, { kind: 'cv', q: 'Tell me about a time you had to win someone round to your view.', guide: STAR }] },
    deloitte: { tests: ['Strengths and behaviours', 'Why Deloitte and the service line', 'Commercial awareness'], know: ['Big Four firm: audit & assurance, consulting, tax and financial advisory.', 'Early rounds often use video and strengths-style questions.'], why: 'Why Deloitte, and why this service line?', qs: [{ kind: 'cv', q: 'What do you think you are better at than most people? Give an example that proves it.', guide: STAR }, { kind: 'technical', q: 'How do you think AI will change audit or advisory work over the next five years?', guide: KNOW }] },
    kpmg: { tests: ['Values: integrity and courage', 'Judgement and scepticism', 'Why KPMG'], know: ['Big Four firm: audit, tax and advisory (including deal advisory).', 'Its values include integrity and courage: expect questions about speaking up.'], why: 'Why KPMG, and why this service line?', qs: [{ kind: 'cv', q: 'Tell me about a time you spoke up about something you thought was wrong.', guide: STAR }, { kind: 'case', q: 'You notice a colleague has made a mistake in a client file just before a deadline. What do you do?', guide: CASE }] }
  };
  bank.firmPacks = P;

  const roleKeyOf = role => Object.keys(bank.roles).find(k => bank.roles[k] === role);
  const orig = bank.buildSession;
  bank.buildSession = function (o = {}) {
    const items = orig.call(this, o);
    const key = o.firmKey, pack = P[key], firm = bank.firms[key];
    bank.pendingFirmQuestions=[]; if (!pack || !firm) return items;
    const rk = firm.roles.includes(o.roleKey) ? o.roleKey : firm.roles[0];
    const tag = 'The Desk practice scenario for ' + firm.label + '. ';
    const caseQ = pack.cases?.[rk];
    if (caseQ && items[2]?.kind === 'case') items[2] = { ...items[2], q: caseQ, hint: tag + items[2].hint, firmSpecific: true };
    if (items[4]?.kind === 'motivation' && pack.why) items[4] = { ...items[4], q: pack.why, guide: WHY, hint: tag + 'Specific beats impressive.', firmSpecific: true };
    // Two firm questions, inserted after the first five so the page's own round settings still line up.
    const rng = o.rng || Math.random, pool = [...(pack.qs || [])];
    const extra = [];
    while (pool.length && extra.length < 2) extra.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    const add = extra.map((x, i) => ({ id: key + '-pack-' + i, kind: x.kind, q: x.q, hint: tag + (x.hint || 'Answer for this firm, not any firm.'), guide: { shape: x.guide.shape, points: [...x.guide.points] }, firmSpecific: true }));
    bank.pendingFirmQuestions = add;
    return items;
  };

  // Brief card: "Your <firm> interview" (interview page and setup page).
  function brief(key) {
    const pack = P[key], firm = bank.firms[key];
    if (!pack || !firm) return null;
    const el = document.createElement('section'); el.className = 'dc-brief';
    const li = a => a.map(t => '<li>' + t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</li>').join('');
    el.innerHTML = `<div class="dc-brief-k">Your ${firm.label} interview</div><div class="dc-brief-g"><div><h4>The Desk preparation themes</h4><ul>${li(pack.tests || [])}</ul></div><div><h4>Know before you go</h4><ul>${li(pack.know || [])}</ul></div></div><p class="dc-brief-n">Your practice questions now include ${firm.label}-specific ones. Independent practice material. These are not confirmed employer questions or an internal hiring scorecard.</p>`;
    return el;
  }
  const style = document.createElement('style');
  style.textContent = `.dc-brief{background:#fff;border:1px solid #e3ddd3;border-left:4px solid #ff6a2b;border-radius:10px;padding:16px 18px;margin:12px 0}
  .dc-brief-k{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#d2541b;font-weight:700;margin-bottom:8px}
  .dc-brief-g{display:grid;grid-template-columns:1fr 1fr;gap:18px}.dc-brief h4{margin:0 0 6px;font-size:14px}.dc-brief ul{margin:0;padding-left:18px;font-size:13px;line-height:1.5}
  .dc-brief-n{margin:10px 0 0;font-size:11px;color:#6b6b6b}@media(max-width:700px){.dc-brief-g{grid-template-columns:1fr}}`;
  const mount = () => {
    document.head.appendChild(style);
    const sel = document.getElementById('firmSelect') || document.getElementById('setupFirm'); if (!sel) return;
    const place = () => {
      document.querySelectorAll('.dc-brief').forEach(x => x.remove());
      const el = brief(sel.value); if (!el) return;
      const anchor = document.querySelector('.session-context') || document.getElementById('setupFramework')?.closest('section,.card') || sel.closest('section,.card,details');
      const panel=document.getElementById('practice-panel-practitioner'); if(panel)panel.append(el);else if(document.getElementById('setupFirm')) anchor?.insertAdjacentElement('afterend',el);
    };
    let last = null; // the page sets the firm itself after loading the profile, without a change event
    setInterval(() => { if (sel.value !== last) { last = sel.value; place(); } }, 400);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
