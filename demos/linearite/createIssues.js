import { nanoid } from "nanoid";

export const names = [
  "John",
  "Jane",
  "Sam",
  "Anna",
  "Michael",
  "Sarah",
  "Chris",
  "Jessica",
];
export const projects = [
  "Website Redesign",
  "App Development",
  "Marketing Strategy",
  "Customer Outreach",
];
export const labels = [
  "frontend",
  "backend",
  "ux",
  "research",
  "design",
  "bug",
  "feature",
];
export const priorities = ["none", "low", "medium", "high", "urgent"];
export const statuses = ["backlog", "todo", "in_progress", "done", "canceled"];

export function* createIssues(numTasks) {
  const actionPhrases = [
    "Implement",
    "Develop",
    "Design",
    "Test",
    "Review",
    "Refactor",
    "Redesign",
    "Enhance",
    "Optimize",
    "Fix",
  ];
  const featurePhrases = [
    "the login mechanism",
    "the user dashboard",
    "the settings page",
    "database queries",
    "UI/UX components",
    "API endpoints",
    "the checkout process",
    "responsive layouts",
    "error handling logic",
    "the navigation menu",
  ];
  const purposePhrases = [
    "to improve user experience",
    "to speed up load times",
    "to enhance security",
    "to prepare for the next release",
    "following the latest design mockups",
    "to address reported issues",
    "for better mobile responsiveness",
    "to comply with new regulations",
    "to reflect customer feedback",
    "to keep up with platform changes",
  ];
  const contextPhrases = [
    "Based on the latest UX research",
    "To ensure seamless user experience",
    "To cater to increasing user demands",
    "Keeping scalability in mind",
    "As outlined in the last meeting",
    "Following the latest design specifications",
    "To adhere to the updated requirements",
    "While ensuring backward compatibility",
    "To improve overall performance",
    "And ensure proper error feedback to the user",
  ];

  const getRandomItem = (items) =>
    items[Math.floor(Math.random() * items.length)];

  const generateText = () => {
    const action = getRandomItem(actionPhrases);
    const feature = getRandomItem(featurePhrases);
    const purpose = getRandomItem(purposePhrases);
    const context = getRandomItem(contextPhrases);
    return [
      `${action} ${feature}`,
      `${action} ${feature} ${purpose}. ${context}.`,
    ];
  };

  for (let i = 0; i < numTasks; i++) {
    const [title, description] = generateText();
    const task = {
      id: nanoid(),
      creator: getRandomItem(names),
      title,
      created: Date.now() - (i % 365 * 5) * 24 * 60 * 60 * 1000,
      modified: Date.now() - (i % 365 * 2) * 24 * 60 * 60 * 1000,
      status: getRandomItem(statuses),
      priority: getRandomItem(priorities),
      kanbanorder: 1,
    };
    yield [task, {
      id: task.id,
      body: description,
    }];
  }
}
