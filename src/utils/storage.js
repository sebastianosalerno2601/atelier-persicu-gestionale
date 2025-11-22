// Utility functions for localStorage management

export const getEmployees = () => {
  const employees = localStorage.getItem('atelier-employees');
  return employees ? JSON.parse(employees) : [];
};

export const saveEmployees = (employees) => {
  localStorage.setItem('atelier-employees', JSON.stringify(employees));
};

export const getAppointments = () => {
  const appointments = localStorage.getItem('atelier-appointments');
  return appointments ? JSON.parse(appointments) : [];
};

export const saveAppointments = (appointments) => {
  localStorage.setItem('atelier-appointments', JSON.stringify(appointments));
};

export const getUsers = () => {
  const users = localStorage.getItem('atelier-users');
  return users ? JSON.parse(users) : {};
};

export const saveUsers = (users) => {
  localStorage.setItem('atelier-users', JSON.stringify(users));
};

// Helper per calcolare durata in minuti
export const getDurationMinutes = (serviceType) => {
  const durations = {
    'Taglio': 45,
    'Taglio e barba': 60,
    'Taglio, barba e colore': 60,
    'Barba': 25,
    'Taglio baby': 60,
    'Rasatura': 60,
    'Pausa': 60
  };
  return durations[serviceType] || 30;
};

// Helper per calcolare prezzo
export const getPrice = (serviceType) => {
  const prices = {
    'Taglio': 15,
    'Taglio e barba': 20,
    'Taglio, barba e colore': 0, // Da aggiornare
    'Barba': 8,
    'Taglio baby': 13,
    'Rasatura': 10,
    'Pausa': 0
  };
  return prices[serviceType] || 0;
};

// Helper per aggiungere minuti a un orario
export const addMinutes = (timeString, minutes) => {
  const [hours, mins] = timeString.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
};

// Helper per generare ID univoco
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Helper per aggiungere giorni a una data
export const addDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

// Helper per generare date ricorrenti settimanali per 1 anno
export const generateWeeklyRecurrences = (startDate, weeks = 52) => {
  const dates = [];
  for (let i = 0; i < weeks; i++) {
    dates.push(addDays(startDate, i * 7));
  }
  return dates;
};


