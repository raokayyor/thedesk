// Application question library: seed, researched 23 Nov 2026.
// Most banks' written questions sit behind the application login, so this seed is mostly
// "reported" (third-party guides and candidate reports), not "official".
// confidence: 'official' (on the firm's own page) | 'reported' (third-party guide or candidate report)
//             | 'student' (pasted by our students from the live form; promote when 3+ match)
// stage: 'form' (written application) | 'video' (HireVue / recorded) | 'interview'
// Verify every 'reported' item against the live form before treating it as exact wording.
// Word limits are only set where a source states one, and stay null otherwise.

export const QUESTION_THEMES = {
  whyFirm: 'Why this firm, rather than a competitor?',
  whyDivision: 'Why this division or programme?',
  aboutYou: 'Tell me about yourself / walk me through your CV',
  leadership: 'A time you led a group or took responsibility',
  teamwork: 'A time you worked in a team',
  challenge: 'A time you faced a challenge, setback or failure',
  integrity: 'A time you showed integrity or did the right thing',
  commercial: 'A market story, deal or trend you have followed',
  values: "Which of the firm's values resonates with you, and why"
};

export const APPLICATION_QUESTIONS = [
  { firm: 'Goldman Sachs', programme: 'Summer Analyst (EMEA)', stage: 'form', theme: 'whyFirm',
    text: 'Why Goldman Sachs?', wordLimit: 300, confidence: 'reported',
    source: 'https://www.getsmartresume.com/article/goldman-sachs-analyst-programs', note: 'Short-answer question reported; the limit comes from one third-party guide. Verify on the live form.' },
  { firm: 'Goldman Sachs', programme: 'Summer Analyst (EMEA)', stage: 'video', theme: 'aboutYou',
    text: 'Walk me through your resume.', wordLimit: null, confidence: 'reported',
    source: 'https://www.glassdoor.co.uk/Interview/Goldman-Sachs-Investment-Banking-Summer-Analyst-Interview-Questions-EI_IE2800.0,13_KO14,47.htm', note: 'HireVue reported as about 5 behavioural questions.' },
  { firm: 'Goldman Sachs', programme: 'Summer Analyst (EMEA)', stage: 'video', theme: 'whyFirm',
    text: 'Why do you want to work at Goldman Sachs?', wordLimit: null, confidence: 'reported',
    source: 'https://www.glassdoor.co.uk/Interview/Goldman-Sachs-Investment-Banking-Summer-Analyst-Interview-Questions-EI_IE2800.0,13_KO14,47.htm' },

  { firm: 'J.P. Morgan', programme: 'Summer Internship (London)', stage: 'form', theme: 'whyFirm',
    text: 'Motivation and competency questions with word limits (exact wording behind login).', wordLimit: null, confidence: 'reported',
    source: 'https://www.finbound.org/blog/jp-morgan-summer-internship-application-guide' },
  { firm: 'J.P. Morgan', programme: 'Summer Internship (London)', stage: 'video', theme: 'whyFirm',
    text: 'Why J.P. Morgan, and why this business area?', wordLimit: null, confidence: 'reported',
    source: 'https://www.glassdoor.co.uk/Interview/J-P-Morgan-Summer-Internship-Interview-Questions-EI_IE145.0,10_KO11,28.htm' },
  { firm: 'J.P. Morgan', programme: 'Summer Internship (London)', stage: 'video', theme: 'commercial',
    text: 'What market trends are affecting this business area?', wordLimit: null, confidence: 'reported',
    source: 'https://www.glassdoor.co.uk/Interview/J-P-Morgan-Summer-Intern-Interview-Questions-EI_IE145.0,10_KO11,24.htm' },

  { firm: 'Barclays', programme: 'Banking Summer Internship 2027 (London)', stage: 'form', theme: 'whyFirm',
    text: 'Motivation and competency questions, word-limited (exact wording behind login).', wordLimit: null, confidence: 'reported',
    source: 'https://ep-advisory.com/blog/barclays-investment-banking-summer-analyst-application/', note: 'Barclays warns "You have limited space on your application." Values: resourcefulness, teamwork, enthusiasm, entrepreneurial approach (official listing).' },
  { firm: 'Barclays', programme: 'Banking Summer Internship 2027 (London)', stage: 'video', theme: 'integrity',
    text: 'Tell me about a time you showed integrity or maintained confidentiality.', wordLimit: null, confidence: 'reported',
    source: 'https://www.glassdoor.com/Interview/Barclays-Summer-Intern-Interview-Questions-EI_IE3456.0,8_KO9,22.htm' },
  { firm: 'Barclays', programme: 'Banking Summer Internship 2027 (London)', stage: 'video', theme: 'leadership',
    text: 'Name a time when you showed leadership or solved a conflict.', wordLimit: null, confidence: 'reported',
    source: 'https://www.glassdoor.com/Interview/Barclays-Summer-Intern-Interview-Questions-EI_IE3456.0,8_KO9,22.htm' },

  { firm: 'Morgan Stanley', programme: 'IB Summer Analyst 2027 (London)', stage: 'form', theme: 'whyFirm',
    text: 'CV and cover letter (questions behind login).', wordLimit: null, confidence: 'reported',
    source: 'https://www.glassdoor.com/Interview/Morgan-Stanley-IB-Summer-Analyst-Interview-Questions-EI_IE2282.0,14_KO15,32.htm' },
  { firm: 'Morgan Stanley', programme: 'IB Summer Analyst 2027 (London)', stage: 'video', theme: 'leadership',
    text: 'One time you led people towards a goal: what you did, how it ended, and what you would change.', wordLimit: null, confidence: 'reported',
    source: 'https://ep-advisory.com/blog/morgan-stanley-investment-banking-summer-analyst-application/' },
  { firm: 'Morgan Stanley', programme: 'IB Summer Analyst 2027 (London)', stage: 'video', theme: 'commercial',
    text: 'Tell me about a deal Morgan Stanley advised on recently.', wordLimit: null, confidence: 'reported',
    source: 'https://ep-advisory.com/blog/morgan-stanley-investment-banking-summer-analyst-application/' },

  { firm: 'Deutsche Bank', programme: 'Spring Internship 2027 (London)', stage: 'form', theme: 'whyFirm',
    text: 'Cover letter or motivational questions.', wordLimit: null, confidence: 'reported',
    source: 'https://offertutoring.com/blogs/ourjournal/deutsche-bank-spring-week-2027-application-interview-guide' },
  { firm: 'Deutsche Bank', programme: 'Spring Internship 2027 (London)', stage: 'video', theme: 'whyDivision',
    text: 'Why this role at DB, why this division, and what do you think you will learn from the programme?', wordLimit: null, confidence: 'reported',
    source: 'https://ourgen.uk/insights/application-process-for-spring-intern-at-deutsche-bank-in-london' },

  { firm: 'KPMG', programme: 'UK graduate programmes 2026-27', stage: 'form', theme: 'whyFirm',
    text: 'Motivational questions section in the online application.', wordLimit: null, confidence: 'reported',
    source: 'https://www.graduatesfirst.com/kpmg-job-tests' },
  { firm: 'KPMG', programme: 'UK graduate programmes 2026-27', stage: 'video', theme: 'values',
    text: 'Tell me an area of strength that you think aligns with KPMG values.', wordLimit: null, confidence: 'reported',
    source: 'https://www.graduatesfirst.com/kpmg-job-tests' },

  { firm: 'PwC', programme: 'UK graduate programmes', stage: 'form', theme: 'whyFirm',
    text: 'Reasons you are interested in working at PwC; what you think you will do in your first year.', wordLimit: null, confidence: 'reported',
    source: 'https://www.wikijob.co.uk/interview-advice/company-interview-questions/pwc', note: 'Older guide. Verify on the live form.' },

  { firm: 'Deloitte', programme: 'UK Early Careers 2026-27', stage: 'interview', theme: 'whyFirm',
    text: 'Why Deloitte, and not another firm?', wordLimit: null, confidence: 'reported',
    source: 'https://ep-advisory.com/blog/deloitte-mergers-acquisitions-graduate-application-process/', note: 'Deloitte: strict one application per year; the form will not save progress (quoted from ads in the guide).' }
];
