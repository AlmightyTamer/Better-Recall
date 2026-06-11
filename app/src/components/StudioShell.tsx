import { type ReactNode } from 'react';
import AnimatedPanel from './AnimatedPanel';

interface StudioShellProps {
  children: ReactNode;
  flowerSrc?: string;
  contentKey?: string;
  header?: ReactNode;
  footer?: ReactNode;
  dimOverlay?: number;
}

export default function StudioShell({
  children,
  contentKey,
  header,
  footer,
}: StudioShellProps) {
  return (
    <div className="studio-screen studio-app dash-shell">
      {header}
      <AnimatedPanel panelKey={contentKey ?? 'content'} className="studio-app-content">
        {children}
      </AnimatedPanel>
      {footer}
    </div>
  );
}
