// Configurazione API
// In produzione, frontend e backend sono sulla stessa URL, quindi usa URL relativo
// In sviluppo, usa localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api');

// Funzione helper per le chiamate API
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('atelier-auth-token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      // Se il token è scaduto o non valido (401), fai logout automatico
      // Escludi l'endpoint di login perché lì il 401 significa credenziali errate, non token scaduto
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Pulisci il localStorage
        localStorage.removeItem('atelier-auth-token');
        localStorage.removeItem('atelier-auth');
        
        // Reindirizza al login solo se non siamo già nella pagina di login
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
          // Restituisci una Promise che non verrà mai risolta (la pagina viene ricaricata)
          return new Promise(() => {});
        }
        
        const error = await response.json().catch(() => ({ error: 'Sessione scaduta. Effettua nuovamente il login.' }));
        throw new Error(error.error || 'Sessione scaduta. Effettua nuovamente il login.');
      }
      
      const error = await response.json().catch(() => ({ error: 'Errore server' }));
      throw new Error(error.error || `Errore ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    // Se l'errore è già stato gestito (401), rilancialo
    if (error.message.includes('Sessione scaduta')) {
      throw error;
    }
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const login = async (username, password) => {
  const data = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  
  if (data.token) {
    localStorage.setItem('atelier-auth-token', data.token);
    localStorage.setItem('atelier-auth', JSON.stringify(data.user));
  }
  
  return data;
};

export const logout = () => {
  localStorage.removeItem('atelier-auth-token');
  localStorage.removeItem('atelier-auth');
};

// Appointments API
export const getAppointments = () => apiCall('/appointments');
export const createAppointment = (appointment) => apiCall('/appointments', {
  method: 'POST',
  body: JSON.stringify(appointment)
});
export const createAppointmentsBatch = (appointments, recurrenceGroupId) => apiCall('/appointments/batch', {
  method: 'POST',
  body: JSON.stringify({ appointments, recurrenceGroupId })
});
export const updateAppointment = (id, appointment) => apiCall(`/appointments/${id}`, {
  method: 'PUT',
  body: JSON.stringify(appointment)
});
export const deleteAppointment = (id) => apiCall(`/appointments/${id}`, {
  method: 'DELETE'
});

// Employees API
export const getEmployees = () => apiCall('/employees');
export const createEmployee = (employee) => apiCall('/employees', {
  method: 'POST',
  body: JSON.stringify(employee)
});
export const updateEmployee = (id, employee) => apiCall(`/employees/${id}`, {
  method: 'PUT',
  body: JSON.stringify(employee)
});
export const deleteEmployee = (id) => apiCall(`/employees/${id}`, {
  method: 'DELETE'
});

// Utilities API
export const getUtilities = (monthKey) => apiCall(`/utilities/${monthKey}`);
export const saveUtilities = (monthKey, utilities) => apiCall(`/utilities/${monthKey}`, {
  method: 'POST',
  body: JSON.stringify(utilities)
});

// Product Expenses API
export const getProductExpenses = (monthKey) => apiCall(`/product-expenses/${monthKey}`);
export const addProductExpense = (monthKey, productType, price) => apiCall(`/product-expenses/${monthKey}`, {
  method: 'POST',
  body: JSON.stringify({ productType, price })
});
export const deleteProductExpense = (monthKey, expenseId) => apiCall(`/product-expenses/${monthKey}/${expenseId}`, {
  method: 'DELETE'
});
export const getProductExpensesNotes = (monthKey) => apiCall(`/product-expenses/notes/${monthKey}`);
export const saveProductExpensesNotes = (monthKey, notes) => apiCall(`/product-expenses/notes/${monthKey}`, {
  method: 'POST',
  body: JSON.stringify({ notes })
});

// Bar Expenses API
export const getBarExpenses = (monthKey) => apiCall(`/bar-expenses/${monthKey}`);
export const addBarExpense = (monthKey, expenseType, price) => apiCall(`/bar-expenses/${monthKey}`, {
  method: 'POST',
  body: JSON.stringify({ expenseType, price })
});
export const deleteBarExpense = (monthKey, expenseId) => apiCall(`/bar-expenses/${monthKey}/${expenseId}`, {
  method: 'DELETE'
});

// Maintenance API
export const getMaintenance = (monthKey) => apiCall(`/maintenance/${monthKey}`);
export const addMaintenanceExpense = (monthKey, type, price) => apiCall(`/maintenance/${monthKey}`, {
  method: 'POST',
  body: JSON.stringify({ type, price })
});
export const deleteMaintenanceExpense = (monthKey, expenseId) => apiCall(`/maintenance/${monthKey}/${expenseId}`, {
  method: 'DELETE'
});
export const getMaintenanceNotes = (monthKey) => apiCall(`/maintenance/notes/${monthKey}`);
export const saveMaintenanceNotes = (monthKey, type, notes) => apiCall(`/maintenance/notes/${monthKey}`, {
  method: 'POST',
  body: JSON.stringify({ type, notes })
});

