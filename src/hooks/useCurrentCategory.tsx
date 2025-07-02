import React, { createContext, useContext, useState } from "react";

interface CurrentCategoryState {
  currentCategoryId: string | null;
  setCurrentCategoryId: (id: string | null) => void;
}

const CurrentCategoryContext = createContext<CurrentCategoryState | undefined>(
  undefined,
);

export const CurrentCategoryProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(
    null,
  );
  return (
    <CurrentCategoryContext.Provider
      value={{ currentCategoryId, setCurrentCategoryId }}
    >
      {children}
    </CurrentCategoryContext.Provider>
  );
};

export const useCurrentCategory = () => {
  const ctx = useContext(CurrentCategoryContext);
  if (!ctx)
    throw new Error(
      "useCurrentCategory must be used within CurrentCategoryProvider",
    );
  return ctx;
};
