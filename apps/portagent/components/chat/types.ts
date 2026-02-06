export interface ToolInfo {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolResult?: unknown;
  status: string;
}

export interface Message {
  id: string;
  from: "user" | "assistant";
  content: string;
  tool?: ToolInfo;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
}

export interface User {
  id: string;
  email: string;
  role: "admin" | "user";
}
