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
      tests: ['Strengths: what energises you and what you do well', 'Judgement and professional scepticism', 'Why EY and this service line'],
      know: ['Big Four firm: assurance, consulting, strategy & transactions and tax.', 'Its purpose is “building a better working world”.', 'EY is known for strengths-based questions: what you enjoy and do well, not only past examples.'],
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
  // What real candidates reported (Glassdoor and similar, mostly 2024–26, paraphrased, never copied).
  // n = how many of the reports we read mention it. Practitioners review before students see it as advice.
  const R = {
    rothschild: { checked: 'Nov 2026', format: ['One-to-one first round (analyst + associate): CV, motivation, technicals', 'Assessment centre with commercial awareness and market news', 'Some offices run a group investment-case discussion'],
      seen: [['Why Rothschild / what sets it apart from other banks', 2], ['Valuation: DCF, methods and their assumptions', 2], ['Equity bridge (enterprise value to equity value)', 1], ['Market news and commercial awareness', 1], ['Restructuring team is more technical than M&A', 1]],
      add: [{ kind: 'technical', q: 'Walk me from enterprise value to equity value. What sits in the bridge, and why?', guide: KNOW }, { kind: 'motivation', q: 'What sets Rothschild & Co apart from the other banks you are applying to?', guide: WHY }],
      sources: [['Glassdoor, London analyst Apr 2025 + others', 'https://www.glassdoor.ie/Interview/Rothschild-and-Co-Interview-E9944-RVW96916386.htm'], ['WallStreetOasis thread (older)', 'https://www.wallstreetoasis.com/forum/investment-banking/rothschild-first-round']] },
    blackrock: { checked: 'Nov 2026', format: ['HireVue first: about 3 questions, roughly 2 minutes each with prep time', 'Then several interviews, often framed around BlackRock’s principles, plus scenario questions', 'Some roles add a task and a final round'],
      seen: [['Why BlackRock', 3], ['A recent global market or economic event and its impact', 2], ['CV and past examples tied to BlackRock’s principles', 1], ['Mostly behavioural, light technicals', 2]],
      add: [{ kind: 'technical', q: 'Pick a recent global market event. What happened, and what does it mean for investors or businesses?', guide: KNOW }],
      sources: [['Glassdoor, London analyst reviews 2024–26', 'https://www.glassdoor.ie/Interview/BlackRock-Interview-E9331-RVW91379954.htm'], ['Glassdoor, further reviews', 'https://www.glassdoor.com/Interview/BlackRock-Interview-E9331-RVW98487490.htm']] },
    jpm: { checked: 'Nov 2026', format: ['London IB summer analyst: group activity, two fit interviews and one technical', 'Elsewhere: HireVue (about 3 questions) then a superday of three interviews'],
      seen: [['Walk through the three financial statements', 2], ['Mix of fit and technical in each round', 3], ['Commitment: would you accept an offer?', 1]],
      add: [{ kind: 'technical', q: 'Walk me through the three financial statements and how they link.', guide: KNOW }],
      sources: [['Glassdoor, IB summer analyst 2026', 'https://www.glassdoor.ca/Interview/J-P-Morgan-Interview-E145-RVW102774299.htm']] },
    lazard: { checked: 'Nov 2026', format: ['London first round: about three behavioural questions, no technicals', 'Other offices: technical phone screens (e.g. valuing a drug with a DCF)'],
      seen: [['Why investment banking', 1], ['DCF in a sector context', 1], ['Interviewers push back on answers', 1]],
      add: [], sources: [['Glassdoor, summer analyst 2025–26', 'https://www.glassdoor.com/Interview/Lazard-Interview-E5784-RVW100668965.htm']] },
    evercore: { checked: 'Nov 2026', format: ['London: CV screen, video interview, first round with HR plus technicals, assessment centre', 'US rounds are heavily technical (incl. LBO-style cases)'],
      seen: [['Accretion / dilution', 1], ['Why Evercore and which industry', 2], ['Hard technicals', 3]],
      add: [{ kind: 'technical', q: 'A company buys another using shares. How would you work out whether the deal is accretive or dilutive to earnings per share?', guide: KNOW }],
      sources: [['Glassdoor, summer analyst 2025–26', 'https://www.glassdoor.com.au/Interview/Evercore-Interview-E2725411-RVW101217635.htm']] },
    ms: { checked: 'Nov 2026', format: ['Online assessment, HireVue (3–5 questions), phone interview, assessment centre of three interviews', 'Reports are for Sales & Trading'],
      seen: [['Why Morgan Stanley / why this division', 3], ['Current market news', 2], ['Pitch a stock or a quick trade idea', 1], ['Core values; a time you failed; handling pressure', 2], ['Brain teasers', 1]],
      add: [{ kind: 'technical', q: 'Give me a quick trade idea: what, why now, and how you would know you are wrong.', guide: KNOW }],
      sources: [['Glassdoor, S&T summer analyst 2025–26', 'https://www.glassdoor.sg/Interview/Morgan-Stanley-Interview-E2282-RVW103595519.htm']] },
    gs: { checked: 'Nov 2026', format: ['HireVue (one report: 6 questions, 90 seconds each, mostly behavioural), then a superday of three interviews', 'Reports are for Sales & Trading'],
      seen: [['Know your CV in depth', 2], ['Views on markets and the economy', 2], ['Options / probability for markets roles', 2], ['Mostly behavioural', 2]],
      add: [], sources: [['Glassdoor, S&T summer analyst 2026', 'https://www.glassdoor.ca/Interview/Goldman-Sachs-Interview-E2800-RVW103673692.htm']] },
    barclays: { checked: 'Nov 2026', format: ['London IB: case study, then three interviews (one goes through your case study)'],
      seen: [['Why Barclays (over other banks)', 1], ['Enterprise vs equity value', 2], ['A deal you have followed', 1], ['Mostly behavioural; easy-to-moderate technicals', 2]],
      add: [{ kind: 'motivation', q: 'Why Barclays rather than a US bank like Goldman Sachs?', guide: WHY }],
      sources: [['Glassdoor, IB summer analyst 2026', 'https://www.glassdoor.sg/Interview/Barclays-Interview-E3456-RVW102790221.htm']] },
    citi: { checked: 'Nov 2026', format: ['London: online tests (Plum), first round of two interviews, assessment centre of three'],
      seen: [['Introduce yourself; why banking and why Citi', 1], ['Standard IB technicals', 2], ['Case study with comps (some offices)', 1]],
      add: [], sources: [['Glassdoor, IB summer analyst 2025–26', 'https://www.glassdoor.com/Interview/Citi-Interview-E8843-RVW101158359.htm']] },
    db: { checked: 'Nov 2026', format: ['London: three rounds (case study, technical, competency), about 45 minutes each, associate to MD'],
      seen: [['DCF', 1], ['Equity value to enterprise value bridge', 1], ['Past experience and industry knowledge', 1]],
      add: [{ kind: 'technical', q: 'Talk me through how you would build a simple DCF, step by step.', guide: KNOW }],
      sources: [['Glassdoor, IB summer analyst 2025–26', 'https://www.glassdoor.sg/Interview/Deutsche-Bank-Interview-E3150-RVW95052476.htm']] },
    bofa: { checked: 'Nov 2026', format: ['London first round: about 25 minutes with an analyst, conversational'],
      seen: [['Maths brain teasers', 1], ['Behavioural questions', 2], ['Financial statements and value bridges (US)', 1]],
      add: [], sources: [['Glassdoor, IB summer analyst', 'https://www.glassdoor.com.au/Interview/Bank-of-America-Investment-Banking-Summer-Analyst-Interview-Questions-EI_IE8874.0,15_KO16,49.htm']] },
    ubs: { checked: 'Nov 2026', format: ['Online tests (numerical from charts, reading true/false), then HireVue: 5 questions, 30s to prepare, 2 min to answer'],
      seen: [['Behavioural only at video stage', 1], ['A time you worked outside your comfort zone', 1], ['Where you see yourself in five years', 1]],
      add: [{ kind: 'cv', q: 'Tell me about a time you had to work outside your comfort zone.', guide: STAR }],
      sources: [['Glassdoor, graduate programme 2025–26', 'https://www.glassdoor.ca/Interview/UBS-Interview-E3419-RVW97951128.htm']] },
    hsbc: { checked: 'Nov 2026', format: ['Online job simulation (situational judgement, written and timed video answers), HireVue interviews, then an assessment centre'],
      seen: [['Values-based situational questions', 2], ['Prioritising tasks / building a timetable on the spot', 2], ['Recent events and why they interest you', 1], ['Wealth-client case in a video interview', 1]],
      add: [{ kind: 'case', q: 'You are given five tasks from three people, all due today. How do you decide the order, and who do you tell?', guide: CASE }],
      sources: [['Glassdoor, Global Markets summer intern', 'https://www.glassdoor.ie/Interview/HSBC-Interview-E3482-RVW71241352.htm'], ['Glassdoor, summer analyst overview', 'https://static.glassdoor.es/Interview/HSBC-Summer-Analyst-Interview-Questions-EI_IE3482.0,4_KO5,19_IP2.htm']] },
    ey: { checked: 'Nov 2026', format: ['Online assessment: situational judgement, reasoning, numerical, recorded video answers', 'A written email task analysing a profit and loss statement', 'Assessment centre: group task, presentation, interview (often with a partner)'],
      seen: [['Spot errors in financial data and explain them in a professional email', 1], ['Link answers to EY’s values, especially integrity', 1], ['Group problem-solving', 2]],
      add: [{ kind: 'case', q: 'You are sent a profit and loss summary with two numbers that do not add up. Talk me through the email you would send your manager.', guide: CASE }],
      sources: [['Glassdoor, Audit graduate London 2026 + Edinburgh', 'https://static.glassdoor.de/Interview/EY-Audit-Graduate-Trainee-Interview-Questions-EI_IE2784.0,2_KO3,25.htm']] },
    pwc: { checked: 'Nov 2026', format: ['Online assessment, recorded video interview (about 4 questions, 2 minutes each), virtual assessment centre, partner interview'],
      seen: [['Behavioural and motivational questions', 3], ['Detailed, specific examples (partner pushes)', 1], ['Understand the role and PwC’s career path', 1], ['Timed numerical questions', 1]],
      add: [{ kind: 'motivation', q: 'What will you actually be doing in your first two years at PwC, and what qualification will you be working towards?', guide: KNOW }],
      sources: [['Glassdoor, Audit graduate 2026', 'https://static.glassdoor.de/Interview/PwC-Interview-E8450-RVW103946350.htm']] },
    deloitte: { checked: 'Nov 2026', format: ['London audit: presentation on set questions, then a motivational and strengths-based interview', 'Some interviews go into the ACA qualification'],
      seen: [['Strengths and motivation', 2], ['Knowledge of the ACA qualification', 1], ['Competency questions', 1]],
      add: [{ kind: 'motivation', q: 'What is the ACA, how is it structured, and why does it matter for this role?', guide: KNOW }],
      sources: [['Glassdoor, Audit London 2024–26', 'https://www.glassdoor.com.au/Interview/Deloitte-Interview-E10177265-RVW92951198.htm']] },
    kpmg: { checked: 'Nov 2026', format: ['Proctored online tests (situational, logical, numerical), recorded strengths-based video interview, assessment centre', 'Assessment centre: group exercise (e.g. recommend a strategy for KPMG), then a partner interview'],
      seen: [['Why KPMG and why this role', 1], ['Time management', 1], ['Group strategy exercise', 1]],
      add: [{ kind: 'case', q: 'In a group of four you have 30 minutes to recommend one new service a firm like KPMG should launch. How would you run the discussion?', guide: CASE }],
      sources: [['Glassdoor, Graduate Audit UK 2025–26', 'https://www.glassdoor.ie/Interview/KPMG-Interview-E2867-RVW100390018.htm']] }
  };
  for (const [k, r] of Object.entries(R)) if (P[k]) { P[k].reports = r; P[k].qs = [...(P[k].qs || []), ...r.add.map(x => ({ ...x, sourced: true }))]; }
  bank.firmPacks = P;

  const roleKeyOf = role => Object.keys(bank.roles).find(k => bank.roles[k] === role);
  const orig = bank.buildSession;
  bank.buildSession = function (o = {}) {
    const items = orig.call(this, o);
    const key = o.firmKey, pack = P[key], firm = bank.firms[key];
    if (!pack || !firm) return items;
    const rk = firm.roles.includes(o.roleKey) ? o.roleKey : firm.roles[0];
    const tag = 'Likely at ' + firm.label + ' (The Desk’s view). ';
    const caseQ = pack.cases?.[rk];
    if (caseQ && items[2]?.kind === 'case') items[2] = { ...items[2], q: caseQ, hint: tag + items[2].hint, firmSpecific: true };
    if (items[4]?.kind === 'motivation' && pack.why) items[4] = { ...items[4], q: pack.why, guide: WHY, hint: tag + 'Specific beats impressive.', firmSpecific: true };
    // Two firm questions, inserted after the first five so the page's own round settings still line up.
    const rng = o.rng || Math.random, pool = [...(pack.qs || [])];
    const extra = [];
    // One question candidates actually reported (if we have one), then one more from the pack.
    const takeFrom = list => list.length ? pool.splice(pool.indexOf(list[Math.floor(rng() * list.length)]), 1)[0] : null;
    const first = takeFrom(pool.filter(x => x.sourced)); if (first) extra.push(first);
    while (pool.length && extra.length < 2) extra.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    const add = extra.map((x, i) => ({ id: key + '-pack-' + i, kind: x.kind, q: x.q, hint: (x.sourced ? 'Reported by recent ' + firm.label + ' candidates. ' : tag) + (x.hint || 'Answer for this firm, not any firm.'), guide: { shape: x.guide.shape, points: [...x.guide.points] }, firmSpecific: true }));
    items.splice(Math.min(5, items.length), 0, ...add);
    return items;
  };

  // Brief card: "Your <firm> interview" (interview page and setup page).
  function brief(key) {
    const pack = P[key], firm = bank.firms[key];
    if (!pack || !firm) return null;
    const el = document.createElement('section'); el.className = 'dc-brief';
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const li = a => a.map(t => '<li>' + t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])) + '</li>').join('');
    const r = pack.reports;
    const linkList = r ? r.sources.map(([t, u]) => '<a href="' + u + '" target="_blank" rel="noopener noreferrer">' + esc(t) + '</a>').join(' · ') : '';
    const reported = r ? `<div class="dc-brief-r"><h4>What recent candidates reported</h4><ul>${r.format.map(t => '<li>' + esc(t) + '</li>').join('')}</ul><ul class="dc-brief-seen">${r.seen.map(([t, n]) => '<li><span>' + esc(t) + '</span><b>' + n + (n === 1 ? ' report' : ' reports') + '</b></li>').join('')}</ul><p class="dc-brief-n">From public candidate reviews, checked ${esc(r.checked)}. Individual experiences, paraphrased; processes change. Sources: ${linkList}</p></div>` : '';
    el.innerHTML = `<div class="dc-brief-k">Your ${firm.label} interview</div><div class="dc-brief-g"><div><h4>What ${firm.label} interviews tend to test</h4><ul>${li(pack.tests || [])}</ul></div><div><h4>Know before you go</h4><ul>${li(pack.know || [])}</ul></div></div>${reported}<p class="dc-brief-n">Your practice questions now include ${firm.label}-specific ones${r ? ', including ones recent candidates reported' : ''}. The Desk’s view, reviewed by our practitioners; not confirmed employer questions.</p>`;
    return el;
  }
  const style = document.createElement('style');
  style.textContent = `.dc-brief{background:#fff;border:1px solid #e3ddd3;border-left:4px solid #ff6a2b;border-radius:10px;padding:16px 18px;margin:12px 0}
  .dc-brief-k{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#d2541b;font-weight:700;margin-bottom:8px}
  .dc-brief-g{display:grid;grid-template-columns:1fr 1fr;gap:18px}.dc-brief h4{margin:0 0 6px;font-size:14px}.dc-brief ul{margin:0;padding-left:18px;font-size:13px;line-height:1.5}
  .dc-brief-n{margin:10px 0 0;font-size:11px;color:#6b6b6b}.dc-brief-n a{color:#6b6b6b}.dc-brief-r{margin-top:14px;padding-top:12px;border-top:1px solid #eee7dd}.dc-brief-seen{list-style:none;padding:0!important;margin-top:8px!important}.dc-brief-seen li{display:flex;justify-content:space-between;gap:10px;border-bottom:1px dashed #eee7dd;padding:4px 0}.dc-brief-seen b{font-size:11px;color:#9a3412;white-space:nowrap}@media(max-width:700px){.dc-brief-g{grid-template-columns:1fr}}`;
  const mount = () => {
    document.head.appendChild(style);
    const sel = document.getElementById('firmSelect') || document.getElementById('setupFirm'); if (!sel) return;
    const place = () => {
      document.querySelectorAll('.dc-brief').forEach(x => x.remove());
      const el = brief(sel.value); if (!el) return;
      const anchor = document.querySelector('.session-context') || document.getElementById('setupFramework')?.closest('section,.card') || sel.closest('section,.card,details');
      anchor ? anchor.insertAdjacentElement('afterend', el) : null;
    };
    let last = null; // the page sets the firm itself after loading the profile, without a change event
    setInterval(() => { if (sel.value !== last) { last = sel.value; place(); } }, 400);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
