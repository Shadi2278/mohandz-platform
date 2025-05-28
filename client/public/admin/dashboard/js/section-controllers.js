// Section Controllers for Mohandz Admin Dashboard

// Users Section Controller
class UsersSectionController {
  constructor() {
    this.tableId = 'usersTable';
    this.init();
  }

  init() {
    // Initialize data table
    this.dataTable = new DataTableComponent(this.tableId, {
      selectable: true,
      searchable: true,
      pagination: true,
      actions: true
    });

    // Override data table methods
    this.dataTable.refresh = this.loadUsers.bind(this);
    this.dataTable.onAdd = this.addUser.bind(this);
    this.dataTable.onEdit = this.editUser.bind(this);
    this.dataTable.onDelete = this.deleteUser.bind(this);

    // Load initial data
    this.loadUsers();
  }

  async loadUsers() {
    try {
      const result = await api.getUsers();
      if (result.success) {
        this.dataTable.setData(result.data);
        notification.show('تم تحميل بيانات المستخدمين بنجاح', 'success');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      notification.show('فشل تحميل بيانات المستخدمين', 'error');
    }
  }

  addUser() {
    userModal.show();
  }

  editUser(id) {
    userModal.show(id);
  }

  async deleteUser(id) {
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      try {
        const result = await api.deleteUser(id);
        if (result.success) {
          notification.show('تم حذف المستخدم بنجاح', 'success');
          this.loadUsers();
        }
      } catch (error) {
        console.error('Failed to delete user:', error);
        notification.show('فشل حذف المستخدم', 'error');
      }
    }
  }
}

// Services Section Controller
class ServicesSectionController {
  constructor() {
    this.tableId = 'servicesTable';
    this.init();
  }

  init() {
    // Initialize data table
    this.dataTable = new DataTableComponent(this.tableId, {
      selectable: true,
      searchable: true,
      pagination: true,
      actions: true
    });

    // Override data table methods
    this.dataTable.refresh = this.loadServices.bind(this);
    this.dataTable.onAdd = this.addService.bind(this);
    this.dataTable.onEdit = this.editService.bind(this);
    this.dataTable.onDelete = this.deleteService.bind(this);

    // Load initial data
    this.loadServices();
  }

  async loadServices() {
    try {
      const result = await api.getServices();
      if (result.success) {
        this.dataTable.setData(result.data);
        notification.show('تم تحميل بيانات الخدمات بنجاح', 'success');
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      notification.show('فشل تحميل بيانات الخدمات', 'error');
    }
  }

  addService() {
    serviceModal.show();
  }

  editService(id) {
    serviceModal.show(id);
  }

  async deleteService(id) {
    if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      try {
        const result = await api.deleteService(id);
        if (result.success) {
          notification.show('تم حذف الخدمة بنجاح', 'success');
          this.loadServices();
        }
      } catch (error) {
        console.error('Failed to delete service:', error);
        notification.show('فشل حذف الخدمة', 'error');
      }
    }
  }
}

// Orders Section Controller
class OrdersSectionController {
  constructor() {
    this.tableId = 'ordersTable';
    this.init();
  }

  init() {
    // Initialize data table
    this.dataTable = new DataTableComponent(this.tableId, {
      selectable: false,
      searchable: true,
      pagination: true,
      actions: true
    });

    // Override data table methods
    this.dataTable.refresh = this.loadOrders.bind(this);
    this.dataTable.onEdit = this.viewOrder.bind(this);
    this.dataTable.onDelete = this.deleteOrder.bind(this);

    // Load initial data
    this.loadOrders();
  }

  async loadOrders() {
    try {
      const result = await api.getOrders();
      if (result.success) {
        this.dataTable.setData(result.data);
        notification.show('تم تحميل بيانات الطلبات بنجاح', 'success');
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      notification.show('فشل تحميل بيانات الطلبات', 'error');
    }
  }

  viewOrder(id) {
    orderModal.show(id);
  }

  async deleteOrder(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
      try {
        const result = await api.deleteOrder(id);
        if (result.success) {
          notification.show('تم حذف الطلب بنجاح', 'success');
          this.loadOrders();
        }
      } catch (error) {
        console.error('Failed to delete order:', error);
        notification.show('فشل حذف الطلب', 'error');
      }
    }
  }
}

// Projects Section Controller
class ProjectsSectionController {
  constructor() {
    this.tableId = 'projectsTable';
    this.init();
  }

  init() {
    // Initialize data table
    this.dataTable = new DataTableComponent(this.tableId, {
      selectable: true,
      searchable: true,
      pagination: true,
      actions: true
    });

    // Override data table methods
    this.dataTable.refresh = this.loadProjects.bind(this);
    this.dataTable.onAdd = this.addProject.bind(this);
    this.dataTable.onEdit = this.editProject.bind(this);
    this.dataTable.onDelete = this.deleteProject.bind(this);

    // Load initial data
    this.loadProjects();
  }

  async loadProjects() {
    try {
      const result = await api.getProjects();
      if (result.success) {
        this.dataTable.setData(result.data);
        notification.show('تم تحميل بيانات المشاريع بنجاح', 'success');
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      notification.show('فشل تحميل بيانات المشاريع', 'error');
    }
  }

  addProject() {
    // Project modal would be implemented similar to other modals
    notification.show('ميزة إضافة مشروع قيد التطوير', 'info');
  }

  editProject(id) {
    // Project modal would be implemented similar to other modals
    notification.show('ميزة تعديل المشروع قيد التطوير', 'info');
  }

  async deleteProject(id) {
    if (confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
      try {
        const result = await api.deleteProject(id);
        if (result.success) {
          notification.show('تم حذف المشروع بنجاح', 'success');
          this.loadProjects();
        }
      } catch (error) {
        console.error('Failed to delete project:', error);
        notification.show('فشل حذف المشروع', 'error');
      }
    }
  }
}

// Content Section Controller
class ContentSectionController {
  constructor() {
    this.tableId = 'contentTable';
    this.init();
  }

  init() {
    // Initialize data table
    this.dataTable = new DataTableComponent(this.tableId, {
      selectable: true,
      searchable: true,
      pagination: true,
      actions: true
    });

    // Override data table methods
    this.dataTable.refresh = this.loadContent.bind(this);
    this.dataTable.onAdd = this.addContent.bind(this);
    this.dataTable.onEdit = this.editContent.bind(this);
    this.dataTable.onDelete = this.deleteContent.bind(this);

    // Load initial data
    this.loadContent();
  }

  async loadContent() {
    try {
      const result = await api.getContent();
      if (result.success) {
        this.dataTable.setData(result.data);
        notification.show('تم تحميل بيانات المحتوى بنجاح', 'success');
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      notification.show('فشل تحميل بيانات المحتوى', 'error');
    }
  }

  addContent() {
    // Content modal would be implemented similar to other modals
    notification.show('ميزة إضافة محتوى قيد التطوير', 'info');
  }

  editContent(id) {
    // Content modal would be implemented similar to other modals
    notification.show('ميزة تعديل المحتوى قيد التطوير', 'info');
  }

  async deleteContent(id) {
    if (confirm('هل أنت متأكد من حذف هذا المحتوى؟')) {
      try {
        const result = await api.deleteContent(id);
        if (result.success) {
          notification.show('تم حذف المحتوى بنجاح', 'success');
          this.loadContent();
        }
      } catch (error) {
        console.error('Failed to delete content:', error);
        notification.show('فشل حذف المحتوى', 'error');
      }
    }
  }
}

// Settings Section Controller
class SettingsSectionController {
  constructor() {
    this.tableId = 'settingsTable';
    this.init();
  }

  init() {
    // Initialize data table
    this.dataTable = new DataTableComponent(this.tableId, {
      selectable: false,
      searchable: true,
      pagination: true,
      actions: true
    });

    // Override data table methods
    this.dataTable.refresh = this.loadSettings.bind(this);
    this.dataTable.onAdd = this.addSetting.bind(this);
    this.dataTable.onEdit = this.editSetting.bind(this);
    this.dataTable.onDelete = this.deleteSetting.bind(this);

    // Load initial data
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const result = await api.getSettings();
      if (result.success) {
        this.dataTable.setData(result.data);
        notification.show('تم تحميل الإعدادات بنجاح', 'success');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      notification.show('فشل تحميل الإعدادات', 'error');
    }
  }

  addSetting() {
    // Setting modal would be implemented similar to other modals
    notification.show('ميزة إضافة إعداد قيد التطوير', 'info');
  }

  editSetting(id) {
    // Setting modal would be implemented similar to other modals
    notification.show('ميزة تعديل الإعداد قيد التطوير', 'info');
  }

  async deleteSetting(id) {
    if (confirm('هل أنت متأكد من حذف هذا الإعداد؟')) {
      try {
        const result = await api.deleteSetting(id);
        if (result.success) {
          notification.show('تم حذف الإعداد بنجاح', 'success');
          this.loadSettings();
        }
      } catch (error) {
        console.error('Failed to delete setting:', error);
        notification.show('فشل حذف الإعداد', 'error');
      }
    }
  }
}

// Reports Section Controller
class ReportsSectionController {
  constructor() {
    this.init();
  }

  init() {
    // Set up event listeners for report types
    const reportTypeSelect = document.getElementById('reportType');
    if (reportTypeSelect) {
      reportTypeSelect.addEventListener('change', () => {
        this.loadReportData(reportTypeSelect.value);
      });
    }

    // Set up date range filters
    const dateRangeForm = document.getElementById('dateRangeForm');
    if (dateRangeForm) {
      dateRangeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const reportType = reportTypeSelect.value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        this.loadReportData(reportType, { startDate, endDate });
      });
    }

    // Load initial dashboard stats
    this.loadDashboardStats();
  }

  async loadDashboardStats() {
    try {
      const result = await api.getDashboardStats();
      if (result.success) {
        this.updateDashboardStats(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
      notification.show('فشل تحميل إحصائيات لوحة المعلومات', 'error');
    }
  }

  updateDashboardStats(data) {
    // Update stats cards
    const statsCards = document.querySelectorAll('.stats-card');
    if (statsCards.length >= 4) {
      statsCards[0].querySelector('h3').textContent = data.userCount || 0;
      statsCards[1].querySelector('h3').textContent = data.orderCount || 0;
      statsCards[2].querySelector('h3').textContent = data.projectCount || 0;
      statsCards[3].querySelector('h3').textContent = `${(data.revenue || 0).toLocaleString()} ر.س`;
    }

    // Update charts if available
    this.updateCharts(data);
  }

  updateCharts(data) {
    // Implementation would depend on the specific charts used
    // This is a placeholder
  }

  async loadReportData(reportType, params = {}) {
    try {
      let result;
      
      switch (reportType) {
        case 'orders':
          result = await api.getOrdersReport(params);
          break;
        case 'users':
          result = await api.getUsersReport();
          break;
        case 'projects':
          result = await api.getProjectsReport(params);
          break;
        default:
          notification.show('نوع التقرير غير معروف', 'error');
          return;
      }
      
      if (result.success) {
        this.displayReportData(reportType, result.data);
        notification.show('تم تحميل بيانات التقرير بنجاح', 'success');
      }
    } catch (error) {
      console.error('Failed to load report data:', error);
      notification.show('فشل تحميل بيانات التقرير', 'error');
    }
  }

  displayReportData(reportType, data) {
    // Implementation would depend on the specific report type
    // This is a placeholder
    console.log(`Displaying ${reportType} report data:`, data);
  }
}

// Initialize section controllers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // These will be initialized by the main dashboard controller
});
