// store/admin.ts
import { create } from 'zustand';

interface AdminStore {
  isAdmin: boolean;
  setAdmin: (email: string | null | undefined) => void;
}

const ADMIN_EMAILS = ['archinime77@gmail.com'];

export const useAdmin = create<AdminStore>((set) => ({
  isAdmin: false,
  setAdmin: (email) => {
    set({ isAdmin: !!email && ADMIN_EMAILS.includes(email.toLowerCase()) });
  },
}));