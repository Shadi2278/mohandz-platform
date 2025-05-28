// Admin Dashboard Frontend App for Mohandz Platform
// Main application script that initializes the dashboard

class DashboardApp {
  constructor() {
    this.apiBaseUrl = '/api/admin';
    this.currentUser = null;
    this.currentSection = null;
    this.sections = [
      'dashboard', 'users', 'services', 'orders', 
      'projects', 'content', 'settings', 'reports'
    ];
    
    // Initialize controllers
    this.controllers = {
      auth: new AuthController(this),
      dashboard: new DashboardController(this),
      users: new UsersController(this),
      services: new ServicesController(this),
      orders: new OrdersController(this),
      projects: new ProjectsController(this),
      content: new ContentController(this),
      settings: new SettingsController(this),
      reports: new ReportsController(this)
    };
    
    // Initialize UI components
    this.ui = {
      sidebar: document.getElementById('sidebar'),
      mainContent: document.getElementById('main-content'),
      header: document.getElementById('header'),
      loader: document.getElementById('loader'),
      notifications: new NotificationManager()
    };
    
    // Initialize event listeners
    this.initEventListeners();
    
    // Check authentication
    this.checkAuth();
  }
  
  async checkAuth() {
    try {
      this.showLoader();
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      
      if (!token) {
        this.redirectToLogin();
        return;
      }
      
      // Validate token
      const response = await ApiClient.get(`${this.apiBaseUrl}/auth/validate`);
      
      if (!response.success) {
        this.redirectToLogin();
        return;
      }
      
      // Set current user
      this.currentUser = response.data;
      
      // Initialize dashboard
      this.initDashboard();
      
      this.hideLoader();
    } catch (error) {
      console.error('Authentication error:', error);
      this.redirectToLogin();
    }
  }
  
  redirectToLogin() {
    localStorage.removeItem('token');
    window.location.href = '/admin/login.html';
  }
  
  initDashboard() {
    // Render user info in header
    this.renderUserInfo();
    
    // Render sidebar
    this.renderSidebar();
    
    // Load default section (dashboard)
    this.loadSection('dashboard');
    
    // Show welcome notification
    this.ui.notifications.show('success', `مرحباً ${this.currentUser.name}`, 'تم تسجيل الدخول بنجاح');
  }
  
  renderUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    
    if (userInfoElement && this.currentUser) {
      userInfoElement.innerHTML = `
        <div class="user-avatar">
          <img src="${this.currentUser.avatar || '/admin/dashboard/img/default-avatar.png'}" alt="${this.currentUser.name}">
        </div>
        <div class="user-details">
          <h4>${this.currentUser.name}</h4>
          <span>${this.currentUser.role}</span>
        </div>
      `;
    }
  }
  
  renderSidebar() {
    // Filter sections based on user role
    const allowedSections = this.filterSectionsByRole();
    
    // Generate sidebar HTML
    let sidebarHtml = `
      <div class="sidebar-header">
        <div class="logo">
          <img src="/admin/dashboard/img/logo.png" alt="مهندز">
          <h2>مهندز</h2>
        </div>
      </div>
      <div class="sidebar-menu">
        <ul>
    `;
    
    // Add menu items
    allowedSections.forEach(section => {
      const icon = this.getSectionIcon(section);
      const label = this.getSectionLabel(section);
      
      sidebarHtml += `
        <li data-section="${section}" class="${section === 'dashboard' ? 'active' : ''}">
          <a href="#${section}">
            <i class="${icon}"></i>
            <span>${label}</span>
          </a>
        </li>
      `;
    });
    
    // Add logout
    sidebarHtml += `
        </ul>
      </div>
      <div class="sidebar-footer">
        <button id="logout-btn" class="btn btn-outline-light">
          <i class="fas fa-sign-out-alt"></i>
          <span>تسجيل الخروج</span>
        </button>
      </div>
    `;
    
    // Set sidebar HTML
    this.ui.sidebar.innerHTML = sidebarHtml;
    
    // Add event listeners to sidebar items
    this.ui.sidebar.querySelectorAll('li[data-section]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const section = item.getAttribute('data-section');
        this.loadSection(section);
      });
    });
    
    // Add logout event listener
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.logout();
    });
  }
  
  filterSectionsByRole() {
    // Admin can access all sections
    if (this.currentUser.role === 'admin') {
      return this.sections;
    }
    
    // Editor can access limited sections
    if (this.currentUser.role === 'editor') {
      return ['dashboard', 'services', 'orders', 'projects', 'content'];
    }
    
    // Default (viewer)
    return ['dashboard', 'orders', 'projects'];
  }
  
  getSectionIcon(section) {
    const icons = {
      dashboard: 'fas fa-tachometer-alt',
      users: 'fas fa-users',
      services: 'fas fa-tools',
      orders: 'fas fa-shopping-cart',
      projects: 'fas fa-project-diagram',
      content: 'fas fa-file-alt',
      settings: 'fas fa-cog',
      reports: 'fas fa-chart-bar'
    };
    
    return icons[section] || 'fas fa-circle';
  }
  
  getSectionLabel(section) {
    const labels = {
      dashboard: 'لوحة المعلومات',
      users: 'المستخدمين',
      services: 'الخدمات',
      orders: 'الطلبات',
      projects: 'المشاريع',
      content: 'المحتوى',
      settings: 'الإعدادات',
      reports: 'التقارير'
    };
    
    return labels[section] || section;
  }
  
  loadSection(section) {
    // Skip if already on this section
    if (this.currentSection === section) {
      return;
    }
    
    // Update active sidebar item
    this.ui.sidebar.querySelectorAll('li').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeItem = this.ui.sidebar.querySelector(`li[data-section="${section}"]`);
    if (activeItem) {
      activeItem.classList.add('active');
    }
    
    // Update URL hash
    window.location.hash = section;
    
    // Update current section
    this.currentSection = section;
    
    // Show loader
    this.showLoader();
    
    // Load section content
    if (this.controllers[section]) {
      this.controllers[section].init();
    } else {
      this.ui.mainContent.innerHTML = `<div class="alert alert-danger">القسم غير موجود</div>`;
      this.hideLoader();
    }
  }
  
  logout() {
    // Show confirmation dialog
    ModalManager.confirm(
      'تسجيل الخروج',
      'هل أنت متأكد من رغبتك في تسجيل الخروج؟',
      () => {
        // Clear token
        localStorage.removeItem('token');
        
        // Redirect to login
        window.location.href = '/admin/login.html';
      }
    );
  }
  
  initEventListeners() {
    // Handle hash change
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.substring(1);
      if (hash && this.sections.includes(hash)) {
        this.loadSection(hash);
      }
    });
  }
  
  showLoader() {
    this.ui.loader.style.display = 'flex';
  }
  
  hideLoader() {
    this.ui.loader.style.display = 'none';
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DashboardApp();
});
