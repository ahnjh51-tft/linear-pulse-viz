import { useState, useMemo, useCallback } from 'react';

export const useSearch = <T>(
  items: T[],
  searchKeys: (keyof T | ((item: T) => string))[],
  debounceMs = 300
) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [debounceMs]);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) return items;

    const query = debouncedQuery.toLowerCase();
    return items.filter((item) => {
      return searchKeys.some((key) => {
        const value = typeof key === 'function'
          ? key(item)
          : String(item[key] || '');
        return value.toLowerCase().includes(query);
      });
    });
  }, [items, debouncedQuery, searchKeys]);

  return {
    searchQuery,
    setSearchQuery: handleSearch,
    filteredItems,
  };
};
