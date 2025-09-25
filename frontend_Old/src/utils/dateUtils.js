// Utility functions for date handling in the frontend

// Parse an ISO date string to a JS Date object
export function parseDate(dateString) {
  return dateString ? new Date(dateString) : null;
}

// Format a date (JS Date or ISO string) to 'MMM dd, yyyy' (e.g., 'Jan 01, 2024')
export function formatDate(date, format = 'MMM dd, yyyy') {
  if (!date) return 'Not set';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

// Compare if dateA is after dateB
export function isAfter(dateA, dateB) {
  return new Date(dateA) > new Date(dateB);
}

// Compare if dateA is before dateB
export function isBefore(dateA, dateB) {
  return new Date(dateA) < new Date(dateB);
}

// Check if two dates are the same day
export function isSameDay(dateA, dateB) {
  const dA = new Date(dateA);
  const dB = new Date(dateB);
  return dA.getFullYear() === dB.getFullYear() &&
    dA.getMonth() === dB.getMonth() &&
    dA.getDate() === dB.getDate();
} 