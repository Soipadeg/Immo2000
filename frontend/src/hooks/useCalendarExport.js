import { useState, useCallback } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import apiClient from '../services/api/client';

/**
 * Hook pour exporter les rendez-vous en calendrier (iCal, vCalendar)
 */
export const useCalendarExport = () => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);
  const { addNotification } = useNotificationStore();

  /**
   * Exporter les rendez-vous en iCal
   */
  const exportAsICal = useCallback(async (filters = {}) => {
    setExporting(true);
    setError(null);
    try {
      const response = await apiClient.get('/calendar/export/ical', {
        params: filters,
        responseType: 'blob',
      });

      if (response.data) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `appointments-${new Date().getTime()}.ics`);
        document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
        window.URL.revokeObjectURL(url);

        addNotification('success', 'Calendrier exporté en iCal');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'export iCal';
      setError(message);
      addNotification('error', message);
      return false;
    } finally {
      setExporting(false);
    }
  }, [addNotification]);

  /**
   * Exporter en vCalendar (.vcs)
   */
  const exportAsVCalendar = useCallback(async (filters = {}) => {
    setExporting(true);
    setError(null);
    try {
      const response = await apiClient.get('/calendar/export/vcalendar', {
        params: filters,
        responseType: 'blob',
      });

      if (response.data) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `appointments-${new Date().getTime()}.vcs`);
        document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
        window.URL.revokeObjectURL(url);

        addNotification('success', 'Calendrier exporté en vCalendar');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'export vCalendar';
      setError(message);
      addNotification('error', message);
      return false;
    } finally {
      setExporting(false);
    }
  }, [addNotification]);

  /**
   * Exporter en CSV
   */
  const exportAsCSV = useCallback(async (filters = {}) => {
    setExporting(true);
    setError(null);
    try {
      const response = await apiClient.get('/calendar/export/csv', {
        params: filters,
        responseType: 'blob',
      });

      if (response.data) {
        const url = window.URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `appointments-${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentElement.removeChild(link);
        window.URL.revokeObjectURL(url);

        addNotification('success', 'Calendrier exporté en CSV');
        return true;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'export CSV';
      setError(message);
      addNotification('error', message);
      return false;
    } finally {
      setExporting(false);
    }
  }, [addNotification]);

  /**
   * Générer un lien de partage du calendrier
   */
  const generateShareLink = useCallback(async (calenderId) => {
    setExporting(true);
    setError(null);
    try {
      const response = await apiClient.post('/calendar/share', {
        calendar_id: calenderId,
      });

      if (response.data && response.data.share_url) {
        addNotification('success', 'Lien de partage généré');
        return response.data.share_url;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la génération du lien';
      setError(message);
      addNotification('error', message);
      return null;
    } finally {
      setExporting(false);
    }
  }, [addNotification]);

  /**
   * Importer un calendrier externe
   */
  const importCalendar = useCallback(async (file) => {
    setExporting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await apiClient.post('/calendar/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data) {
        addNotification('success', `${response.data.imported_count} rendez-vous importés`);
        return response.data.imported_count;
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'import';
      setError(message);
      addNotification('error', message);
      return 0;
    } finally {
      setExporting(false);
    }
  }, [addNotification]);

  return {
    exporting,
    error,
    exportAsICal,
    exportAsVCalendar,
    exportAsCSV,
    generateShareLink,
    importCalendar,
  };
};
