import React from 'react';

interface WorldPageProps {
  children?: React.ReactNode;
}

// WorldPage is now a simple wrapper that just renders children
// All the actual game content (stats, map, combat, inventory) comes from App.tsx as children
export const WorldPage: React.FC<WorldPageProps> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {children}
    </div>
  );
};
