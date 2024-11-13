import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';

const App = () => {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  const API_KEY = process.env.REACT_APP_PEXELS_API_KEY;
  const PER_PAGE = 15;

  const fetchImages = async (pageNum, query = '') => {
    setLoading(true);
    setError(null);

    if (!API_KEY) {
      setError('API key is missing. Please check your environment variables.');
      setLoading(false);
      return;
    }

    try {
      const baseUrl = query
        ? `https://api.pexels.com/v1/search?query=${query}&per_page=${PER_PAGE}&page=${pageNum}`
        : `https://api.pexels.com/v1/curated?per_page=${PER_PAGE}&page=${pageNum}`;

      const response = await fetch(baseUrl, {
        headers: {
          'Authorization': API_KEY,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Please check your API key');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (pageNum === 1) {
        setImages(data.photos);
      } else {
        setImages(prev => [...prev, ...data.photos]);
      }

      setHasMore(data.total_results > page * PER_PAGE);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError(error.message);
      setHasMore(false);
    }
    setLoading(false);
  };

  // Debounced search implementation
  const debouncedSearch = useCallback(
    debounce((query) => {
      setSearchQuery(query);
      setPage(1);
    }, 500),
    []
  );

  useEffect(() => {
    fetchImages(1, searchQuery);
  }, [searchQuery]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchImages(nextPage, searchQuery);
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-gray-800/95 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="app-title text-4xl font-bold mb-4 text-center tracking-wide">Sejoz Galer</h1>

          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search for amazing photos..."
              value={searchInput}
              onChange={handleSearchInput}
              className="w-full px-4 py-2 bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            {searchInput && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-white" />
              </button>
            )}
          </div>
        </div>
      </header>
  );
};

}

export default App;