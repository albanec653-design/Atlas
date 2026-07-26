import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Page } from '@/lib/types';

type NavContextValue = {
  page: Page;
  navigate: (page: Page) => void;
};

const NavContext = createContext<NavContextValue | undefined>(undefined);

export function NavProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>({ name: 'home' });

  const navigate = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return <NavContext.Provider value={{ page, navigate }}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error('useNav must be used within NavProvider');
  return ctx;
}
