import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { getLoadingState, startLoading, stopLoading, subscribeLoadingState } from './loadingStore';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(getLoadingState());

  useEffect(() => subscribeLoadingState(setLoading), []);

  const value = useMemo(
    () => ({
      loading,
      setLoading: (nextValue) => (nextValue ? startLoading() : stopLoading()),
      startLoading,
      stopLoading,
    }),
    [loading],
  );

  return <LoadingContext.Provider value={value}>{children}</LoadingContext.Provider>;
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

export default LoadingContext;
