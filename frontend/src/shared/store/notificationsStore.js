import { create } from "zustand";

export const useNotificationsStore = create((set) => ({
  toasts: [],
  notifications: [],
  unreadCount: 0,

  pushToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { id: crypto.randomUUID(), tone: "neutral", ...toast }],
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  receiveNotification: (notification) =>
    set((s) => ({
      notifications: [notification, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),
  markAllRead: () => set({ unreadCount: 0 }),
}));
