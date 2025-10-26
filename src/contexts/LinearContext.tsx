import React, { createContext, useContext, useState, useEffect } from 'react';

interface LinearContextType {
  apiKey: string | null;
  isConnected: boolean;
  selectedTeamId: string | null;
  connect: (key: string) => void;
  disconnect: () => void;
  setSelectedTeam: (teamId: string) => void;
}

const LinearContext = createContext<LinearContextType | undefined>(undefined);

export const LinearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('linear_api_key');
    const storedTeamId = localStorage.getItem('selected_team_id');
    if (storedKey) setApiKey(storedKey);
    if (storedTeamId) setSelectedTeamId(storedTeamId);
  }, []);

  const connect = (key: string) => {
    localStorage.setItem('linear_api_key', key);
    setApiKey(key);
  };

  const disconnect = () => {
    localStorage.removeItem('linear_api_key');
    localStorage.removeItem('selected_team_id');
    setApiKey(null);
    setSelectedTeamId(null);
  };

  const setSelectedTeam = (teamId: string) => {
    localStorage.setItem('selected_team_id', teamId);
    setSelectedTeamId(teamId);
  };

  return (
    <LinearContext.Provider
      value={{
        apiKey,
        isConnected: !!apiKey,
        selectedTeamId,
        connect,
        disconnect,
        setSelectedTeam,
      }}
    >
      {children}
    </LinearContext.Provider>
  );
};

export const useLinear = () => {
  const context = useContext(LinearContext);
  if (!context) throw new Error('useLinear must be used within LinearProvider');
  return context;
};
