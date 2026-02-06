export interface Message {
  id: string;
  from: "user" | "assistant";
  content: string;
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
