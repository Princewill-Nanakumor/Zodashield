// src/components/dashboardComponents/LoadingState.tsx
"use client";

interface LoadingStateProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  children,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse rounded-full w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};

export default LoadingState;
