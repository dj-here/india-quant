import { prisma } from './index';
import bcrypt from 'bcryptjs';

export const assessmentQuestions = [
  // ==========================================
  // SECTION 1: QUANTITATIVE APTITUDE (15 Questions)
  // ==========================================
  {
    section: 'QUANT',
    subTopic: 'Time and Work',
    difficulty: 'EASY',
    questionText: 'A can complete a piece of work in 12 days and B can do it in 24 days. If they work together, in how many days will the work be completed?',
    codeSnippet: null,
    options: JSON.stringify(['6 days', '8 days', '10 days', '16 days']),
    correctAnswer: 1, // 8 days: 1/12 + 1/24 = 3/24 = 1/8
    explanation: 'A\'s 1-day work = 1/12. B\'s 1-day work = 1/24. Combined 1-day work = 1/12 + 1/24 = 3/24 = 1/8. Hence, together they take 8 days.'
  },
  {
    section: 'QUANT',
    subTopic: 'Time and Work',
    difficulty: 'MEDIUM',
    questionText: 'A and B can do a job in 15 days and 10 days respectively. They began the work together, but after 2 days B had to leave. In how many more days will A finish the remaining work?',
    codeSnippet: null,
    options: JSON.stringify(['8 days', '10 days', '11 days', '12 days']),
    correctAnswer: 1, // 10 days
    explanation: 'Work done in 2 days = 2 * (1/15 + 1/10) = 2 * (5/30) = 1/3. Remaining work = 1 - 1/3 = 2/3. Time taken by A alone = (2/3) / (1/15) = 10 days.'
  },
  {
    section: 'QUANT',
    subTopic: 'Percentages & Profit/Loss',
    difficulty: 'EASY',
    questionText: 'An article is purchased for ₹450 and sold for ₹540. What is the percentage profit earned on the cost price?',
    codeSnippet: null,
    options: JSON.stringify(['15%', '18%', '20%', '25%']),
    correctAnswer: 2, // 20%
    explanation: 'Profit = ₹540 - ₹450 = ₹90. Profit % = (90 / 450) * 100 = 20%.'
  },
  {
    section: 'QUANT',
    subTopic: 'Percentages & Profit/Loss',
    difficulty: 'MEDIUM',
    questionText: 'A shopkeeper marks an article 30% above the cost price and then allows a discount of 10% on the marked price. What is the net profit percentage?',
    codeSnippet: null,
    options: JSON.stringify(['17%', '20%', '21%', '23%']),
    correctAnswer: 0, // 17%
    explanation: 'Let CP = 100. MP = 130. Discount = 10% of 130 = 13. SP = 130 - 13 = 117. Profit % = 17%.'
  },
  {
    section: 'QUANT',
    subTopic: 'Time, Speed and Distance',
    difficulty: 'EASY',
    questionText: 'A train traveling at 72 km/h crosses an electric pole in 15 seconds. What is the length of the train?',
    codeSnippet: null,
    options: JSON.stringify(['250 meters', '300 meters', '360 meters', '400 meters']),
    correctAnswer: 1, // 300 meters
    explanation: 'Speed in m/s = 72 * (5/18) = 20 m/s. Distance (train length) = Speed * Time = 20 m/s * 15 s = 300 meters.'
  },
  {
    section: 'QUANT',
    subTopic: 'Time, Speed and Distance',
    difficulty: 'MEDIUM',
    questionText: 'A person drives from City A to City B at 60 km/h and returns from City B to City A along the same route at 40 km/h. What is the average speed for the entire round trip?',
    codeSnippet: null,
    options: JSON.stringify(['48 km/h', '50 km/h', '52 km/h', '45 km/h']),
    correctAnswer: 0, // 48 km/h
    explanation: 'Harmonic mean formula for equal distances: Avg Speed = (2 * S1 * S2) / (S1 + S2) = (2 * 60 * 40) / (60 + 40) = 4800 / 100 = 48 km/h.'
  },
  {
    section: 'QUANT',
    subTopic: 'Ratio and Proportion',
    difficulty: 'EASY',
    questionText: 'The ratio of boys to girls in a college batch of 180 students is 5 : 4. How many girls are in the batch?',
    codeSnippet: null,
    options: JSON.stringify(['70', '80', '90', '100']),
    correctAnswer: 1, // 80
    explanation: 'Total ratio parts = 5 + 4 = 9. Girls = (4 / 9) * 180 = 80.'
  },
  {
    section: 'QUANT',
    subTopic: 'Alligation and Mixtures',
    difficulty: 'MEDIUM',
    questionText: 'In what ratio must tea worth ₹180 per kg be mixed with tea worth ₹230 per kg so that the resulting mixture is worth ₹200 per kg?',
    codeSnippet: null,
    options: JSON.stringify(['3 : 2', '2 : 3', '3 : 4', '4 : 3']),
    correctAnswer: 0, // 3 : 2
    explanation: 'By rule of alligation: (Costlier - Mean) : (Mean - Cheaper) = (230 - 200) : (200 - 180) = 30 : 20 = 3 : 2.'
  },
  {
    section: 'QUANT',
    subTopic: 'Permutation and Combination',
    difficulty: 'MEDIUM',
    questionText: 'In how many different ways can the letters of the word "CAMPUS" be arranged such that the vowels always appear together?',
    codeSnippet: null,
    options: JSON.stringify(['120', '240', '360', '720']),
    correctAnswer: 1, // 240
    explanation: 'Vowels are A, U (2 vowels). Treat (AU) as 1 unit. Total units = {C, M, P, S, (AU)} = 5 units. Arrangements = 5! * 2! = 120 * 2 = 240.'
  },
  {
    section: 'QUANT',
    subTopic: 'Probability',
    difficulty: 'MEDIUM',
    questionText: 'Two unbiased dice are rolled simultaneously. What is the probability that the sum of the numbers appearing on the two dice is a prime number?',
    codeSnippet: null,
    options: JSON.stringify(['5/12', '7/18', '15/36', '1/2']),
    correctAnswer: 0, // 15/36 = 5/12
    explanation: 'Possible sums that are prime: 2 (1 outcome), 3 (2 outcomes), 5 (4 outcomes), 7 (6 outcomes), 11 (2 outcomes). Total outcomes = 1 + 2 + 4 + 6 + 2 = 15. Probability = 15 / 36 = 5/12.'
  },
  {
    section: 'QUANT',
    subTopic: 'Number Systems',
    difficulty: 'EASY',
    questionText: 'What is the unit digit in the product: 213 * 457 * 689 * 821?',
    codeSnippet: null,
    options: JSON.stringify(['1', '3', '7', '9']),
    correctAnswer: 3, // 3 * 7 = 21 -> 1; 1 * 9 = 9; 9 * 1 = 9
    explanation: 'Multiply only the unit digits: 3 * 7 = 21 (unit 1). 1 * 9 = 9. 9 * 1 = 9. Hence the unit digit is 9.'
  },
  {
    section: 'QUANT',
    subTopic: 'Number Systems',
    difficulty: 'MEDIUM',
    questionText: 'What is the remainder when (7^84) is divided by 342?',
    codeSnippet: null,
    options: JSON.stringify(['0', '1', '7', '49']),
    correctAnswer: 1, // 1
    explanation: 'Note that 7^3 = 343 = 342 + 1. Thus 7^84 = (7^3)^28 = (342 + 1)^28. By binomial theorem, the remainder when divided by 342 is 1^28 = 1.'
  },
  {
    section: 'QUANT',
    subTopic: 'Simple & Compound Interest',
    difficulty: 'MEDIUM',
    questionText: 'The difference between compound interest and simple interest on a principal P for 2 years at 10% per annum compounded annually is ₹65. What is the value of P?',
    codeSnippet: null,
    options: JSON.stringify(['₹6,000', '₹6,500', '₹7,000', '₹7,500']),
    correctAnswer: 1, // ₹6,500
    explanation: 'Difference for 2 years = P * (R / 100)^2. Here, 65 = P * (10 / 100)^2 = P * (1 / 100). Therefore, P = 65 * 100 = ₹6,500.'
  },
  {
    section: 'QUANT',
    subTopic: 'Pipes and Cisterns',
    difficulty: 'EASY',
    questionText: 'Pipe X can fill a tank in 6 hours, while Pipe Y can empty the full tank in 9 hours. If both pipes are opened together in an empty tank, how long will it take to fill the tank completely?',
    codeSnippet: null,
    options: JSON.stringify(['12 hours', '15 hours', '18 hours', '24 hours']),
    correctAnswer: 2, // 18 hours
    explanation: 'Net filling rate per hour = 1/6 - 1/9 = (3 - 2)/18 = 1/18. Therefore, the tank will be filled in 18 hours.'
  },
  {
    section: 'QUANT',
    subTopic: 'Averages',
    difficulty: 'EASY',
    questionText: 'The average weight of 24 students in a class is 50 kg. If the teacher’s weight is included, the average increases by 1 kg. What is the weight of the teacher?',
    codeSnippet: null,
    options: JSON.stringify(['70 kg', '75 kg', '72 kg', '68 kg']),
    correctAnswer: 1, // 75 kg
    explanation: 'Initial total weight = 24 * 50 = 1200 kg. New average for 25 people = 51 kg. New total weight = 25 * 51 = 1275 kg. Teacher\'s weight = 1275 - 1200 = 75 kg.'
  },

  // ==========================================
  // SECTION 2: LOGICAL REASONING (15 Questions)
  // ==========================================
  {
    section: 'LOGICAL',
    subTopic: 'Syllogisms',
    difficulty: 'MEDIUM',
    questionText: 'Statements:\n1. All engineers are innovators.\n2. Some innovators are leaders.\nConclusions:\nI. Some engineers are leaders.\nII. Some innovators are engineers.\nWhich conclusion logically follows?',
    codeSnippet: null,
    options: JSON.stringify(['Only I follows', 'Only II follows', 'Both I and II follow', 'Neither follows']),
    correctAnswer: 1, // Only II follows
    explanation: 'Since all engineers are innovators, by immediate conversion "Some innovators are engineers" is necessarily true (Conclusion II). Since the middle term "innovators" is not distributed in both premises, no definite relation between engineers and leaders can be inferred (Conclusion I does not follow).'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Blood Relations',
    difficulty: 'EASY',
    questionText: 'Pointing to a gentleman, Sneha said, "His only brother is the father of my daughter\'s father." How is the gentleman related to Sneha?',
    codeSnippet: null,
    options: JSON.stringify(['Father', 'Uncle / Father-in-law\'s brother', 'Brother-in-law', 'Grandfather']),
    correctAnswer: 1, // Uncle / Father-in-law's brother
    explanation: '"My daughter\'s father" is Sneha\'s husband. His father is Sneha\'s father-in-law. The gentleman is the only brother of Sneha\'s father-in-law, making him Sneha\'s uncle-in-law.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Blood Relations',
    difficulty: 'MEDIUM',
    questionText: 'If "P + Q" means P is the mother of Q, "P - Q" means P is the sister of Q, and "P * Q" means P is the father of Q, which of the following expressions indicates that "M is the niece of N"?',
    codeSnippet: null,
    options: JSON.stringify(['N - T * M', 'N - M * T', 'N + T - M', 'T * N - M']),
    correctAnswer: 0, // N - T * M (N is sister of T, T is father of M; if M is female, M is niece)
    explanation: 'In "N - T * M", N is the sister of T, and T is the father of M. M is the child of T (N\'s brother), making M the niece (or nephew) of N.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Direction Sense',
    difficulty: 'EASY',
    questionText: 'A developer walks 30 meters North, turns right and walks 40 meters, then turns right again and walks 30 meters. How far and in which direction is the developer from the starting point?',
    codeSnippet: null,
    options: JSON.stringify(['40 meters East', '40 meters West', '70 meters North', '30 meters South']),
    correctAnswer: 0, // 40 meters East
    explanation: 'Moving North 30m, East 40m, South 30m brings the developer exactly 40m East of the origin point.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Coding-Decoding',
    difficulty: 'EASY',
    questionText: 'In a certain code language, "SYSTEM" is coded as "SYSMET" and "NEARER" is coded as "AENRER". Following the same pattern, how is "FRACTION" coded?',
    codeSnippet: null,
    options: JSON.stringify(['ARFCNOIT', 'CARFNOIT', 'CARFTION', 'ACRFNOIT']),
    correctAnswer: 1, // CARFNOIT
    explanation: 'Split into two halves of 4 letters each: "FRAC" reversed becomes "CARF", and "TION" reversed becomes "NOIT". Combined = "CARFNOIT".'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Seating Arrangement',
    difficulty: 'MEDIUM',
    questionText: 'Six students A, B, C, D, E, and F sit around a circular table facing the center. A is opposite D. B is to the immediate right of A. C is between A and E. Who is sitting opposite B?',
    codeSnippet: null,
    options: JSON.stringify(['C', 'E', 'F', 'D']),
    correctAnswer: 1, // E
    explanation: 'With A at bottom (6 o\'clock), D is at top (12 o\'clock). B is immediate right of A (5 o\'clock). C is between A and E (7 o\'clock and 8 o\'clock). F sits at 1 o\'clock. The person directly opposite B (5 o\'clock) is at 11 o\'clock, which is E.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Series & Sequences',
    difficulty: 'EASY',
    questionText: 'Find the missing number in the sequence: 4, 9, 25, 49, 121, ?',
    codeSnippet: null,
    options: JSON.stringify(['144', '169', '196', '225']),
    correctAnswer: 1, // 169 (Squares of consecutive prime numbers: 2, 3, 5, 7, 11, 13)
    explanation: 'The series consists of squares of consecutive prime numbers: 2^2=4, 3^2=9, 5^2=25, 7^2=49, 11^2=121. The next prime is 13, and 13^2 = 169.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Analogy & Classification',
    difficulty: 'EASY',
    questionText: 'Compiler : Machine Code :: Translator : ?',
    codeSnippet: null,
    options: JSON.stringify(['Source Code', 'Target Language', 'Bytecode', 'Algorithm']),
    correctAnswer: 1, // Target Language
    explanation: 'A compiler converts human-readable source code into machine code; similarly, a translator converts input language into the target language.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Data Sufficiency',
    difficulty: 'HARD',
    questionText: 'Question: Is integer x even?\nStatement 1: 3x + 2 is an even integer.\nStatement 2: 2x + 5 is an odd integer.\nWhich statement(s) is/are sufficient to answer the question?',
    codeSnippet: null,
    options: JSON.stringify([
      'Statement 1 alone is sufficient',
      'Statement 2 alone is sufficient',
      'Both statements together are needed',
      'Each statement alone is sufficient'
    ]),
    correctAnswer: 0, // Statement 1 alone
    explanation: 'From Statement 1: 3x + 2 = even => 3x is even. Since 3 is odd, x must be even. Hence Statement 1 alone is sufficient. Statement 2: 2x + 5 = odd => 2x is even, which holds for both even and odd integers x (e.g. 2*3=6, 2*4=8), so Statement 2 alone is not sufficient.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Clocks and Calendars',
    difficulty: 'MEDIUM',
    questionText: 'What is the angle between the hour hand and the minute hand of a clock at 3:40?',
    codeSnippet: null,
    options: JSON.stringify(['120 degrees', '130 degrees', '140 degrees', '150 degrees']),
    correctAnswer: 1, // 130 degrees
    explanation: 'Angle = |30*H - (11/2)*M| = |30*3 - (11/2)*40| = |90 - 220| = 130 degrees.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Clocks and Calendars',
    difficulty: 'EASY',
    questionText: 'If 1st January 2024 was a Monday, what day of the week was 31st December 2024? (Note: 2024 is a leap year)',
    codeSnippet: null,
    options: JSON.stringify(['Monday', 'Tuesday', 'Wednesday', 'Sunday']),
    correctAnswer: 1, // Tuesday
    explanation: 'A leap year has 366 days, which is 52 weeks and 2 odd days. If Jan 1 is day X, Dec 31 of a leap year falls on (X + 1) day of the week. Monday + 1 = Tuesday.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Statement and Assumptions',
    difficulty: 'MEDIUM',
    questionText: 'Statement: "Join CampusEdge to double your chances of clearing Day-1 campus placement coding assessments."\nAssumption I: Students aspire to clear Day-1 campus coding assessments.\nAssumption II: Technical finishing training can positively influence assessment clearance.\nWhich assumption is implicit?',
    codeSnippet: null,
    options: JSON.stringify(['Only I is implicit', 'Only II is implicit', 'Neither is implicit', 'Both I and II are implicit']),
    correctAnswer: 3, // Both I and II are implicit
    explanation: 'An advertisement assumes both that the target audience desires the promised outcome (clearing Day-1 drives) and that the offering can deliver the stated enhancement.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Linear Puzzles',
    difficulty: 'MEDIUM',
    questionText: 'Five candidates P, Q, R, S, and T participated in a hackathon. P scored higher than Q but lower than R. S scored higher than T but lower than Q. Who scored the highest?',
    codeSnippet: null,
    options: JSON.stringify(['P', 'Q', 'R', 'S']),
    correctAnswer: 2, // R
    explanation: 'From clues: R > P > Q, and Q > S > T. Combining gives: R > P > Q > S > T. R is the top scorer.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Venn Diagrams',
    difficulty: 'EASY',
    questionText: 'Which geometric representation best describes the relationship between: "Software Engineers", "Cloud Architects", and "Dogs"?',
    codeSnippet: null,
    options: JSON.stringify([
      'Three completely disjoint circles',
      'Two intersecting circles completely separate from a third circle',
      'Three concentric circles',
      'Three mutually intersecting circles'
    ]),
    correctAnswer: 1, // Two intersecting circles separate from a third
    explanation: 'Some software engineers are cloud architects (and vice versa), representing two overlapping circles. "Dogs" is an entirely disjoint biological entity having zero intersection with the two professional roles.'
  },
  {
    section: 'LOGICAL',
    subTopic: 'Critical Reasoning',
    difficulty: 'MEDIUM',
    questionText: 'A college reports that 95% of students who attended all coding labs secured job offers. The management concludes that attending coding labs was the sole cause of student placement.\nWhich statement exposes the logical flaw in this conclusion?',
    codeSnippet: null,
    options: JSON.stringify([
      'Coding labs are conducted by experienced trainers.',
      'Students with higher intrinsic motivation and discipline are more likely to attend all labs and also prepare independently.',
      'Campus recruiters test quantitative aptitude alongside coding.',
      'Not all companies require coding tests.'
    ]),
    correctAnswer: 1, // Confounding variable / correlation != causation
    explanation: 'This highlights the classical confounding variable error (correlation vs. causation): motivated students naturally exhibit high attendance while also possessing higher baseline drive to secure placements.'
  },

  // ==========================================
  // SECTION 3: VERBAL ABILITY & COMMUNICATION (15 Questions)
  // ==========================================
  {
    section: 'VERBAL',
    subTopic: 'Subject-Verb Agreement',
    difficulty: 'EASY',
    questionText: 'Choose the grammatically correct sentence:',
    codeSnippet: null,
    options: JSON.stringify([
      'Neither the lead developer nor the testers was able to reproduce the bug.',
      'Neither the lead developer nor the testers were able to reproduce the bug.',
      'Neither the lead developer nor the testers is able to reproduce the bug.',
      'Neither the lead developer nor the testers has been able to reproduce the bug.'
    ]),
    correctAnswer: 1, // were
    explanation: 'When subjects are connected by "neither... nor", the verb agrees with the closer subject. "Testers" is plural, requiring the plural verb "were".'
  },
  {
    section: 'VERBAL',
    subTopic: 'Subject-Verb Agreement',
    difficulty: 'MEDIUM',
    questionText: 'Identify the grammatically correct option to fill the blank:\n"A comprehensive battery of technical assessments, along with two rounds of behavioral interviews, ______ mandatory for all candidates."',
    codeSnippet: null,
    options: JSON.stringify(['are', 'is', 'were', 'have been']),
    correctAnswer: 1, // is
    explanation: 'The true subject is "A comprehensive battery" (singular). Phrases set off by "along with", "as well as", or "together with" do not alter the number of the main subject. Hence singular "is" is correct.'
  },
  {
    section: 'VERBAL',
    subTopic: 'Vocabulary in Context',
    difficulty: 'MEDIUM',
    questionText: 'Select the word that is most nearly OPPOSITE in meaning to the capitalized word: "EPHEMERAL"',
    codeSnippet: null,
    options: JSON.stringify(['Transient', 'Perpetual', 'Cryptic', 'Superficial']),
    correctAnswer: 1, // Perpetual
    explanation: '"Ephemeral" means short-lived or fleeting. Its direct antonym is "Perpetual" (everlasting, permanent).'
  },
  {
    section: 'VERBAL',
    subTopic: 'Vocabulary in Context',
    difficulty: 'EASY',
    questionText: 'Choose the word that best fits the blank:\n"The engineer gave a ______ explanation of the microservices failure, highlighting only the crucial root causes without unnecessary digressions."',
    codeSnippet: null,
    options: JSON.stringify(['verbose', 'lucid and succinct', 'convoluted', 'ambiguous']),
    correctAnswer: 1, // lucid and succinct
    explanation: '"Succinct" means brief and clearly expressed, which directly matches "highlighting only crucial causes without unnecessary digressions."'
  },
  {
    section: 'VERBAL',
    subTopic: 'Sentence Correction & Modifiers',
    difficulty: 'HARD',
    questionText: 'Identify the sentence with the dangling modifier flaw:',
    codeSnippet: null,
    options: JSON.stringify([
      'While reviewing the pull request, several unhandled runtime exceptions were spotted by Priya.',
      'While Priya reviewed the pull request, she spotted several unhandled runtime exceptions.',
      'Priya spotted several unhandled runtime exceptions while reviewing the pull request.',
      'Having reviewed the pull request carefully, Priya merged the code into the production branch.'
    ]),
    correctAnswer: 0, // Dangling modifier
    explanation: 'In option A, the introductory participial phrase "While reviewing the pull request" is immediately followed by "several unhandled runtime exceptions", illogically implying that the exceptions were reviewing the pull request.'
  },
  {
    section: 'VERBAL',
    subTopic: 'Para Jumbles',
    difficulty: 'MEDIUM',
    questionText: 'Rearrange the sentences into a coherent logical paragraph:\nP. This latency bottleneck degrades the overall end-user experience.\nQ. Modern web applications rely heavily on distributed database queries.\nR. Consequently, aggressive multi-layer Redis caching has become an architectural imperative.\nS. When these queries traverse unindexed relational tables, round-trip response times escalate.',
    codeSnippet: null,
    options: JSON.stringify(['Q - S - P - R', 'P - Q - S - R', 'Q - P - S - R', 'S - Q - P - R']),
    correctAnswer: 0, // Q -> S -> P -> R
    explanation: 'Q introduces the context (distributed queries). S explains what happens when they hit unindexed tables (times escalate). P describes the effect (latency degrades UX). R provides the concluding remedy (consequently caching is imperative).'
  },
  {
    section: 'VERBAL',
    subTopic: 'Idioms and Phrasal Verbs',
    difficulty: 'EASY',
    questionText: 'What is the meaning of the idiom "to burn the midnight oil"?',
    codeSnippet: null,
    options: JSON.stringify([
      'To waste electrical energy recklessly',
      'To work or study late into the night',
      'To cause intentional conflict in the office',
      'To destroy confidential documents'
    ]),
    correctAnswer: 1, // To work late
    explanation: '"To burn the midnight oil" is an English idiom meaning to stay awake late into the night working diligently on an assignment or project.'
  },
  {
    section: 'VERBAL',
    subTopic: 'Reading Comprehension',
    difficulty: 'MEDIUM',
    questionText: 'Passage:\n"Algorithmic hiring platforms promise objective evaluation, free from human cognitive biases. However, when machine learning models are trained on historical recruitment archives, they invariably encode and amplify existing institutional prejudices. An algorithm trained on ten years of male-dominated engineering promotions will penalize resumes containing leadership markers from women\'s colleges."\n\nAccording to the author, why do algorithmic hiring tools fail to guarantee unbiased recruitment?',
    codeSnippet: null,
    options: JSON.stringify([
      'Machine learning algorithms lack mathematical rigor.',
      'Historical training data reflects pre-existing systemic human biases.',
      'Automated resume parsers cannot read modern PDF formatting.',
      'Recruiters deliberately corrupt the training algorithms.'
    ]),
    correctAnswer: 1, // Historical data reflects systemic human bias
    explanation: 'The passage explicitly states that because the models are trained on historical archives that reflect past prejudices, they encode and perpetuate those biases.'
  },
  {
    section: 'VERBAL',
    subTopic: 'Reading Comprehension',
    difficulty: 'HARD',
    questionText: 'Based on the passage above, what is the primary tone of the author towards uncritical reliance on recruitment AI?',
    codeSnippet: null,
    options: JSON.stringify(['Celebratory and optimistic', 'Indifferent and neutral', 'Cautionary and analytical', 'Cynical and despairing']),
    correctAnswer: 2, // Cautionary and analytical
    explanation: 'The author methodically explains how an ostensibly objective tool inherits human bias, delivering a reasoned, cautionary analysis rather than unreserved despair or praise.'
  },
  {
    section: 'VERBAL',
    subTopic: 'Prepositions & Collocations',
    difficulty: 'EASY',
    questionText: 'Choose the correct preposition to complete the sentence:\n"The technical lead congratulated the engineering cohort ______ successfully deploying the zero-downtime release."',
    codeSnippet: null,
    options: JSON.stringify(['for', 'on', 'with', 'about']),
    correctAnswer: 1, // on
    explanation: 'The standard English grammatical collocation is "to congratulate someone on [something/an achievement]".'
  },
  {
    section: 'VERBAL',
    subTopic: 'Corporate Communication Etiquette',
    difficulty: 'EASY',
    questionText: 'When replying to a campus placement interview invitation email, which subject line follows formal corporate etiquette?',
    codeSnippet: null,
    options: JSON.stringify([
      'RE: Interview details bro',
      'Accepted! See you tomorrow',
      'Technical Interview Confirmation - Rohan Verma - Roll No. 2024CS104',
      'Can we reschedule? Not prepared'
    ]),
    correctAnswer: 2, // Formal with name and identifier
    explanation: 'Professional communication etiquette mandates a clear, structured subject line containing the purpose, candidate name, and institutional identifier.'
  },
  {
    section: 'VERBAL',
    subTopic: 'Direct and Indirect Speech',
    difficulty: 'MEDIUM',
    questionText: 'Convert into indirect speech:\nThe interviewer said to me, "Can you optimize this search algorithm to run in logarithmic time?"',
    codeSnippet: null,
    options: JSON.stringify([
      'The interviewer asked me that if I can optimize that search algorithm to run in logarithmic time.',
      'The interviewer asked me if I could optimize that search algorithm to run in logarithmic time.',
      'The interviewer told me could I optimize this search algorithm in logarithmic time.',
      'The interviewer enquired whether I can optimize this search algorithm.'
    ]),
    correctAnswer: 1, // asked me if I could optimize that
    explanation: 'In indirect speech for yes/no questions, "said to me" becomes "asked me if/whether", "can" shifts to past tense "could", and demonstrative "this" changes to "that".'
  },
  {
    section: 'VERBAL',
    subTopic: 'Active and Passive Voice',
    difficulty: 'EASY',
    questionText: 'Change into passive voice:\n"The campus placement cell organized a statewide coding hackathon."',
    codeSnippet: null,
    options: JSON.stringify([
      'A statewide coding hackathon is organized by the campus placement cell.',
      'A statewide coding hackathon was organized by the campus placement cell.',
      'A statewide coding hackathon had been organized by the campus placement cell.',
      'A statewide coding hackathon was being organized by the campus placement cell.'
    ]),
    correctAnswer: 1, // was organized
    explanation: 'The active sentence is in simple past ("organized"). The passive voice requires past auxiliary "was" + past participle "organized".'
  },
  {
    section: 'VERBAL',
    subTopic: 'One Word Substitution',
    difficulty: 'EASY',
    questionText: 'Give one word for: "A person who has supreme expertise and deep technical skill in a particular field."',
    codeSnippet: null,
    options: JSON.stringify(['Novice', 'Virtuoso', 'Dilettante', 'Malingerer']),
    correctAnswer: 1, // Virtuoso
    explanation: 'A "Virtuoso" is an individual who possesses outstanding technical skill and masterly craftsmanship in a discipline.'
  },
  {
    section: 'VERBAL',
    subTopic: 'Sentence Completion',
    difficulty: 'MEDIUM',
    questionText: 'Fill in the blanks with the most appropriate pair of words:\n"Despite facing ______ resource constraints during the semester, the placement committee achieved ______ success in attracting tier-1 product companies."',
    codeSnippet: null,
    options: JSON.stringify([
      'trivial, minimal',
      'severe, unprecedented',
      'negligible, moderate',
      'abundant, modest'
    ]),
    correctAnswer: 1, // severe, unprecedented
    explanation: '"Despite" signals contrast between hardship and achievement: "severe" constraints contrasted with "unprecedented" success.'
  },

  // ==========================================
  // SECTION 4: BASIC DSA & ALGORITHMIC LOGIC (18 Questions)
  // ==========================================
  {
    section: 'DSA_BASIC',
    subTopic: 'Complexity Analysis',
    difficulty: 'EASY',
    questionText: 'What is the worst-case time complexity of accessing an element by its index in a contiguous dynamic array (e.g. ArrayList in Java or Vector in C++)?',
    codeSnippet: null,
    options: JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N log N)']),
    correctAnswer: 0, // O(1)
    explanation: 'Arrays store elements in contiguous memory addresses. The offset address is computed in constant time: base_address + index * element_size, which is O(1).'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Complexity Analysis',
    difficulty: 'MEDIUM',
    questionText: 'What is the time complexity of the following nested loop snippet?',
    codeSnippet: 'int count = 0;\nfor (int i = 1; i <= n; i *= 2) {\n    for (int j = 0; j < n; j++) {\n        count++;\n    }\n}',
    options: JSON.stringify(['O(N)', 'O(N log N)', 'O(N^2)', 'O(log N)']),
    correctAnswer: 1, // O(N log N)
    explanation: 'The outer loop multiplies i by 2 each iteration, executing log2(N) times. The inner loop runs exactly N times for every outer step. Total operations = N * log2(N) = O(N log N).'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Complexity Analysis',
    difficulty: 'MEDIUM',
    questionText: 'Which of the following sorting algorithms exhibits a worst-case time complexity of O(N^2) when the input is already sorted in ascending order and the last element is chosen as the pivot?',
    codeSnippet: null,
    options: JSON.stringify(['Merge Sort', 'Heap Sort', 'Standard Quick Sort', 'Counting Sort']),
    correctAnswer: 2, // Standard Quick Sort
    explanation: 'In standard Quick Sort with last-element pivot, an already sorted array causes worst-case unbalanced partitions of size (N-1) and 0 at every step, yielding O(N^2) time complexity.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Arrays & Two Pointers',
    difficulty: 'EASY',
    questionText: 'Given a sorted array of N integers, what is the most optimal time complexity to determine if there exists a pair whose sum equals a target value K?',
    codeSnippet: null,
    options: JSON.stringify(['O(N^2) with two nested loops', 'O(N log N) using binary search', 'O(N) using two pointers from opposite ends', 'O(1) using bit manipulation']),
    correctAnswer: 2, // O(N) using two pointers
    explanation: 'Because the array is already sorted, placing one pointer at index 0 and another at index N-1 allows shrinking the search space inward in a single pass of O(N) time and O(1) extra space.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Linked Lists',
    difficulty: 'EASY',
    questionText: 'Which algorithm is standardly used to detect a cycle in a singly linked list with O(N) time and O(1) auxiliary memory?',
    codeSnippet: null,
    options: JSON.stringify([
      'Dijkstra\'s Algorithm',
      'Floyd\'s Cycle-Finding Algorithm (Tortoise and Hare)',
      'Kadane\'s Algorithm',
      'Kruskal\'s Algorithm'
    ]),
    correctAnswer: 1, // Floyd's Tortoise and Hare
    explanation: 'Floyd\'s cycle algorithm advances a slow pointer by 1 node and a fast pointer by 2 nodes. If a cycle exists, they are guaranteed to meet inside the loop in O(N) time with O(1) memory.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Linked Lists',
    difficulty: 'MEDIUM',
    questionText: 'What happens when reversing a singly linked list in-place if you forget to preserve the pointer to `curr.next` before updating `curr.next = prev`?',
    codeSnippet: null,
    options: JSON.stringify([
      'The list reverses correctly without issue',
      'The reference to the remainder of the list is permanently lost (broken link)',
      'A cycle is automatically created',
      'The head node is deleted'
    ]),
    correctAnswer: 1, // Lost reference
    explanation: 'Before mutating `curr.next` to point backwards to `prev`, you must store `next_node = curr.next`. Otherwise, the forward link is overwritten and the rest of the list becomes unreachable.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Stacks & Queues',
    difficulty: 'EASY',
    questionText: 'Which data structure follows the Last-In, First-Out (LIFO) discipline and is fundamentally utilized in compiler syntax parsing for matching parentheses?',
    codeSnippet: null,
    options: JSON.stringify(['Queue', 'Stack', 'Priority Queue', 'Circular Buffer']),
    correctAnswer: 1, // Stack
    explanation: 'A Stack is a LIFO structure. Opening delimiters are pushed onto the stack; matching closing delimiters pop and check parity.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Stacks & Queues',
    difficulty: 'MEDIUM',
    questionText: 'How many minimum Stacks are required to implement a First-In, First-Out (FIFO) Queue with amortized O(1) operations?',
    codeSnippet: null,
    options: JSON.stringify(['1 Stack', '2 Stacks', '3 Stacks', '4 Stacks']),
    correctAnswer: 1, // 2 Stacks
    explanation: 'Two stacks (an input stack and an output stack) allow reversing the LIFO order twice to achieve FIFO behavior. Each element is pushed and popped at most twice, providing amortized O(1) cost per operation.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Recursion & Call Stack',
    difficulty: 'EASY',
    questionText: 'What error is thrown in Java/C++ when a recursive function fails to hit its base condition and executes indefinitely?',
    codeSnippet: null,
    options: JSON.stringify(['NullPointerException', 'StackOverflowError', 'OutOfMemoryError', 'IndexOutOfBoundsException']),
    correctAnswer: 1, // StackOverflowError
    explanation: 'Every recursive invocation allocates a new stack frame on the call stack. Unbounded recursion exhausts the allocated thread call stack memory, triggering a StackOverflowError.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Binary Search',
    difficulty: 'EASY',
    questionText: 'To prevent integer overflow when calculating the midpoint of two large 32-bit integers `low` and `high`, how should the midpoint calculation be written?',
    codeSnippet: null,
    options: JSON.stringify([
      'mid = (low + high) / 2',
      'mid = low + (high - low) / 2',
      'mid = (high - low) / 2',
      'mid = low * 2 + high'
    ]),
    correctAnswer: 1, // low + (high - low) / 2
    explanation: 'If `low + high` exceeds 2^31 - 1, it overflows into a negative value. The formulation `low + (high - low) / 2` calculates the exact same mathematical value without summing large numbers.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Hashing & Hash Maps',
    difficulty: 'EASY',
    questionText: 'In a well-designed Hash Map using chaining for collision resolution, what is the average-case time complexity of search, insert, and delete operations?',
    codeSnippet: null,
    options: JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N^2)']),
    correctAnswer: 0, // O(1)
    explanation: 'Under the assumption of uniform hashing, hash table buckets receive a constant average number of keys, resulting in average-case O(1) lookup, insertion, and deletion.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Binary Trees',
    difficulty: 'EASY',
    questionText: 'What is the maximum number of nodes in a binary tree of height H (where a single root node has height H = 0)?',
    codeSnippet: null,
    options: JSON.stringify(['2^H', '2^(H + 1) - 1', '2^H - 1', '2^(H - 1)']),
    correctAnswer: 1, // 2^(H+1) - 1
    explanation: 'Sum of geometric progression: 2^0 + 2^1 + ... + 2^H = 2^(H + 1) - 1. For example, height 0 has 2^1 - 1 = 1 node; height 2 has 2^3 - 1 = 7 nodes.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Binary Search Trees (BST)',
    difficulty: 'MEDIUM',
    questionText: 'Which tree traversal of a valid Binary Search Tree (BST) produces the keys in strictly ascending sorted order?',
    codeSnippet: null,
    options: JSON.stringify(['Pre-order Traversal', 'In-order Traversal', 'Post-order Traversal', 'Level-order Traversal']),
    correctAnswer: 1, // In-order Traversal (Left, Root, Right)
    explanation: 'In a BST, all nodes in the left subtree are smaller than the root, and all nodes in the right subtree are larger. In-order traversal visits Left -> Root -> Right, yielding strictly sorted ascending keys.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Heaps & Priority Queues',
    difficulty: 'MEDIUM',
    questionText: 'What is the time complexity to insert a new element into a binary Min-Heap containing N elements?',
    codeSnippet: null,
    options: JSON.stringify(['O(1)', 'O(log N)', 'O(N)', 'O(N log N)']),
    correctAnswer: 1, // O(log N)
    explanation: 'Insertion appends the element at the end of the complete binary tree array, then "bubbles up" (heapifies up) along the tree height, taking at most O(log N) comparisons.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Dynamic Programming',
    difficulty: 'MEDIUM',
    questionText: 'What are the two foundational properties that an algorithmic problem must exhibit to be solvable via Dynamic Programming?',
    codeSnippet: null,
    options: JSON.stringify([
      'Greedy choice property and monotonic ordering',
      'Overlapping subproblems and optimal substructure',
      'Divide and conquer and sorted inputs',
      'Cyclic graphs and randomized pivots'
    ]),
    correctAnswer: 1, // Overlapping subproblems and optimal substructure
    explanation: 'Dynamic Programming requires that the solution to an overall problem can be constructed from optimal solutions to its subproblems (optimal substructure) and that the same subproblems are solved repeatedly (overlapping subproblems).'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Graph Algorithms',
    difficulty: 'EASY',
    questionText: 'Which graph traversal algorithm uses a First-In First-Out (FIFO) queue and is naturally suited to finding the shortest path in an unweighted graph?',
    codeSnippet: null,
    options: JSON.stringify(['Depth First Search (DFS)', 'Breadth First Search (BFS)', 'Topological Sort', 'Prim\'s Algorithm']),
    correctAnswer: 1, // BFS
    explanation: 'BFS explores vertices layer by layer using a FIFO queue. In an unweighted graph, the first time BFS reaches a node, it has traversed the minimum number of edges, guaranteeing the shortest path.'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Bit Manipulation',
    difficulty: 'MEDIUM',
    questionText: 'What does the bitwise expression `n & (n - 1)` accomplish when executed on an integer n > 0?',
    codeSnippet: null,
    options: JSON.stringify([
      'Inverts all bits of n',
      'Clears the lowest set bit (rightmost 1-bit) of n',
      'Multiplies n by 2',
      'Checks if n is odd'
    ]),
    correctAnswer: 1, // Clears the lowest set bit
    explanation: 'Subtracting 1 from n flips all bits from the rightmost set bit onward. Performing bitwise AND with the original n zeroes out that lowest set bit. (Brian Kernighan\'s algorithm).'
  },
  {
    section: 'DSA_BASIC',
    subTopic: 'Strings & Hashing',
    difficulty: 'EASY',
    questionText: 'Two strings s and t are anagrams if and only if:',
    codeSnippet: null,
    options: JSON.stringify([
      'They have the same length and identical first and last characters',
      'They contain the exact same characters with identical frequencies, irrespective of order',
      'One is the exact reversal of the other',
      'Their lengths are both prime numbers'
    ]),
    correctAnswer: 1, // Same characters with same frequencies
    explanation: 'An anagram is a word or phrase formed by rearranging the letters of a different word, meaning both strings have identical character frequency counts.'
  }
];

export const sampleLeads = [
  {
    collegeName: 'Vidyapeeth Institute of Technology',
    city: 'Pune',
    state: 'Maharashtra',
    contactPerson: 'Prof. Rajesh Shinde',
    role: 'Head - Training & Placement',
    email: 'tpo@vidyapeeth.edu.in',
    phone: '+91 98230 44556',
    studentStrength: 240,
    targetYears: '3rd Year, Final Year',
    targetBranches: 'CSE, IT, ECE',
    interestedPrograms: 'DSA, Aptitude, Soft Skills',
    preferredMode: 'ON_CAMPUS',
    message: 'We want our 2026 batch to achieve >70% Day-1 placement clearances. Conducted masterclass, need 200h proposal.',
    status: 'DEMO_SCHEDULED',
    notes: 'Masterclass held with 180 students. Very positive feedback. Dean requested pilot demo for CSE batch.',
    followUpDate: new Date('2026-11-06T11:00:00Z')
  },
  {
    collegeName: 'Sahyadri College of Engineering & Management',
    city: 'Mangaluru',
    state: 'Karnataka',
    contactPerson: 'Prof. Rashmi Bhat',
    role: 'Dean of Career Services',
    email: 'placements@sahyadri.edu.in',
    phone: '+91 94490 55667',
    studentStrength: 320,
    targetYears: '3rd Year (Sem 6)',
    targetBranches: 'CSE, ISE, ECE, AIML',
    interestedPrograms: 'DSA, Aptitude',
    preferredMode: 'HYBRID',
    message: 'Looking for a structured 200-hour placement accelerator for our pre-final years before campus drives in August.',
    status: 'CONTACTED',
    notes: 'Sent WhatsApp brochure and NBA Criterion 4 mapping document. Following up on Thursday.',
    followUpDate: new Date('2026-11-05T14:00:00Z')
  },
  {
    collegeName: 'Coimbatore Institute of Engineering & Technology',
    city: 'Coimbatore',
    state: 'Tamil Nadu',
    contactPerson: 'Prof. S. Murugan',
    role: 'Placement Director',
    email: 'tpo@ciet.ac.in',
    phone: '+91 98430 66778',
    studentStrength: 180,
    targetYears: '3rd Year',
    targetBranches: 'CSE, IT, EEE',
    interestedPrograms: 'DSA, Soft Skills',
    preferredMode: 'ON_CAMPUS',
    message: 'Enrolled in 2-week pilot. Commencing next Monday.',
    status: 'PILOT_SIGNED',
    notes: 'Pilot fee ₹25,000 received. Trainer allocated. Pre-assessment scheduled for Monday 9:00 AM.',
    followUpDate: new Date('2026-11-10T10:00:00Z')
  },
  {
    collegeName: 'Kakatiya Engineering Academy',
    city: 'Warangal',
    state: 'Telangana',
    contactPerson: 'Prof. Praveen Kumar',
    role: 'T&P Officer',
    email: 'placements@kea.ac.in',
    phone: '+91 99890 77889',
    studentStrength: 200,
    targetYears: 'Final Year',
    targetBranches: 'CSE, ECE',
    interestedPrograms: 'DSA, Aptitude, Soft Skills',
    preferredMode: 'ON_CAMPUS',
    message: 'Need pricing for immediate 10-day crash bootcamp before mass hiring starts.',
    status: 'NEW',
    notes: 'Inbound lead via website form. Needs call today.',
    followUpDate: new Date('2026-11-04T09:30:00Z')
  },
  {
    collegeName: 'Jaipur National Engineering College',
    city: 'Jaipur',
    state: 'Rajasthan',
    contactPerson: 'Prof. Sunil Rathore',
    role: 'TPO & Associate Professor',
    email: 'tpo@jnec.ac.in',
    phone: '+91 94140 11223',
    studentStrength: 280,
    targetYears: '3rd Year & 4th Year',
    targetBranches: 'CSE, IT, ECE',
    interestedPrograms: 'DSA, Aptitude, Soft Skills',
    preferredMode: 'ON_CAMPUS',
    message: 'Institutional MoU signed for 200h Placement-Ready Accelerator across 4 batches.',
    status: 'WON',
    notes: 'Full contract ₹13,30,000 + GST. 30% mobilization advance received. Training commences Nov 15.',
    followUpDate: new Date('2026-11-15T09:00:00Z')
  }
];

export const sampleTestimonials = [
  {
    authorName: 'Prof. Rajesh Shinde',
    designation: 'Head - Training & Placement',
    collegeName: 'Vidyapeeth Institute of Technology',
    city: 'Pune, Maharashtra',
    quote: 'CampusEdge transformed our Day-1 placement results. In our 2026 drive, 74% of our CSE cohort cleared the first coding round of visiting companies, compared to barely 30% previously. Their Monday MIS reports kept our faculty completely in the loop.',
    rating: 5,
    isFeatured: true,
    order: 1
  },
  {
    authorName: 'Dr. Srinivasa Rao',
    designation: 'Principal',
    collegeName: 'Sahyadri College of Engineering & Management',
    city: 'Mangaluru, Karnataka',
    quote: 'The 20-80 active coding methodology is what sets CampusEdge apart. Students weren’t sitting through boring PowerPoint presentations—they were actively coding and competing on live leaderboards. Our student attendance stayed above 92% throughout.',
    rating: 5,
    isFeatured: true,
    order: 2
  },
  {
    authorName: 'Prof. S. Murugan',
    designation: 'Director of Career Guidance',
    collegeName: 'Coimbatore Institute of Engineering & Technology',
    city: 'Coimbatore, Tamil Nadu',
    quote: 'We started with their ₹25,000 2-Week Pilot on one batch. Within ten days, the score improvement was so undeniable that our Academic Council approved the full 200-hour accelerator for all branches. Best institutional decision we made this year.',
    rating: 5,
    isFeatured: true,
    order: 3
  }
];

export const sampleFaqs = [
  {
    category: 'COLLEGES',
    question: 'How does CampusEdge integrate with our college timetable without disrupting university syllabus?',
    answer: 'We provide three flexible models: 1) Integrated semester mode (4-6 hours weekly during Friday/Saturday zero-hour or lab slots), 2) Early morning or evening hybrid interactive sessions, or 3) Intensive 10-15 day vacation bootcamps during semester breaks.',
    order: 1
  },
  {
    category: 'COLLEGES',
    question: 'How does this training support our NAAC and NBA accreditation documentation?',
    answer: 'CampusEdge training directly satisfies NBA Criterion 4 (Students’ Performance & Placements) and NAAC Criterion 5.1.3 (Capacity Building & Skills Enhancement). We provide signed trainer attendance logs, pre/post evaluation deltas, and tamper-proof digital certificates ready for DVV audits.',
    order: 2
  },
  {
    category: 'CURRICULUM',
    question: 'Which programming languages are supported in the Data Structures & Algorithms track?',
    answer: 'We support Java (Collections Framework / JDK 21), C++ (STL / C++20), and Python (Python 3.11). While core algorithmic thinking is language-agnostic, students practice in the specific idiomatic language favored by their target recruiters.',
    order: 3
  },
  {
    category: 'COMMERCIALS',
    question: 'What is the 2-Week Pilot guarantee and how does the fee credit work?',
    answer: 'Our 2-Week Placement Kickstart Pilot delivers 20 contact hours for a batch of 60 students at a nominal ₹25,000 + GST. If your institution moves forward with a semester contract, 100% of this pilot fee is deducted as an advance discount from your first invoice.',
    order: 4
  },
  {
    category: 'COMMERCIALS',
    question: 'What are your standard milestone payment terms?',
    answer: 'We operate on a 3-stage milestone framework: 30% mobilization advance upon signing of MoU, 40% at the mid-term assessment milestone (50% hours completed), and 30% upon completion of all syllabus hours and submission of final placement readiness dossiers.',
    order: 5
  }
];

export async function main() {
  console.log('[Seed] Starting CampusEdge institutional database seed...');

  // 1. Seed Admin User
  const adminEmail = 'admin@campusedge.in';
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('CampusEdgeAdmin2026!', salt);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: 'CampusEdge Executive Admin' },
    create: {
      email: adminEmail,
      passwordHash,
      name: 'CampusEdge Executive Admin',
      role: 'SUPER_ADMIN'
    }
  });
  console.log(`[Seed] Seeded admin user: ${adminEmail}`);

  // 2. Clear & Seed 60+ Assessment Questions
  await prisma.assessmentQuestion.deleteMany({});
  for (const q of assessmentQuestions) {
    await prisma.assessmentQuestion.create({ data: q });
  }
  console.log(`[Seed] Successfully seeded ${assessmentQuestions.length} comprehensive assessment questions!`);

  // 3. Clear & Seed Testimonials
  await prisma.testimonial.deleteMany({});
  for (const t of sampleTestimonials) {
    await prisma.testimonial.create({ data: t });
  }
  console.log(`[Seed] Seeded ${sampleTestimonials.length} institutional testimonials.`);

  // 4. Clear & Seed FAQs
  await prisma.faqItem.deleteMany({});
  for (const f of sampleFaqs) {
    await prisma.faqItem.create({ data: f });
  }
  console.log(`[Seed] Seeded ${sampleFaqs.length} FAQs.`);

  // 5. Seed Initial Pipeline Leads (only if empty)
  const existingLeads = await prisma.collegeLead.count();
  if (existingLeads === 0) {
    for (const lead of sampleLeads) {
      await prisma.collegeLead.create({ data: lead });
    }
    console.log(`[Seed] Seeded ${sampleLeads.length} initial institutional pipeline leads.`);
  }

  // 6. Seed Sample Submissions for aggregate metrics
  const existingSubmissions = await prisma.assessmentSubmission.count();
  if (existingSubmissions === 0) {
    const sampleSubmissions = [
      {
        studentName: 'Aditya Kulkarni',
        studentEmail: 'aditya.k@vidyapeeth.edu.in',
        studentPhone: '+91 98220 11999',
        collegeName: 'Vidyapeeth Institute of Technology',
        branch: 'Computer Science & Engineering',
        graduationYear: 2027,
        totalScore: 18,
        percentage: 90.0,
        quantScore: 5,
        logicalScore: 5,
        verbalScore: 4,
        dsaScore: 4,
        timeTakenSeconds: 1140,
        readinessBand: 'SUPER_DREAM_READY',
        answersJson: JSON.stringify({ q1: 1, q2: 1, q3: 2 })
      },
      {
        studentName: 'Pooja Hegde',
        studentEmail: 'pooja.h@sahyadri.edu.in',
        studentPhone: '+91 94480 33888',
        collegeName: 'Sahyadri College of Engineering & Management',
        branch: 'Information Science & Engineering',
        graduationYear: 2027,
        totalScore: 14,
        percentage: 70.0,
        quantScore: 4,
        logicalScore: 4,
        verbalScore: 3,
        dsaScore: 3,
        timeTakenSeconds: 1200,
        readinessBand: 'PLACEMENT_READY',
        answersJson: JSON.stringify({ q1: 1, q2: 0, q3: 2 })
      },
      {
        studentName: 'Vignesh Sundaram',
        studentEmail: 'vignesh.s@ciet.ac.in',
        studentPhone: '+91 98420 55777',
        collegeName: 'Coimbatore Institute of Engineering & Technology',
        branch: 'Electronics & Communication Engineering',
        graduationYear: 2026,
        totalScore: 8,
        percentage: 40.0,
        quantScore: 2,
        logicalScore: 3,
        verbalScore: 2,
        dsaScore: 1,
        timeTakenSeconds: 1200,
        readinessBand: 'FOUNDATION_NEEDED',
        answersJson: JSON.stringify({ q1: 0, q2: 2, q3: 1 })
      }
    ];

    for (const sub of sampleSubmissions) {
      await prisma.assessmentSubmission.create({ data: sub });
    }
    console.log(`[Seed] Seeded ${sampleSubmissions.length} sample assessment submissions.`);
  }

  console.log('[Seed] Database initialization complete!');
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
