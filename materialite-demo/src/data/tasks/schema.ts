export type Task = {
  id: string;
  assignee: string;
  title: string;
  description: string;
  dueDate: Date;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  labels: string[];
  project: string;
};
