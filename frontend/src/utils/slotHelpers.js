/**
 * Slot Helper Utilities
 * Functions for slot management, formatting, and validation
 */

/**
 * Format time from Date or string to locale string (HH:MM)
 * @param {Date|string} dateInput - Date to format
 * @returns {string} Formatted time (HH:MM)
 */
export const formatTime = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Format date and time
 * @param {Date|string} dateInput - Date to format
 * @returns {string} Formatted date and time (DD/MM/YYYY HH:MM)
 */
export const formatDateTime = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '--/--/---- --:--';

  const d = date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const t = formatTime(date);

  return `${d} ${t}`;
};

/**
 * Format date only
 * @param {Date|string} dateInput - Date to format
 * @returns {string} Formatted date (DD/MM/YYYY)
 */
export const formatDate = (dateInput) => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '--/--/----';

  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

/**
 * Get slot status label in French
 * @param {string} status - Slot status
 * @returns {string} French label
 */
export const getStatusLabel = (status) => {
  const labels = {
    AVAILABLE: 'Disponible',
    RESERVED: 'Réservé',
    EXPIRED: 'Expiré',
    CANCELLED: 'Annulé',
  };
  return labels[status] || status;
};

/**
 * Get slot status color for UI
 * @param {string} status - Slot status
 * @returns {string} Bootstrap color variant
 */
export const getStatusColor = (status) => {
  const colors = {
    AVAILABLE: 'success',
    RESERVED: 'warning',
    EXPIRED: 'danger',
    CANCELLED: 'secondary',
  };
  return colors[status] || 'secondary';
};

/**
 * Get slot type label in French
 * @param {string} type - Slot type
 * @returns {string} French label
 */
export const getTypeLabel = (type) => {
  const labels = {
    VISIT: 'Visite Propriété',
    CONSULTATION: 'Consultation',
    MEETING: 'Réunion',
    OTHER: 'Autre',
  };
  return labels[type] || type;
};

/**
 * Check if slot is available
 * @param {object} slot - Slot object
 * @returns {boolean} True if slot is available
 */
export const isSlotAvailable = (slot) => {
  if (!slot) return false;
  const now = new Date();
  const slotEnd = new Date(slot.fin);
  return slot.status === 'AVAILABLE' && slotEnd > now;
};

/**
 * Generate time intervals for a day
 * @param {number} intervalMinutes - Minutes between intervals (default 30)
 * @param {number} startHour - Start hour (default 8)
 * @param {number} endHour - End hour (default 18)
 * @returns {array} Array of time strings (HH:MM format)
 */
export const generateTimeIntervals = (intervalMinutes = 30, startHour = 8, endHour = 18) => {
  const intervals = [];
  const totalMinutes = (endHour - startHour) * 60;
  const numIntervals = Math.floor(totalMinutes / intervalMinutes);

  for (let i = 0; i <= numIntervals; i++) {
    const minutes = i * intervalMinutes;
    const hours = startHour + Math.floor(minutes / 60);
    const mins = minutes % 60;

    const timeStr = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    intervals.push(timeStr);
  }

  return intervals;
};

/**
 * Check if two time slots overlap
 * @param {object} slot1 - First slot
 * @param {object} slot2 - Second slot
 * @returns {boolean} True if slots overlap
 */
export const checkOverlapHelper = (slot1, slot2) => {
  if (!slot1 || !slot2) return false;

  const start1 = new Date(slot1.debut);
  const end1 = new Date(slot1.fin);
  const start2 = new Date(slot2.debut);
  const end2 = new Date(slot2.fin);

  return start1 < end2 && end1 > start2;
};

/**
 * Check if multiple slots overlap with a given slot
 * @param {object} slot - Slot to check
 * @param {array} otherSlots - Array of slots to check against
 * @returns {array} Array of overlapping slots
 */
export const findOverlappingSlots = (slot, otherSlots = []) => {
  return otherSlots.filter((other) => checkOverlapHelper(slot, other));
};

/**
 * Get duration of slot in minutes
 * @param {object} slot - Slot object
 * @returns {number} Duration in minutes
 */
export const getSlotDuration = (slot) => {
  if (!slot) return 0;
  const start = new Date(slot.debut);
  const end = new Date(slot.fin);
  return Math.round((end - start) / 1000 / 60);
};

/**
 * Parse slot status from any input
 * @param {string} status - Status string
 * @returns {string} Normalized status
 */
export const parseSlotStatus = (status) => {
  const normalized = String(status).toUpperCase();
  const validStatuses = ['AVAILABLE', 'RESERVED', 'EXPIRED', 'CANCELLED'];
  return validStatuses.includes(normalized) ? normalized : 'AVAILABLE';
};

/**
 * Get next available slot from array
 * @param {array} slots - Array of slots
 * @returns {object} Next available slot or null
 */
export const getNextAvailableSlot = (slots = []) => {
  const now = new Date();
  const availableSlots = slots.filter((s) => {
    const slotStart = new Date(s.debut);
    const slotEnd = new Date(s.fin);
    return s.status === 'AVAILABLE' && slotStart > now && slotEnd > now;
  });

  if (availableSlots.length === 0) return null;

  // Sort by start time and return first
  return availableSlots.sort((a, b) => {
    return new Date(a.debut) - new Date(b.debut);
  })[0];
};

/**
 * Group slots by date
 * @param {array} slots - Array of slots
 * @returns {object} Object with dates as keys and slot arrays as values
 */
export const groupSlotsByDate = (slots = []) => {
  const grouped = {};

  slots.forEach((slot) => {
    const dateKey = formatDate(slot.debut);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(slot);
  });

  // Sort slots within each date by start time
  Object.keys(grouped).forEach((dateKey) => {
    grouped[dateKey].sort((a, b) => {
      return new Date(a.debut) - new Date(b.debut);
    });
  });

  return grouped;
};

/**
 * Check if slot is expired
 * @param {object} slot - Slot object
 * @returns {boolean} True if slot is expired
 */
export const isSlotExpired = (slot) => {
  if (!slot) return false;
  const now = new Date();
  const slotEnd = new Date(slot.fin);
  return slotEnd <= now;
};

/**
 * Format slot for API request
 * @param {object} slotData - Slot data
 * @returns {object} Formatted slot for API
 */
export const formatSlotForAPI = (slotData) => {
  return {
    debut: new Date(slotData.debut).toISOString(),
    fin: new Date(slotData.fin).toISOString(),
    type_creneau: slotData.type_creneau || 'VISIT',
    remarques: slotData.remarques || '',
  };
};

/**
 * Calculate available hours for a date
 * @param {Date|string} date - Date to check
 * @param {array} slots - Array of slots
 * @returns {number} Number of available hours
 */
export const getAvailableHours = (date, slots = []) => {
  const dateStr = formatDate(date);
  const dateSlotsStr = formatDate(new Date(date));

  const slotsForDate = slots.filter((s) => formatDate(s.debut) === dateStr);
  const availableSlots = slotsForDate.filter((s) => s.status === 'AVAILABLE');

  const totalMinutes = availableSlots.reduce((sum, slot) => {
    return sum + getSlotDuration(slot);
  }, 0);

  return totalMinutes / 60;
};

/**
 * Create time picker options
 * @param {string} startTime - Start time (HH:MM)
 * @param {string} endTime - End time (HH:MM)
 * @param {number} intervalMinutes - Interval in minutes
 * @returns {array} Array of time option objects
 */
export const createTimePickerOptions = (startTime = '08:00', endTime = '18:00', intervalMinutes = 15) => {
  const options = [];
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  let currentDate = new Date();
  currentDate.setHours(startHour, startMin, 0);

  const endDate = new Date();
  endDate.setHours(endHour, endMin, 0);

  while (currentDate <= endDate) {
    const timeStr = formatTime(currentDate);
    options.push({
      value: timeStr,
      label: timeStr,
    });

    currentDate.setMinutes(currentDate.getMinutes() + intervalMinutes);
  }

  return options;
};
