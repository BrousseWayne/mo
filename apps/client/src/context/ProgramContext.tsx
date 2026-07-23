import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

const STORAGE_KEY = "mo.program_id";

interface ProgramContextValue {
  programId: string | null;
  setProgramId: (id: string | null) => void;
}

const ProgramContext = createContext<ProgramContextValue>({
  programId: null,
  setProgramId: () => {},
});

export function ProgramProvider({ children }: { children: ReactNode }) {
  const [programId, setProgramIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY)
  );

  const setProgramId = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    setProgramIdState(id);
  }, []);

  return (
    <ProgramContext.Provider value={{ programId, setProgramId }}>
      {children}
    </ProgramContext.Provider>
  );
}

export function useProgramId() {
  return useContext(ProgramContext);
}
