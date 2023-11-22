export type Status = "todo" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";
export type Task = {
  id: number;
  assignee: string;
  title: string;
  description: string;
  dueDate: Date;
  status: Status;
  priority: Priority;
  labels: string[];
  project: string;
  selected?: boolean;
};
export type Comment = {
  id: number;
  taskId: number;
  content: string;
  created: number;
};
