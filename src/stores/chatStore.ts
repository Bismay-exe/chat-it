import { create } from 'zustand';

interface ChatState {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  chats: any[]; // Placeholder
  setChats: (chats: any[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChatId: null,
  setActiveChatId: (id) => set({ activeChatId: id }),
  chats: [],
  setChats: (chats) => set({ chats }),
}));
