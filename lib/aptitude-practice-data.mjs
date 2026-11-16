// The Desk: situational judgement and verbal reasoning practice.
// All scenarios and passages are original, written by The Desk for practice. They are not questions from any firm's real test.
// SJT format: pick the MOST and LEAST effective of four actions. 1 point for each match with the key (2 per scenario).
// Verbal format: judge each statement against the passage only: True, False or Cannot say.
// Practitioner sign-off needed on the SJT keys before launch (see FIRM-PACKS-REVIEW.md process).

export const SJT = {
  id: 'sjt-1',
  title: 'Situational judgement · Practice test 1',
  minutes: 20,
  intro: 'You are a first-year analyst or intern at a bank. For each situation, choose the action you think is MOST effective and the action you think is LEAST effective.',
  items: [
    {
      id: 'sjt1-1', competency: 'Prioritising',
      scenario: 'Two vice presidents each ask you for a piece of urgent work, both due by 5pm today. You realistically have time to do one of them well.',
      options: [
        'Do the work for the more senior of the two and tell the other one later that you ran out of time.',
        'Tell both of them straight away about the clash, give an honest estimate for each, and ask them (or your manager) to agree which comes first.',
        'Rush both pieces so that you hit both deadlines.',
        'Do the task you find easier first, then start the other if there is time.'
      ],
      best: 1, worst: 3,
      why: [
        'Silent prioritising leaves one VP with a missed deadline and no warning.',
        'Raising the clash early lets the people who own the priorities decide, and protects the quality of both pieces.',
        'Rushed work in banking creates errors that are costly to fix. Better than saying nothing, but not the best route.',
        'Choosing by your own convenience ignores the business need and nobody is warned. This is the least effective.'
      ]
    },
    {
      id: 'sjt1-2', competency: 'Integrity',
      scenario: 'You notice that a revenue figure in a presentation your team sent to a client yesterday was double-counted. Nobody else seems to have spotted it.',
      options: [
        'Tell the associate on the deal straight away, showing the correct figure and where it comes from.',
        'Correct the figure in the internal file so future versions are right, without mentioning it.',
        'Wait to see whether the client notices.',
        'Email the client directly with the corrected figure.'
      ],
      best: 0, worst: 1,
      why: [
        'Raising it quickly with the person responsible, with your evidence, lets the team correct it properly with the client.',
        'Quietly fixing it hides a mistake the client is relying on. This is the least effective, and an integrity issue.',
        'Waiting leaves the client relying on a wrong number and makes the eventual correction harder.',
        'Contacting the client yourself bypasses the deal team, who need to manage the correction.'
      ]
    },
    {
      id: 'sjt1-3', competency: 'Teamwork',
      scenario: 'You are working on a group project with three other interns. One of them has missed two team check-ins and has not started their section, which is due in three days.',
      options: [
        'Quietly do their section yourself so the project is finished on time.',
        'Speak to them privately, ask what is going on, and agree what they will deliver and by when.',
        'Raise it with the programme manager straight away.',
        'Mention it in the group chat so the whole team knows what is happening.'
      ],
      best: 1, worst: 3,
      why: [
        'This gets the work done but hides the problem and overloads you.',
        'A private, direct conversation is respectful, may uncover a genuine problem, and gives them a clear chance to deliver.',
        'Escalating may be needed later, but going straight to the manager skips a simple first step.',
        'Calling someone out in a group chat embarrasses them and damages the team. This is the least effective.'
      ]
    },
    {
      id: 'sjt1-4', competency: 'Client focus and compliance',
      scenario: 'A client calls and asks you for information about another deal your team is working on. You are not sure whether you are allowed to share it.',
      options: [
        'Share what you know, because keeping the client happy is the priority.',
        'Tell the client you will check and come back to them today, then ask your manager or compliance.',
        'Refuse firmly and end the call.',
        'Give a vague answer so the client does not feel brushed off.'
      ],
      best: 1, worst: 0,
      why: [
        'Sharing information you are unsure about could breach confidentiality rules. This is the least effective.',
        'Checking before answering protects the client relationship and the firm, and gives the client a clear next step.',
        'Safe, but abrupt, and it may damage the relationship unnecessarily.',
        'Vague answers can still leak information and leave the client confused.'
      ]
    },
    {
      id: 'sjt1-5', competency: 'Resilience',
      scenario: 'In your mid-internship review, your manager says your attention to detail needs to improve.',
      options: [
        'Ask for specific examples, agree a plan to improve, and ask to check in again in two weeks.',
        'Explain why the mistakes were not really your fault.',
        'Accept it without discussion and start working longer hours to double-check everything.',
        'Ask the other interns whether they received the same feedback.'
      ],
      best: 0, worst: 1,
      why: [
        'Specific examples and a plan turn feedback into improvement, and the check-in shows you take it seriously.',
        'Being defensive suggests you will not take feedback on board. This is the least effective.',
        'Shows commitment, but without understanding what went wrong you may not fix the right thing.',
        'Comparing notes does not help you improve and may look like you are seeking reassurance.'
      ]
    },
    {
      id: 'sjt1-6', competency: 'Using judgement',
      scenario: 'Your manager gives you a task with unclear instructions, then leaves for client meetings for the rest of the day.',
      options: [
        'Wait until tomorrow and ask your manager to explain.',
        'Start the task using sensible assumptions, note them down, and send your manager a short message asking them to confirm the key points.',
        'Ask an analyst who has done similar work for guidance, then carry on.',
        'Complete the whole task based on your best guess without recording any assumptions.'
      ],
      best: 1, worst: 0,
      why: [
        'Losing a whole day is the least effective option when you could make progress.',
        'You keep moving, your assumptions are visible and easy to correct, and your manager can reply between meetings.',
        'A good option: colleagues can help, though your manager may still want something different.',
        'Risky: if your guess is wrong, nobody can see why, and the work may need redoing.'
      ]
    },
    {
      id: 'sjt1-7', competency: 'Confidentiality',
      scenario: 'At a party, a friend who works at another firm asks which companies your team is advising at the moment.',
      options: [
        'Tell them in general terms without naming the companies.',
        'Politely say you cannot talk about your work.',
        'Change the subject without saying anything about it.',
        'Tell them, but ask them to keep it to themselves.'
      ],
      best: 1, worst: 3,
      why: [
        'Even general details can identify a client or a deal.',
        'A clear, polite refusal protects your clients and sets a boundary without awkwardness.',
        'Avoids disclosure, but leaves the question open and they may ask again.',
        'Sharing confidential information and asking for secrecy is a serious breach. This is the least effective.'
      ]
    },
    {
      id: 'sjt1-8', competency: 'Communication',
      scenario: 'In an internal team meeting, a senior colleague quotes a growth figure that your own analysis suggests is wrong.',
      options: [
        'Say nothing, because they are more senior.',
        'Politely say your analysis showed a different figure and offer to share your workings.',
        'Email them after the meeting to explain the difference.',
        'Mention it quietly to the colleague sitting next to you.'
      ],
      best: 1, worst: 0,
      why: [
        'Letting a possible error stand helps nobody. This is the least effective.',
        'Raising it politely while the team is discussing it means the right figure is used, and offering your workings keeps it constructive.',
        'Better than nothing, but decisions may already have been made on the wrong figure.',
        'Whispering to a colleague does not fix anything.'
      ]
    },
    {
      id: 'sjt1-9', competency: 'Managing pressure',
      scenario: 'You have worked late every night for two weeks and have started making small mistakes in your work.',
      options: [
        'Keep going: long hours are expected and it will ease off.',
        'Tell your manager, explain where each task stands, and ask for help prioritising.',
        'Call in sick tomorrow so you can rest.',
        'Ask a fellow analyst to check your work before you send it.'
      ],
      best: 1, worst: 2,
      why: [
        'Carrying on as you are risks bigger mistakes.',
        'Being open about workload, with a clear picture of your tasks, lets your manager help before quality suffers.',
        'Calling in sick when you are not ill is dishonest and leaves the team short without warning. This is the least effective.',
        'Helpful as a short-term check, but it does not solve the workload problem.'
      ]
    },
    {
      id: 'sjt1-10', competency: 'Client focus',
      scenario: 'In a client meeting, the client asks you a question you can only partly answer.',
      options: [
        'Answer the part you know, be clear about what you are not sure of, and promise the full answer by a set time.',
        'Give a confident full answer, filling the gaps with your best guess.',
        'Say nothing and let your senior colleague answer.',
        'Say you will find out, without saying when.'
      ],
      best: 0, worst: 1,
      why: [
        'Honest, useful and specific: the client gets what you know now and a clear follow-up.',
        'Guessing in front of a client risks giving wrong information they may act on. This is the least effective.',
        'Safe, but you miss the chance to add value and it may look like you are unprepared.',
        'Better than guessing, but without a timescale the client does not know when to expect an answer.'
      ]
    },
    {
      id: 'sjt1-11', competency: 'Respect and inclusion',
      scenario: 'At a team lunch, a colleague makes a joke about another teammate’s accent. A few people laugh.',
      options: [
        'Laugh along so things do not get awkward.',
        'Afterwards, check in with your teammate and, if they are comfortable, tell the colleague the comment was not okay.',
        'Report it to HR straight away without speaking to anyone.',
        'Ignore it; it was only a joke.'
      ],
      best: 1, worst: 0,
      why: [
        'Joining in signals the behaviour is acceptable. This is the least effective.',
        'Supporting your teammate and addressing the behaviour directly, at the right moment, is respectful and effective.',
        'Formal reporting may be right for repeated or serious behaviour, but doing it without checking with your teammate may not be what they want.',
        'Ignoring it lets the behaviour continue.'
      ]
    },
    {
      id: 'sjt1-12', competency: 'Improving how things are done',
      scenario: 'A weekly report you produce takes three hours by hand. You think a spreadsheet formula could cut it to twenty minutes.',
      options: [
        'Build it in your own time and switch over without telling anyone.',
        'Suggest it to your manager with an estimate of the time saved, and offer to run both versions side by side until it is checked.',
        'Keep doing it by hand; that is how it has always been done.',
        'Mention the idea to the other analysts.'
      ],
      best: 1, worst: 0,
      why: [
        'Changing how a report is produced without anyone checking it bypasses controls. This is the least effective.',
        'You show initiative while letting the change be checked properly before anyone relies on it.',
        'Misses a clear chance to improve, but does no harm.',
        'Sharing ideas is good, but it will not lead to a change on its own.'
      ]
    }
  ]
};

export const VERBAL = {
  id: 'verbal-1',
  title: 'Verbal reasoning · Practice test 1',
  minutes: 16,
  intro: 'Read each passage, then decide whether each statement is True, False or Cannot say, using only the information in the passage.',
  key: { T: 'True: the statement follows from the passage.', F: 'False: the passage says the opposite.', C: 'Cannot say: the passage does not give enough information.' },
  passages: [
    {
      id: 'v1-p1', topic: 'Banking',
      text: 'Net interest margin measures the difference between the interest a bank earns on its loans and the interest it pays on deposits, expressed as a percentage of its interest-earning assets. When central bank rates rise, banks can usually increase the rates they charge on new loans faster than they raise the rates paid to savers, so margins tend to widen at first. This effect rarely lasts. As savers move money into higher-paying fixed-term accounts, the cost of deposits catches up, and competition for borrowers puts pressure on lending rates. Analysts therefore watch the “deposit beta”, the share of a central bank rate rise that is passed on to depositors, as an early sign of where margins are heading. A bank with a large base of current accounts, which typically pay little or no interest, is usually less exposed to rising deposit costs than one that relies on savings accounts and wholesale funding.',
      statements: [
        { id: 'v1-1', text: 'When central bank rates rise, bank margins usually widen at first.', answer: 'T', why: 'The passage says “margins tend to widen at first”.' },
        { id: 'v1-2', text: 'A high deposit beta means a bank passes on only a small share of a rate rise to its savers.', answer: 'F', why: 'Deposit beta is the share that IS passed on, so a high beta means more is passed on, not less.' },
        { id: 'v1-3', text: 'Banks that rely on wholesale funding generally have higher net interest margins than banks with many current accounts.', answer: 'C', why: 'The passage only says such banks are more exposed to rising deposit costs. It says nothing about which has the higher margin overall.' },
        { id: 'v1-4', text: 'The widening of margins after a rate rise is usually permanent.', answer: 'F', why: 'The passage says “this effect rarely lasts”.' }
      ]
    },
    {
      id: 'v1-p2', topic: 'Sustainable finance',
      text: 'Unlike a green loan, where the money must be spent on a specific environmental project, a sustainability-linked loan can be used for general corporate purposes. Instead, its interest rate is tied to the borrower meeting agreed sustainability targets, such as cutting carbon emissions by a set percentage. If the targets are met, the margin falls, typically by a small amount such as 0.05 percentage points; if they are missed, it may rise by a similar amount. Critics argue that some targets have been set too low to be meaningful, which has led lenders to ask for independent verification of borrowers’ performance. Supporters respond that even a small change in borrowing costs focuses senior management’s attention, because the targets are disclosed publicly and missing them carries a reputational cost.',
      statements: [
        { id: 'v1-5', text: 'Money from a sustainability-linked loan must be spent on an environmental project.', answer: 'F', why: 'That describes a green loan. A sustainability-linked loan “can be used for general corporate purposes”.' },
        { id: 'v1-6', text: 'Lenders have started asking for independent checks on whether borrowers meet their targets.', answer: 'T', why: 'The passage says concerns about weak targets “led lenders to ask for independent verification”.' },
        { id: 'v1-7', text: 'Sustainability-linked loans are cheaper for borrowers than green loans.', answer: 'C', why: 'The passage never compares the cost of the two types of loan.' },
        { id: 'v1-8', text: 'Supporters believe publishing the targets gives companies a reputational reason to meet them.', answer: 'T', why: 'The passage says targets are disclosed publicly and “missing them carries a reputational cost”.' }
      ]
    },
    {
      id: 'v1-p3', topic: 'Workplace',
      text: 'In 2024 a London asset manager asked its staff to work in the office for at least three days a week, up from two. The firm said the change was intended to help junior employees learn from experienced colleagues, many of whom had previously chosen to work from home on the same days as each other. Internal survey results published by the firm showed that 62% of staff supported the policy, with support highest among employees in their first three years. However, the firm also reported that voluntary departures among mid-career staff rose in the six months after the announcement. Management has said it will review the policy after a year, but has not committed to changing it.',
      statements: [
        { id: 'v1-9', text: 'Before the change, staff were expected in the office two days a week.', answer: 'T', why: 'The new rule was three days, “up from two”.' },
        { id: 'v1-10', text: 'Most of the firm’s staff supported the new policy.', answer: 'T', why: '62% supported it, which is a majority.' },
        { id: 'v1-11', text: 'The new policy caused more mid-career staff to leave.', answer: 'C', why: 'Departures rose after the announcement, but the passage does not say the policy caused them.' },
        { id: 'v1-12', text: 'Management has committed to reversing the policy after a year.', answer: 'F', why: 'Management will review it but “has not committed to changing it”.' }
      ]
    },
    {
      id: 'v1-p4', topic: 'Retail investing',
      text: 'Commission-free investing apps have made it cheaper and easier for individuals to buy shares, and the number of retail investment accounts in the UK grew sharply after 2020. These apps earn money in other ways: some charge a currency conversion fee when customers buy overseas shares, some earn interest on cash held in customer accounts, and some offer paid subscription tiers. Regulators have raised concerns that features such as celebratory animations and push notifications can encourage frequent trading. Research on retail investors has generally found that those who trade more often tend to earn lower returns after costs, although the size of the effect varies between studies. In response, several platforms have added warnings before customers make high-risk trades.',
      statements: [
        { id: 'v1-13', text: 'All commission-free investing apps charge a currency conversion fee.', answer: 'C', why: 'The passage says some charge a conversion fee. It does not establish whether all do.' },
        { id: 'v1-14', text: 'Research generally finds that investors who trade more often earn lower returns after costs.', answer: 'T', why: 'This is stated directly in the passage.' },
        { id: 'v1-15', text: 'The number of UK retail investment accounts has grown every year since 2020.', answer: 'C', why: 'The passage says numbers “grew sharply after 2020”, not that they grew in every single year.' },
        { id: 'v1-16', text: 'Some platforms now show a warning before a customer makes a high-risk trade.', answer: 'T', why: '“Several platforms have added warnings before customers make high-risk trades.”' }
      ]
    }
  ]
};

// Firm framing shown above the tests. Keep it to what each firm says publicly, and always link the firm's own guidance.
export const FIRM_NOTES = {
  db: { name: 'Deutsche Bank', note: 'Deutsche Bank’s online stage can include situational judgement and ability tests alongside a behavioural questionnaire. Your invitation sets out exactly which tests you will take and how long you have.', link: 'https://careers.db.com/students-graduates/your-application/index?language_id=1' }
};

// How many items free users can try before the membership prompt.
export const FREE = { sjt: 4, verbal: 4 };

import {EXTRA_SJT,EXTRA_VERBAL} from './aptitude-practice-extra.mjs';
SJT.items.push(...EXTRA_SJT);
SJT.minutes=40;
SJT.title='Situational judgement practice';
VERBAL.passages.push(...EXTRA_VERBAL);
VERBAL.minutes=32;
VERBAL.title='Verbal reasoning practice';
