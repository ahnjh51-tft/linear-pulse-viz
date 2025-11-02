import { createContext, useContext, useState, ReactNode } from 'react';
import { subMonths } from 'date-fns';

interface DateRange {
  from: Date;
  to: Date;
}

interface DashboardContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  lastRefreshed: Date | null;
  refresh: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(new Date());

  const refresh = () => {
    setLastRefreshed(new Date());
  };

  return (
    <DashboardContext.Provider value={{ dateRange, setDateRange, lastRefreshed, refresh }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
};
