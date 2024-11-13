import React, { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import InfiniteScroll from 'react-infinite-scroll-component';

// Move debounce hook outside component to prevent recreating it on every render
const useDebounce = (callback, delay) => {
  const debouncedCallback = useCallback(
    (...args) => {
      const timeoutId = setTimeout(() => callback(...args), delay);
      return () => clearTimeout(timeoutId);
    },
    [callback, delay]
  );
  return debouncedCallback;
};

const App = () => {
  const [images, setImages] = useState([]);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  const API_KEY = process.env.REACT_APP_PEXELS_API_KEY;
  const PER_PAGE = 15;

  const fetchImages = useCallback(async (pageNum, query = '') => {
    setError(null);

    if (!API_KEY) {
      setError('API key is missing. Please check your environment variables.');
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
      const totalResults = data.total_results || 0;

      if (pageNum === 1) {
        setImages(data.photos);
      } else {
        setImages(prev => [...prev, ...data.photos]);
      }

      setHasMore(totalResults > pageNum * PER_PAGE);
    } catch (error) {
      console.error('Error fetching images:', error);
      setError(error.message);
      setHasMore(false);
    }
  }, [API_KEY]); // API_KEY is the only external dependency needed

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setPage(1);
  }, []); // No dependencies needed since setSearchQuery and setPage are stable

  const debouncedSearch = useDebounce(handleSearch, 500);

  useEffect(() => {
    fetchImages(page, searchQuery);
  }, [fetchImages, page, searchQuery]);

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []); // No dependencies needed since setPage is stable

  const handleSearchInput = useCallback((e) => {
    const value = e.target.value;
    setSearchInput(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setSearchQuery('');
    setPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="fixed top-0 left-0 right-0 z-10 bg-gray-800/95 backdrop-blur-sm shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <h1 className="app-title text-4xl font-bold mb-4 text-center tracking-wide">Sejoz Galer</h1>
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

      <main className="container mx-auto px-4 pt-32 pb-8">
        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <InfiniteScroll
          dataLength={images.length}
          next={loadMore}
          hasMore={hasMore}
          loader={
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          }
        >
          <div className="gallery-grid">
            {images.map((image) => (
              <div
                key={image.id}
                className="gallery-item relative group cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl m-2"
                onClick={() => setSelectedImage(image)}
              >
                <div className="relative h-full rounded-lg overflow-hidden">
                  <img
                    src={image.src.large}
                    alt={image.photographer}
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm">Photo by {image.photographer}</p>
                </div>
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </main>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl w-full mx-auto flex flex-col items-center">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 z-50 bg-gray-800/50 px-4 py-2 rounded-lg backdrop-blur-sm"
            >
              Return to Gallery
            </button>
            <img
              src={selectedImage.src.large2x}
              alt={selectedImage.photographer}
              className="lightbox-image rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="mt-4 text-center">
              <p className="text-lg">Photo by {selectedImage.photographer}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;