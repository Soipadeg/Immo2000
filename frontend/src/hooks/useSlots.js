import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';
import apiClient from '../services/apiClient';

/**
 * useSlots - Custom hook for managing appointment slots
 * Handles API calls and state management for slots
 */
export const useSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all slots for current user
   */
  const fetchSlots = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(
        `/api/creneaux/vendeurs/${user.id}/creneaux`
      );
      setSlots(response.data || []);
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du chargement des créneaux';
      setError(message);
      console.error('Fetch slots error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Create new slot
   */
  const createSlot = useCallback(async (slotData) => {
    setError(null);

    try {
      const payload = {
        debut: new Date(slotData.debut).toISOString(),
        fin: new Date(slotData.fin).toISOString(),
        type_creneau: slotData.type_creneau,
        remarques: slotData.remarques || '',
        vendeur_id: user?.id,
      };

      const response = await apiClient.post('/api/creneaux', payload);

      // If recurrence is needed, create recurring slots
      if (slotData.recurrence && slotData.recurrence !== 'NONE' && slotData.recurrence_fin) {
        await createRecurringSlots(slotData);
      } else {
        // Add single slot to list
        setSlots((prev) => [...prev, response.data]);
      }

      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de la création du créneau';
      setError(message);
      throw new Error(message);
    }
  }, [user?.id]);

  /**
   * Update existing slot
   */
  const updateSlot = useCallback(async (slotId, slotData) => {
    setError(null);

    try {
      const payload = {
        debut: new Date(slotData.debut).toISOString(),
        fin: new Date(slotData.fin).toISOString(),
        type_creneau: slotData.type_creneau,
        remarques: slotData.remarques || '',
      };

      const response = await apiClient.put(
        `/api/creneaux/${slotId}`,
        payload
      );

      // Update slot in list
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? response.data : s))
      );

      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de la mise à jour du créneau';
      setError(message);
      throw new Error(message);
    }
  }, []);

  /**
   * Delete slot
   */
  const deleteSlot = useCallback(async (slotId) => {
    setError(null);

    try {
      await apiClient.delete(`/api/creneaux/${slotId}`);

      // Remove slot from list
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors de la suppression du créneau';
      setError(message);
      throw new Error(message);
    }
  }, []);

  /**
   * Mark slot as available
   */
  const markAvailable = useCallback(async (slotId) => {
    setError(null);

    try {
      const response = await apiClient.put(
        `/api/creneaux/${slotId}/marquer-disponible`
      );

      // Update slot in list
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? response.data : s))
      );

      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du marquage';
      setError(message);
      throw new Error(message);
    }
  }, []);

  /**
   * Mark slot as reserved
   */
  const markReserved = useCallback(async (slotId) => {
    setError(null);

    try {
      const response = await apiClient.put(
        `/api/creneaux/${slotId}/marquer-reserve`
      );

      // Update slot in list
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? response.data : s))
      );

      return response.data;
    } catch (err) {
      const message = err.response?.data?.detail || 'Erreur lors du marquage';
      setError(message);
      throw new Error(message);
    }
  }, []);

  /**
   * Create recurring slots
   */
  const createRecurringSlots = useCallback(
    async (slotData) => {
      try {
        const payload = {
          debut: new Date(slotData.debut).toISOString(),
          fin: new Date(slotData.fin).toISOString(),
          type_creneau: slotData.type_creneau,
          remarques: slotData.remarques || '',
          recurrence: slotData.recurrence,
          recurrence_fin: new Date(slotData.recurrence_fin).toISOString(),
          vendeur_id: user?.id,
        };

        const response = await apiClient.post('/api/creneaux/recurrent', payload);

        // Fetch all slots again to get the new recurring ones
        await fetchSlots();

        return response.data;
      } catch (err) {
        const message = err.response?.data?.detail || 'Erreur lors de la création des créneaux récurrents';
        setError(message);
        throw new Error(message);
      }
    },
    [user?.id, fetchSlots]
  );

  /**
   * Get slot by ID
   */
  const getSlotById = useCallback((slotId) => {
    return slots.find((s) => s.id === slotId);
  }, [slots]);

  /**
   * Get slots for specific date
   */
  const getSlotsForDate = useCallback((date) => {
    const dateStr = new Date(date).toDateString();
    return slots.filter((s) => new Date(s.debut).toDateString() === dateStr);
  }, [slots]);

  /**
   * Get available slots for specific date
   */
  const getAvailableSlotsForDate = useCallback((date) => {
    return getSlotsForDate(date).filter((s) => s.status === 'AVAILABLE');
  }, [getSlotsForDate]);

  /**
   * Initialize - fetch slots on component mount
   */
  useEffect(() => {
    if (user?.id) {
      fetchSlots();
    }
  }, [user?.id, fetchSlots]);

  return {
    slots,
    loading,
    error,
    createSlot,
    updateSlot,
    deleteSlot,
    markAvailable,
    markReserved,
    fetchSlots,
    getSlotById,
    getSlotsForDate,
    getAvailableSlotsForDate,
  };
};
