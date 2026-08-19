import { useState, useEffect } from 'react';

/**
 * Custom hook to manage user's favorite Kurmanji words and categories.
 * Tracks raw ID strings as keys in a persistent record, kept in sync with localStorage.
 * 
 * Future updates can easily adapt this hook to sync with a Firebase Firestore
 * collection instead of client-side local storage.
 * 
 * @returns {Object} { favorites, toggleFavorite, isFavorite }
 */
export function useFavorites() {
  // Lazily retrieve list of favorited item IDs from local storage or fallback to empty dictionary
  const [favorites, setFavorites] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('kurmanji_favorites');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Automatically write any changes back to disk
  useEffect(() => {
    localStorage.setItem('kurmanji_favorites', JSON.stringify(favorites));
  }, [favorites]);

  /**
   * Toggles the favorited status of a given string ID.
   * If it already exists, removes it. Otherwise, marks it as true.
   * 
   * @param {string} id - The ID of the word or lesson to toggle.
   */
  const toggleFavorite = (id: string) => {
    setFavorites(prev => {
      const newFavs = { ...prev };
      if (newFavs[id]) {
        delete newFavs[id];
      } else {
        newFavs[id] = true;
      }
      return newFavs;
    });
  };

  /**
   * Helper utility to quickly query if a given ID is favorited.
   * 
   * @param {string} id - The ID to check.
   * @returns {boolean} True if favorited, false otherwise.
   */
  const isFavorite = (id: string) => !!favorites[id];

  return { favorites, toggleFavorite, isFavorite };
}

