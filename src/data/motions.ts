import type { Motion, MotionCategory, MotionDifficulty } from "@/types/debate";

const B: MotionDifficulty = "Beginner";
const I: MotionDifficulty = "Intermediate";
const A: MotionDifficulty = "Advanced";

function group(category: MotionCategory, items: [string, MotionDifficulty][]): Motion[] {
  return items.map(([text, difficulty]) => ({ text, category, difficulty }));
}

/** Built-in Motion Library — no AI needed. */
export const MOTIONS: Motion[] = [
  ...group("Education", [
    ["This House would abolish homework in primary schools", B],
    ["This House believes school uniforms do more good than harm", B],
    ["This House would make coding a compulsory school subject", B],
    ["This House would replace exams with continuous assessment", I],
    ["This House believes university education should be free for all", I],
    ["This House would ban mobile phones in schools", B],
    ["This House believes grading students does more harm than good", A],
    ["This House would allow students to choose their own teachers", I],
  ]),
  ...group("Technology & AI", [
    ["This House believes AI will create more jobs than it destroys", I],
    ["This House would ban social media for children under 16", B],
    ["This House would require all AI-generated content to be labelled", I],
    ["This House believes students should be allowed to use AI for homework", B],
    ["This House would grant legal personhood to advanced AI systems", A],
    ["This House believes the benefits of facial recognition outweigh its harms", A],
    ["This House would pause development of the most powerful AI models", A],
    ["This House believes smartphones have made us less social", B],
  ]),
  ...group("Environment", [
    ["This House would ban single-use plastics", B],
    ["This House believes nuclear power is essential to fight climate change", I],
    ["This House would introduce a tax on red meat", A],
    ["This House would make public transport free in all cities", I],
    ["This House believes individuals bear responsibility for climate change", I],
    ["This House would ban private cars from city centres", I],
    ["This House believes rich countries should pay for climate damage in poorer countries", A],
    ["This House would plant trees instead of building new parks with lawns", B],
  ]),
  ...group("Society", [
    ["This House would lower the voting age to 16", B],
    ["This House believes celebrities have a duty to be role models", B],
    ["This House would make voting compulsory", I],
    ["This House believes cancel culture does more harm than good", A],
    ["This House would introduce a four-day work week", I],
    ["This House believes cities are better places to live than villages", B],
    ["This House would ban advertising aimed at children", I],
    ["This House believes the news media has too much influence on politics", A],
  ]),
  ...group("Economics", [
    ["This House would introduce a universal basic income", I],
    ["This House believes billionaires should not exist", A],
    ["This House would replace cash with digital payments entirely", I],
    ["This House believes tourism does more harm than good to local communities", I],
    ["This House would raise the minimum wage significantly", I],
    ["This House believes globalisation has benefited developing countries", A],
    ["This House would tax sugary drinks", B],
    ["This House believes working from home is better than working in an office", B],
  ]),
  ...group("Health", [
    ["This House would ban junk food advertising", B],
    ["This House believes mental health days should be given to all students", B],
    ["This House would make healthy school meals free for every child", B],
    ["This House would make organ donation opt-out by default", I],
    ["This House believes fitness trackers do more good than harm", I],
    ["This House would ban energy drinks for under-18s", B],
    ["This House believes governments should fund alternative medicine", A],
    ["This House would require a health warning on edited photos in adverts", I],
  ]),
  ...group("Sports", [
    ["This House believes esports are real sports", B],
    ["This House would ban boxing", I],
    ["This House would pay men and women equal prize money in all sports", I],
    ["This House believes video referees have ruined the spirit of sport", B],
    ["This House would allow performance-enhancing drugs in professional sport", A],
    ["This House believes hosting the Olympics is not worth the cost", I],
    ["This House would make physical education optional in secondary schools", B],
    ["This House believes athletes should use their platform for political causes", A],
  ]),
  ...group("Ethics", [
    ["This House believes zoos do more harm than good", B],
    ["This House would ban animal testing for all products", I],
    ["This House believes it is wrong to eat meat", A],
    ["This House would allow the sale of human organs", A],
    ["This House believes lying is sometimes the right thing to do", B],
    ["This House would prioritise saving more lives over saving younger lives", A],
    ["This House believes wealthy people have a moral duty to give away most of their money", A],
    ["This House would allow parents to choose the genes of their children", A],
  ]),
  ...group("Fun & Light-hearted", [
    ["This House believes cats are better pets than dogs", B],
    ["This House would rather be able to fly than be invisible", B],
    ["This House believes pineapple belongs on pizza", B],
    ["This House believes breakfast is the most important meal of the day", B],
    ["This House would choose to live in the past rather than the future", I],
    ["This House believes superheroes do more harm than good", I],
    ["This House believes books are always better than their movies", B],
    ["This House would replace all homework with video games", B],
  ]),
];

export function randomMotion(pool: Motion[] = MOTIONS): Motion {
  return pool[Math.floor(Math.random() * pool.length)];
}
