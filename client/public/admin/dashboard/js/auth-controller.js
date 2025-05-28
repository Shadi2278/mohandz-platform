// Authentication Controller for Mohandz Admin Dashboard
// Handles user login, logout, and authentication

class AuthController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
  }
  
  async login(email, password) {
    try {
      // Show loader
      this.app.showLoader();
      
      // Send login request
      const response = await ApiClient.post(`${this.apiBaseUrl}/auth/login`, {
        email,
        password
      });
      
      // Hide loader
      this.app.hideLoader();
      
      if (!response.success) {
        return {
          success: false,
          message: response.message || 'فشل تسجيل الدخول'
        };
      }
      
      // Save token to local storage
      localStorage.setItem('token', response.data.token);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Login error:', error);
      this.app.hideLoader();
      
      return {
        success: false,
        message: 'خطأ في الاتصال بالخادم'
      };
    }
  }
  
  async validateLoginForm(email, password) {
    // Validate email
    if (!email || !email.trim()) {
      return {
        valid: false,
        message: 'البريد الإلكتروني مطلوب'
      };
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: 'البريد الإلكتروني غير صالح'
      };
    }
    
    // Validate password
    if (!password || !password.trim()) {
      return {
        valid: false,
        message: 'كلمة المرور مطلوبة'
      };
    }
    
    return {
      valid: true
    };
  }
  
  async validateToken() {
    try {
      // Get token from local storage
      const token = localStorage.getItem('token');
      
      if (!token) {
        return {
          valid: false,
          message: 'لم يتم تسجيل الدخول'
        };
      }
      
      // Validate token
      const response = await ApiClient.get(`${this.apiBaseUrl}/auth/validate`);
      
      if (!response.success) {
        return {
          valid: false,
          message: response.message || 'جلسة غير صالحة'
        };
      }
      
      return {
        valid: true,
        user: response.data
      };
    } catch (error) {
      console.error('Token validation error:', error);
      
      return {
        valid: false,
        message: 'خطأ في التحقق من الجلسة'
      };
    }
  }
  
  logout() {
    // Clear token
    localStorage.removeItem('token');
    
    // Redirect to login page
    window.location.href = '/admin/login.html';
  }
  
  // Initialize login page
  initLoginPage() {
    // Get form elements
    const loginForm = document.getElementById('login-form');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const submitButton = document.getElementById('login-button');
    const errorMessage = document.getElementById('error-message');
    
    // Check if already logged in
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token
      this.validateToken().then(result => {
        if (result.valid) {
          // Redirect to dashboard
          window.location.href = '/admin/dashboard/';
        }
      });
    }
    
    // Add form submit event listener
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear error message
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
        
        // Get form values
        const email = emailInput.value;
        const password = passwordInput.value;
        
        // Validate form
        const validation = await this.validateLoginForm(email, password);
        
        if (!validation.valid) {
          errorMessage.textContent = validation.message;
          errorMessage.style.display = 'block';
          return;
        }
        
        // Disable submit button
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
        
        // Login
        const result = await this.login(email, password);
        
        // Enable submit button
        submitButton.disabled = false;
        submitButton.innerHTML = 'تسجيل الدخول';
        
        if (!result.success) {
          errorMessage.textContent = result.message;
          errorMessage.style.display = 'block';
          return;
        }
        
        // Redirect to dashboard
        window.location.href = '/admin/dashboard/';
      });
    }
  }
}
