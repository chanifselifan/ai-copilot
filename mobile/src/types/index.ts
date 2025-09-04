export type Message = {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: Date;
  isTyping?: boolean;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};



