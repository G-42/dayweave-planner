import { ReactNode } from 'react';
import { Navigation } from './Navigation';

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
}

export const Layout = ({ children, showNavigation = true }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/30">
      <main className={`${showNavigation ? 'pb-20' : ''} min-h-screen`}>
        {children}
      </main>
      {showNavigation && <Navigation />}
    </div>
  );
};