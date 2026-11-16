import React from 'react';

export function generateStaticParams() {
  return [{ token: 'placeholder' }];
}

export default function TrackingTokenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
