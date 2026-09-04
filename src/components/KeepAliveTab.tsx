import React from 'react';

export function KeepAliveTab({
  active,
  mounted,
  children
}: {
  active: boolean;
  mounted: boolean;
  children: React.ReactNode;
}) {
  if (!mounted) return null;
  return (
    <div
      aria-hidden={!active}
      style={{ display: active ? 'block' : 'none' }}
    >
      {children}
    </div>
  );
}
