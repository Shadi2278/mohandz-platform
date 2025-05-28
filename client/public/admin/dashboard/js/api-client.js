// API Client for Mohandz Platform
const baseURL = 'https://mohandz-backend.onrender.com'; // عنوان الواجهة الخلفية على Render

// Create a base API client instance
const apiClient = {
  async fetchWithAuth(endpoint, options = {} ) {
    const url = `${baseURL}${endpoint}`;
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // Set up headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Merge options
    const fetchOptions = {
      ...options,
      headers,
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      
      // Handle unauthorized (token expired or invalid)
      if (response.status === 401) {
        // Clear token and redirect to login
        localStorage.removeItem('token');
        window.location.href = '/admin/login.html';
        return null;
      }
      
      // Parse JSON response
      const data = await response.json();
      
      // If response is not ok, throw error with message from server
      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في الاتصال بالخادم');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  async get(endpoint) {
    return this.fetchWithAuth(endpoint);
  },
  
  async post(endpoint, data) {
    return this.fetchWithAuth(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  async put(endpoint, data) {
    return this.fetchWithAuth(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  async delete(endpoint) {
    return this.fetchWithAuth(endpoint, {
      method: 'DELETE',
    });
  },
  
  // Authentication methods
  async login(email, password) {
    return this.post('/api/auth/login', { email, password });
  },
  
  async register(userData) {
    return this.post('/api/auth/register', userData);
  },
  
  async checkAuth() {
    return this.get('/api/auth/me');
  },
  
  // Users methods
  async getUsers() {
    return this.get('/api/users');
  },
  
  async getUser(id) {
    return this.get(`/api/users/${id}`);
  },
  
  async createUser(userData) {
    return this.post('/api/users', userData);
  },
  
  async updateUser(id, userData) {
    return this.put(`/api/users/${id}`, userData);
  },
  
  async deleteUser(id) {
    return this.delete(`/api/users/${id}`);
  },
  
  // Services methods
  async getServices() {
    return this.get('/api/services');
  },
  
  async getService(id) {
    return this.get(`/api/services/${id}`);
  },
  
  async createService(serviceData) {
    return this.post('/api/services', serviceData);
  },
  
  async updateService(id, serviceData) {
    return this.put(`/api/services/${id}`, serviceData);
  },
  
  async deleteService(id) {
    return this.delete(`/api/services/${id}`);
  },
  
  // Orders methods
  async getOrders() {
    return this.get('/api/orders');
  },
  
  async getOrder(id) {
    return this.get(`/api/orders/${id}`);
  },
  
  async updateOrder(id, orderData) {
    return this.put(`/api/orders/${id}`, orderData);
  },
  
  async deleteOrder(id) {
    return this.delete(`/api/orders/${id}`);
  },
  
  // Projects methods
  async getProjects() {
    return this.get('/api/projects');
  },
  
  async getProject(id) {
    return this.get(`/api/projects/${id}`);
  },
  
  async createProject(projectData) {
    return this.post('/api/projects', projectData);
  },
  
  async updateProject(id, projectData) {
    return this.put(`/api/projects/${id}`, projectData);
  },
  
  async deleteProject(id) {
    return this.delete(`/api/projects/${id}`);
  },
  
  // Content methods
  async getContent(type) {
    return this.get(`/api/content/${type}`);
  },
  
  async updateContent(type, contentData) {
    return this.put(`/api/content/${type}`, contentData);
  },
  
  // Settings methods
  async getSettings() {
    return this.get('/api/settings');
  },
  
  async updateSettings(settingsData) {
    return this.put('/api/settings', settingsData);
  },
  
  // Reports methods
  async getReports(type, period) {
    return this.get(`/api/reports/${type}?period=${period}`);
  }
};
