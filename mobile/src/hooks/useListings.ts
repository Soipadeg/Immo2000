import { useCallback, useState, useEffect } from 'react';
import { getApiClient } from '../api/client';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string[];
  location: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  createdAt: string;
  updatedAt: string;
}

interface ListingsFilter {
  minPrice?: number;
  maxPrice?: number;
  type?: string;
  location?: string;
  page?: number;
  limit?: number;
}

export const useListings = (filter?: ListingsFilter) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const api = getApiClient();

  const fetchListings = useCallback(async (f?: ListingsFilter) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/listings', { params: f || filter });
      setListings(response.data.listings);
      setHasMore(response.data.hasMore);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchListing = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/listings/${id}`);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch listing');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createListing = useCallback(async (data: Partial<Listing>) => {
    setLoading(true);
    try {
      const response = await api.post('/listings', data);
      setListings((prev) => [response.data, ...prev]);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to create listing');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, []);

  return {
    listings,
    loading,
    error,
    hasMore,
    fetchListings,
    fetchListing,
    createListing,
  };
};
