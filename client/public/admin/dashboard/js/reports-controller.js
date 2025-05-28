// Reports Controller for Mohandz Admin Dashboard
// Handles reports and analytics functionality

class ReportsController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
    this.mainContent = app.ui.mainContent;
    this.currentUser = app.currentUser;
    this.currentReport = 'overview';
    this.reportTypes = {
      overview: { title: 'نظرة عامة', icon: 'chart-line' },
      orders: { title: 'تقارير الطلبات', icon: 'shopping-cart' },
      revenue: { title: 'تقارير الإيرادات', icon: 'money-bill-wave' },
      services: { title: 'تقارير الخدمات', icon: 'tools' },
      users: { title: 'تقارير المستخدمين', icon: 'users' },
      projects: { title: 'تقارير المشاريع', icon: 'project-diagram' }
    };
    this.charts = {};
  }
  
  async init() {
    try {
      // Render reports template
      this.renderReportsTemplate();
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Load report data for default report
      await this.loadReport(this.currentReport);
      
      // Hide loader
      this.app.hideLoader();
    } catch (error) {
      console.error('Reports initialization error:', error);
      this.mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل التقارير
        </div>
      `;
      this.app.hideLoader();
    }
  }
  
  renderReportsTemplate() {
    this.mainContent.innerHTML = `
      <div class="reports-container">
        <div class="page-header">
          <div>
            <h1><i class="fas fa-chart-bar"></i> التقارير والإحصائيات</h1>
            <p>تحليل أداء المنصة وعرض البيانات الإحصائية</p>
          </div>
          <div class="page-actions">
            <div class="btn-group">
              <button id="export-report-btn" class="btn btn-outline-primary">
                <i class="fas fa-file-export"></i> تصدير
              </button>
              <button id="print-report-btn" class="btn btn-outline-primary">
                <i class="fas fa-print"></i> طباعة
              </button>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-3">
            <div class="card">
              <div class="card-header">
                <h5>أنواع التقارير</h5>
              </div>
              <div class="card-body p-0">
                <div class="reports-nav">
                  <ul class="nav flex-column">
                    ${Object.entries(this.reportTypes).map(([key, value]) => `
                      <li class="nav-item">
                        <a class="nav-link ${key === this.currentReport ? 'active' : ''}" href="#" data-report="${key}">
                          <i class="fas fa-${value.icon}"></i> ${value.title}
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              </div>
            </div>
            
            <div class="card mt-3">
              <div class="card-header">
                <h5>تصفية التقارير</h5>
              </div>
              <div class="card-body">
                <form id="report-filters-form">
                  <div class="form-group">
                    <label for="date-range">النطاق الزمني</label>
                    <select id="date-range" name="dateRange" class="form-control">
                      <option value="today">اليوم</option>
                      <option value="yesterday">الأمس</option>
                      <option value="last7days">آخر 7 أيام</option>
                      <option value="last30days" selected>آخر 30 يوم</option>
                      <option value="thisMonth">هذا الشهر</option>
                      <option value="lastMonth">الشهر الماضي</option>
                      <option value="thisYear">هذه السنة</option>
                      <option value="lastYear">السنة الماضية</option>
                      <option value="custom">مخصص</option>
                    </select>
                  </div>
                  
                  <div id="custom-date-range" style="display: none;">
                    <div class="form-group">
                      <label for="start-date">تاريخ البداية</label>
                      <input type="date" id="start-date" name="startDate" class="form-control">
                    </div>
                    <div class="form-group">
                      <label for="end-date">تاريخ النهاية</label>
                      <input type="date" id="end-date" name="endDate" class="form-control">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="comparison">المقارنة</label>
                    <select id="comparison" name="comparison" class="form-control">
                      <option value="none">بدون مقارنة</option>
                      <option value="previousPeriod">الفترة السابقة</option>
                      <option value="previousYear">نفس الفترة من السنة الماضية</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <button type="submit" class="btn btn-primary btn-block">
                      <i class="fas fa-filter"></i> تطبيق التصفية
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          
          <div class="col-md-9">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 id="report-title">${this.reportTypes[this.currentReport].title}</h5>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-secondary active" data-view="chart">
                    <i class="fas fa-chart-bar"></i> رسم بياني
                  </button>
                  <button class="btn btn-outline-secondary" data-view="table">
                    <i class="fas fa-table"></i> جدول
                  </button>
                </div>
              </div>
              <div class="card-body">
                <div id="report-container">
                  <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="sr-only">جاري التحميل...</span>
                    </div>
                    <p class="mt-2">جاري تحميل البيانات...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  initEventListeners() {
    // Report type navigation
    document.querySelectorAll('.reports-nav .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const report = e.currentTarget.getAttribute('data-report');
        this.changeReport(report);
      });
    });
    
    // Date range change
    document.getElementById('date-range').addEventListener('change', (e) => {
      const customDateRange = document.getElementById('custom-date-range');
      if (e.target.value === 'custom') {
        customDateRange.style.display = 'block';
      } else {
        customDateRange.style.display = 'none';
      }
    });
    
    // Report filters form submit
    document.getElementById('report-filters-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.applyFilters();
    });
    
    // View toggle (chart/table)
    document.querySelectorAll('.btn-group[data-view] .btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.getAttribute('data-view');
        this.toggleView(view);
        
        // Update active button
        document.querySelectorAll('.btn-group[data-view] .btn').forEach(b => {
          b.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
      });
    });
    
    // Export report button
    document.getElementById('export-report-btn').addEventListener('click', () => {
      this.exportReport();
    });
    
    // Print report button
    document.getElementById('print-report-btn').addEventListener('click', () => {
      this.printReport();
    });
  }
  
  async changeReport(report) {
    if (report === this.currentReport) return;
    
    // Update current report
    this.currentReport = report;
    
    // Update UI
    document.querySelectorAll('.reports-nav .nav-link').forEach(link => {
      if (link.getAttribute('data-report') === report) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Update report title
    document.getElementById('report-title').textContent = this.reportTypes[report].title;
    
    // Show loader
    document.getElementById('report-container').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">جاري التحميل...</span>
        </div>
        <p class="mt-2">جاري تحميل البيانات...</p>
      </div>
    `;
    
    // Load report data
    await this.loadReport(report);
  }
  
  async loadReport(report) {
    try {
      // Get filter values
      const filters = this.getFilters();
      
      // Fetch report data
      const response = await ApiClient.get(`${this.apiBaseUrl}/reports/${report}`, filters);
      
      if (!response.success) {
        throw new Error(response.message || `فشل تحميل ${this.reportTypes[report].title}`);
      }
      
      // Render report based on type
      this.renderReport(report, response.data);
    } catch (error) {
      console.error(`Load ${report} report error:`, error);
      document.getElementById('report-container').innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل ${this.reportTypes[report].title}
        </div>
      `;
    }
  }
  
  getFilters() {
    const dateRange = document.getElementById('date-range').value;
    const comparison = document.getElementById('comparison').value;
    
    const filters = {
      dateRange,
      comparison
    };
    
    if (dateRange === 'custom') {
      filters.startDate = document.getElementById('start-date').value;
      filters.endDate = document.getElementById('end-date').value;
    }
    
    return filters;
  }
  
  async applyFilters() {
    // Show loader
    document.getElementById('report-container').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">جاري التحميل...</span>
        </div>
        <p class="mt-2">جاري تحميل البيانات...</p>
      </div>
    `;
    
    // Load report with new filters
    await this.loadReport(this.currentReport);
  }
  
  renderReport(report, data) {
    // Clear previous charts
    this.charts = {};
    
    // Render report based on type
    switch (report) {
      case 'overview':
        this.renderOverviewReport(data);
        break;
      case 'orders':
        this.renderOrdersReport(data);
        break;
      case 'revenue':
        this.renderRevenueReport(data);
        break;
      case 'services':
        this.renderServicesReport(data);
        break;
      case 'users':
        this.renderUsersReport(data);
        break;
      case 'projects':
        this.renderProjectsReport(data);
        break;
      default:
        document.getElementById('report-container').innerHTML = `
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            نوع تقرير غير معروف
          </div>
        `;
    }
  }
  
  renderOverviewReport(data) {
    const container = document.getElementById('report-container');
    
    // Prepare summary cards
    const summaryCards = `
      <div class="row">
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-primary">
                <i class="fas fa-shopping-cart"></i>
              </div>
              <div class="summary-details">
                <h3>${data.totalOrders}</h3>
                <p>إجمالي الطلبات</p>
                ${this.renderComparisonBadge(data.ordersComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-success">
                <i class="fas fa-money-bill-wave"></i>
              </div>
              <div class="summary-details">
                <h3>${this.formatCurrency(data.totalRevenue)}</h3>
                <p>إجمالي الإيرادات</p>
                ${this.renderComparisonBadge(data.revenueComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-info">
                <i class="fas fa-users"></i>
              </div>
              <div class="summary-details">
                <h3>${data.totalUsers}</h3>
                <p>إجمالي المستخدمين</p>
                ${this.renderComparisonBadge(data.usersComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-warning">
                <i class="fas fa-project-diagram"></i>
              </div>
              <div class="summary-details">
                <h3>${data.totalProjects}</h3>
                <p>إجمالي المشاريع</p>
                ${this.renderComparisonBadge(data.projectsComparison)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Prepare charts
    const chartsHTML = `
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>الطلبات والإيرادات</h5>
            </div>
            <div class="card-body">
              <canvas id="orders-revenue-chart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>توزيع الخدمات</h5>
            </div>
            <div class="card-body">
              <canvas id="services-distribution-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>اتجاهات الطلبات والإيرادات</h5>
            </div>
            <div class="card-body">
              <canvas id="trends-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Render HTML
    container.innerHTML = `
      <div class="overview-report">
        ${summaryCards}
        ${chartsHTML}
      </div>
    `;
    
    // Initialize charts
    this.initOrdersRevenueChart(data.ordersRevenueChart);
    this.initServicesDistributionChart(data.servicesDistribution);
    this.initTrendsChart(data.trends);
  }
  
  renderOrdersReport(data) {
    const container = document.getElementById('report-container');
    
    // Prepare summary cards
    const summaryCards = `
      <div class="row">
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-primary">
                <i class="fas fa-shopping-cart"></i>
              </div>
              <div class="summary-details">
                <h3>${data.totalOrders}</h3>
                <p>إجمالي الطلبات</p>
                ${this.renderComparisonBadge(data.totalOrdersComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-success">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="summary-details">
                <h3>${data.completedOrders}</h3>
                <p>الطلبات المكتملة</p>
                ${this.renderComparisonBadge(data.completedOrdersComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-warning">
                <i class="fas fa-clock"></i>
              </div>
              <div class="summary-details">
                <h3>${data.pendingOrders}</h3>
                <p>الطلبات قيد الانتظار</p>
                ${this.renderComparisonBadge(data.pendingOrdersComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-danger">
                <i class="fas fa-times-circle"></i>
              </div>
              <div class="summary-details">
                <h3>${data.cancelledOrders}</h3>
                <p>الطلبات الملغاة</p>
                ${this.renderComparisonBadge(data.cancelledOrdersComparison)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Prepare charts
    const chartsHTML = `
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>حالة الطلبات</h5>
            </div>
            <div class="card-body">
              <canvas id="orders-status-chart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>الطلبات حسب الخدمة</h5>
            </div>
            <div class="card-body">
              <canvas id="orders-by-service-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>اتجاهات الطلبات</h5>
            </div>
            <div class="card-body">
              <canvas id="orders-trends-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>أحدث الطلبات</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>رقم الطلب</th>
                      <th>العميل</th>
                      <th>الخدمة</th>
                      <th>التاريخ</th>
                      <th>المبلغ</th>
                      <th>الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.recentOrders.map(order => `
                      <tr>
                        <td>#${order.id}</td>
                        <td>${order.customer}</td>
                        <td>${order.service}</td>
                        <td>${this.formatDate(order.date)}</td>
                        <td>${this.formatCurrency(order.amount)}</td>
                        <td>${this.renderStatusBadge(order.status)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Render HTML
    container.innerHTML = `
      <div class="orders-report">
        ${summaryCards}
        ${chartsHTML}
      </div>
    `;
    
    // Initialize charts
    this.initOrdersStatusChart(data.ordersStatus);
    this.initOrdersByServiceChart(data.ordersByService);
    this.initOrdersTrendsChart(data.ordersTrends);
  }
  
  renderRevenueReport(data) {
    const container = document.getElementById('report-container');
    
    // Prepare summary cards
    const summaryCards = `
      <div class="row">
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-success">
                <i class="fas fa-money-bill-wave"></i>
              </div>
              <div class="summary-details">
                <h3>${this.formatCurrency(data.totalRevenue)}</h3>
                <p>إجمالي الإيرادات</p>
                ${this.renderComparisonBadge(data.totalRevenueComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-info">
                <i class="fas fa-chart-line"></i>
              </div>
              <div class="summary-details">
                <h3>${this.formatCurrency(data.averageOrderValue)}</h3>
                <p>متوسط قيمة الطلب</p>
                ${this.renderComparisonBadge(data.averageOrderValueComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-warning">
                <i class="fas fa-hand-holding-usd"></i>
              </div>
              <div class="summary-details">
                <h3>${this.formatCurrency(data.pendingRevenue)}</h3>
                <p>الإيرادات المعلقة</p>
                ${this.renderComparisonBadge(data.pendingRevenueComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-primary">
                <i class="fas fa-percentage"></i>
              </div>
              <div class="summary-details">
                <h3>${data.conversionRate}%</h3>
                <p>معدل التحويل</p>
                ${this.renderComparisonBadge(data.conversionRateComparison)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Prepare charts
    const chartsHTML = `
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>الإيرادات حسب الخدمة</h5>
            </div>
            <div class="card-body">
              <canvas id="revenue-by-service-chart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>الإيرادات حسب طريقة الدفع</h5>
            </div>
            <div class="card-body">
              <canvas id="revenue-by-payment-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>اتجاهات الإيرادات</h5>
            </div>
            <div class="card-body">
              <canvas id="revenue-trends-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>أعلى الخدمات إيراداً</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>الخدمة</th>
                      <th>عدد الطلبات</th>
                      <th>إجمالي الإيرادات</th>
                      <th>متوسط قيمة الطلب</th>
                      <th>نسبة من الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.topServices.map(service => `
                      <tr>
                        <td>${service.name}</td>
                        <td>${service.ordersCount}</td>
                        <td>${this.formatCurrency(service.revenue)}</td>
                        <td>${this.formatCurrency(service.averageOrderValue)}</td>
                        <td>
                          <div class="progress">
                            <div class="progress-bar" role="progressbar" style="width: ${service.percentage}%;" aria-valuenow="${service.percentage}" aria-valuemin="0" aria-valuemax="100">${service.percentage}%</div>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Render HTML
    container.innerHTML = `
      <div class="revenue-report">
        ${summaryCards}
        ${chartsHTML}
      </div>
    `;
    
    // Initialize charts
    this.initRevenueByServiceChart(data.revenueByService);
    this.initRevenueByPaymentChart(data.revenueByPayment);
    this.initRevenueTrendsChart(data.revenueTrends);
  }
  
  renderServicesReport(data) {
    const container = document.getElementById('report-container');
    
    // Prepare summary cards
    const summaryCards = `
      <div class="row">
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-primary">
                <i class="fas fa-tools"></i>
              </div>
              <div class="summary-details">
                <h3>${data.totalServices}</h3>
                <p>إجمالي الخدمات</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-success">
                <i class="fas fa-star"></i>
              </div>
              <div class="summary-details">
                <h3>${data.mostPopularService}</h3>
                <p>الخدمة الأكثر طلباً</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-info">
                <i class="fas fa-money-bill-wave"></i>
              </div>
              <div class="summary-details">
                <h3>${data.highestRevenueService}</h3>
                <p>الخدمة الأعلى إيراداً</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-warning">
                <i class="fas fa-percentage"></i>
              </div>
              <div class="summary-details">
                <h3>${data.averageRating}</h3>
                <p>متوسط التقييم</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Prepare charts
    const chartsHTML = `
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>توزيع الطلبات حسب الخدمة</h5>
            </div>
            <div class="card-body">
              <canvas id="services-orders-chart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>توزيع الإيرادات حسب الخدمة</h5>
            </div>
            <div class="card-body">
              <canvas id="services-revenue-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>تقييمات الخدمات</h5>
            </div>
            <div class="card-body">
              <canvas id="services-ratings-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>أداء الخدمات</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>الخدمة</th>
                      <th>عدد الطلبات</th>
                      <th>الإيرادات</th>
                      <th>متوسط التقييم</th>
                      <th>معدل التحويل</th>
                      <th>الأداء</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.servicesPerformance.map(service => `
                      <tr>
                        <td>${service.name}</td>
                        <td>${service.ordersCount}</td>
                        <td>${this.formatCurrency(service.revenue)}</td>
                        <td>
                          <div class="rating">
                            ${this.renderStarRating(service.rating)}
                          </div>
                        </td>
                        <td>${service.conversionRate}%</td>
                        <td>
                          <div class="progress">
                            <div class="progress-bar bg-${this.getPerformanceColor(service.performance)}" role="progressbar" style="width: ${service.performance}%;" aria-valuenow="${service.performance}" aria-valuemin="0" aria-valuemax="100">${service.performance}%</div>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Render HTML
    container.innerHTML = `
      <div class="services-report">
        ${summaryCards}
        ${chartsHTML}
      </div>
    `;
    
    // Initialize charts
    this.initServicesOrdersChart(data.servicesOrders);
    this.initServicesRevenueChart(data.servicesRevenue);
    this.initServicesRatingsChart(data.servicesRatings);
  }
  
  renderUsersReport(data) {
    const container = document.getElementById('report-container');
    
    // Prepare summary cards
    const summaryCards = `
      <div class="row">
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-primary">
                <i class="fas fa-users"></i>
              </div>
              <div class="summary-details">
                <h3>${data.totalUsers}</h3>
                <p>إجمالي المستخدمين</p>
                ${this.renderComparisonBadge(data.totalUsersComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-success">
                <i class="fas fa-user-plus"></i>
              </div>
              <div class="summary-details">
                <h3>${data.newUsers}</h3>
                <p>المستخدمين الجدد</p>
                ${this.renderComparisonBadge(data.newUsersComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-info">
                <i class="fas fa-user-check"></i>
              </div>
              <div class="summary-details">
                <h3>${data.activeUsers}</h3>
                <p>المستخدمين النشطين</p>
                ${this.renderComparisonBadge(data.activeUsersComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-warning">
                <i class="fas fa-shopping-cart"></i>
              </div>
              <div class="summary-details">
                <h3>${data.averageOrdersPerUser}</h3>
                <p>متوسط الطلبات لكل مستخدم</p>
                ${this.renderComparisonBadge(data.averageOrdersPerUserComparison)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Prepare charts
    const chartsHTML = `
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>المستخدمين حسب الدور</h5>
            </div>
            <div class="card-body">
              <canvas id="users-by-role-chart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>نشاط المستخدمين</h5>
            </div>
            <div class="card-body">
              <canvas id="users-activity-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>اتجاهات تسجيل المستخدمين</h5>
            </div>
            <div class="card-body">
              <canvas id="users-registration-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>أكثر العملاء نشاطاً</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>المستخدم</th>
                      <th>البريد الإلكتروني</th>
                      <th>تاريخ التسجيل</th>
                      <th>عدد الطلبات</th>
                      <th>إجمالي الإنفاق</th>
                      <th>آخر نشاط</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.topUsers.map(user => `
                      <tr>
                        <td>${user.name}</td>
                        <td>${user.email}</td>
                        <td>${this.formatDate(user.registrationDate)}</td>
                        <td>${user.ordersCount}</td>
                        <td>${this.formatCurrency(user.totalSpent)}</td>
                        <td>${this.formatDate(user.lastActivity)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Render HTML
    container.innerHTML = `
      <div class="users-report">
        ${summaryCards}
        ${chartsHTML}
      </div>
    `;
    
    // Initialize charts
    this.initUsersByRoleChart(data.usersByRole);
    this.initUsersActivityChart(data.usersActivity);
    this.initUsersRegistrationChart(data.usersRegistration);
  }
  
  renderProjectsReport(data) {
    const container = document.getElementById('report-container');
    
    // Prepare summary cards
    const summaryCards = `
      <div class="row">
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-primary">
                <i class="fas fa-project-diagram"></i>
              </div>
              <div class="summary-details">
                <h3>${data.totalProjects}</h3>
                <p>إجمالي المشاريع</p>
                ${this.renderComparisonBadge(data.totalProjectsComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-success">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="summary-details">
                <h3>${data.completedProjects}</h3>
                <p>المشاريع المكتملة</p>
                ${this.renderComparisonBadge(data.completedProjectsComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-warning">
                <i class="fas fa-clock"></i>
              </div>
              <div class="summary-details">
                <h3>${data.ongoingProjects}</h3>
                <p>المشاريع الجارية</p>
                ${this.renderComparisonBadge(data.ongoingProjectsComparison)}
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card summary-card">
            <div class="card-body">
              <div class="summary-icon bg-info">
                <i class="fas fa-calendar-check"></i>
              </div>
              <div class="summary-details">
                <h3>${data.averageCompletionTime}</h3>
                <p>متوسط وقت الإنجاز (أيام)</p>
                ${this.renderComparisonBadge(data.averageCompletionTimeComparison, true)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Prepare charts
    const chartsHTML = `
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>حالة المشاريع</h5>
            </div>
            <div class="card-body">
              <canvas id="projects-status-chart" height="250"></canvas>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h5>المشاريع حسب النوع</h5>
            </div>
            <div class="card-body">
              <canvas id="projects-by-type-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>اتجاهات المشاريع</h5>
            </div>
            <div class="card-body">
              <canvas id="projects-trends-chart" height="250"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5>أحدث المشاريع</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>اسم المشروع</th>
                      <th>العميل</th>
                      <th>النوع</th>
                      <th>تاريخ البدء</th>
                      <th>تاريخ الانتهاء المتوقع</th>
                      <th>الحالة</th>
                      <th>نسبة الإنجاز</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.recentProjects.map(project => `
                      <tr>
                        <td>${project.name}</td>
                        <td>${project.client}</td>
                        <td>${project.type}</td>
                        <td>${this.formatDate(project.startDate)}</td>
                        <td>${this.formatDate(project.expectedEndDate)}</td>
                        <td>${this.renderStatusBadge(project.status)}</td>
                        <td>
                          <div class="progress">
                            <div class="progress-bar bg-${this.getProgressColor(project.progress)}" role="progressbar" style="width: ${project.progress}%;" aria-valuenow="${project.progress}" aria-valuemin="0" aria-valuemax="100">${project.progress}%</div>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Render HTML
    container.innerHTML = `
      <div class="projects-report">
        ${summaryCards}
        ${chartsHTML}
      </div>
    `;
    
    // Initialize charts
    this.initProjectsStatusChart(data.projectsStatus);
    this.initProjectsByTypeChart(data.projectsByType);
    this.initProjectsTrendsChart(data.projectsTrends);
  }
  
  // Chart initialization methods
  initOrdersRevenueChart(data) {
    const ctx = document.getElementById('orders-revenue-chart').getContext('2d');
    this.charts.ordersRevenue = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'الطلبات',
            data: data.orders,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
            yAxisID: 'y-axis-1'
          },
          {
            label: 'الإيرادات',
            data: data.revenue,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            type: 'line',
            yAxisID: 'y-axis-2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              id: 'y-axis-1',
              type: 'linear',
              position: 'left',
              ticks: {
                beginAtZero: true
              },
              scaleLabel: {
                display: true,
                labelString: 'عدد الطلبات'
              }
            },
            {
              id: 'y-axis-2',
              type: 'linear',
              position: 'right',
              ticks: {
                beginAtZero: true,
                callback: (value) => this.formatCurrency(value, false)
              },
              scaleLabel: {
                display: true,
                labelString: 'الإيرادات'
              },
              gridLines: {
                drawOnChartArea: false
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              if (dataset.label === 'الإيرادات') {
                return `${dataset.label}: ${this.formatCurrency(value)}`;
              }
              return `${dataset.label}: ${value}`;
            }
          }
        }
      }
    });
  }
  
  initServicesDistributionChart(data) {
    const ctx = document.getElementById('services-distribution-chart').getContext('2d');
    this.charts.servicesDistribution = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(199, 199, 199, 0.7)',
              'rgba(83, 102, 255, 0.7)',
              'rgba(40, 159, 64, 0.7)',
              'rgba(210, 199, 199, 0.7)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)',
              'rgba(83, 102, 255, 1)',
              'rgba(40, 159, 64, 1)',
              'rgba(210, 199, 199, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initTrendsChart(data) {
    const ctx = document.getElementById('trends-chart').getContext('2d');
    this.charts.trends = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'الطلبات',
            data: data.orders,
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            yAxisID: 'y-axis-1'
          },
          {
            label: 'الإيرادات',
            data: data.revenue,
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
            yAxisID: 'y-axis-2'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              id: 'y-axis-1',
              type: 'linear',
              position: 'left',
              ticks: {
                beginAtZero: true
              },
              scaleLabel: {
                display: true,
                labelString: 'عدد الطلبات'
              }
            },
            {
              id: 'y-axis-2',
              type: 'linear',
              position: 'right',
              ticks: {
                beginAtZero: true,
                callback: (value) => this.formatCurrency(value, false)
              },
              scaleLabel: {
                display: true,
                labelString: 'الإيرادات'
              },
              gridLines: {
                drawOnChartArea: false
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              if (dataset.label === 'الإيرادات') {
                return `${dataset.label}: ${this.formatCurrency(value)}`;
              }
              return `${dataset.label}: ${value}`;
            }
          }
        }
      }
    });
  }
  
  initOrdersStatusChart(data) {
    const ctx = document.getElementById('orders-status-chart').getContext('2d');
    this.charts.ordersStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(40, 167, 69, 0.7)',  // Completed
              'rgba(255, 193, 7, 0.7)',  // Pending
              'rgba(23, 162, 184, 0.7)',  // Processing
              'rgba(220, 53, 69, 0.7)',  // Cancelled
              'rgba(108, 117, 125, 0.7)'  // Other
            ],
            borderColor: [
              'rgba(40, 167, 69, 1)',
              'rgba(255, 193, 7, 1)',
              'rgba(23, 162, 184, 1)',
              'rgba(220, 53, 69, 1)',
              'rgba(108, 117, 125, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initOrdersByServiceChart(data) {
    const ctx = document.getElementById('orders-by-service-chart').getContext('2d');
    this.charts.ordersByService = new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'عدد الطلبات',
            data: data.values,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    });
  }
  
  initOrdersTrendsChart(data) {
    const ctx = document.getElementById('orders-trends-chart').getContext('2d');
    this.charts.ordersTrends = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'إجمالي الطلبات',
            data: data.total,
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          },
          {
            label: 'الطلبات المكتملة',
            data: data.completed,
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(40, 167, 69, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(40, 167, 69, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          },
          {
            label: 'الطلبات قيد الانتظار',
            data: data.pending,
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(255, 193, 7, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255, 193, 7, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    });
  }
  
  initRevenueByServiceChart(data) {
    const ctx = document.getElementById('revenue-by-service-chart').getContext('2d');
    this.charts.revenueByService = new Chart(ctx, {
      type: 'horizontalBar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'الإيرادات',
            data: data.values,
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          xAxes: [
            {
              ticks: {
                beginAtZero: true,
                callback: (value) => this.formatCurrency(value, false)
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              return `${dataset.label}: ${this.formatCurrency(value)}`;
            }
          }
        }
      }
    });
  }
  
  initRevenueByPaymentChart(data) {
    const ctx = document.getElementById('revenue-by-payment-chart').getContext('2d');
    this.charts.revenueByPayment = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initRevenueTrendsChart(data) {
    const ctx = document.getElementById('revenue-trends-chart').getContext('2d');
    this.charts.revenueTrends = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'الإيرادات',
            data: data.values,
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(75, 192, 192, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          },
          {
            label: 'متوسط قيمة الطلب',
            data: data.average,
            backgroundColor: 'rgba(153, 102, 255, 0.1)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(153, 102, 255, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(153, 102, 255, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                callback: (value) => this.formatCurrency(value, false)
              }
            }
          ]
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              return `${dataset.label}: ${this.formatCurrency(value)}`;
            }
          }
        }
      }
    });
  }
  
  initServicesOrdersChart(data) {
    const ctx = document.getElementById('services-orders-chart').getContext('2d');
    this.charts.servicesOrders = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(199, 199, 199, 0.7)',
              'rgba(83, 102, 255, 0.7)',
              'rgba(40, 159, 64, 0.7)',
              'rgba(210, 199, 199, 0.7)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)',
              'rgba(83, 102, 255, 1)',
              'rgba(40, 159, 64, 1)',
              'rgba(210, 199, 199, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initServicesRevenueChart(data) {
    const ctx = document.getElementById('services-revenue-chart').getContext('2d');
    this.charts.servicesRevenue = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)',
              'rgba(199, 199, 199, 0.7)',
              'rgba(83, 102, 255, 0.7)',
              'rgba(40, 159, 64, 0.7)',
              'rgba(210, 199, 199, 0.7)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
              'rgba(199, 199, 199, 1)',
              'rgba(83, 102, 255, 1)',
              'rgba(40, 159, 64, 1)',
              'rgba(210, 199, 199, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${this.formatCurrency(value)} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initServicesRatingsChart(data) {
    const ctx = document.getElementById('services-ratings-chart').getContext('2d');
    this.charts.servicesRatings = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'متوسط التقييم',
            data: data.values,
            backgroundColor: 'rgba(255, 193, 7, 0.7)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true,
                max: 5
              }
            }
          ]
        }
      }
    });
  }
  
  initUsersByRoleChart(data) {
    const ctx = document.getElementById('users-by-role-chart').getContext('2d');
    this.charts.usersByRole = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)'
            ],
            borderColor: [
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initUsersActivityChart(data) {
    const ctx = document.getElementById('users-activity-chart').getContext('2d');
    this.charts.usersActivity = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(40, 167, 69, 0.7)',
              'rgba(255, 193, 7, 0.7)',
              'rgba(220, 53, 69, 0.7)'
            ],
            borderColor: [
              'rgba(40, 167, 69, 1)',
              'rgba(255, 193, 7, 1)',
              'rgba(220, 53, 69, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initUsersRegistrationChart(data) {
    const ctx = document.getElementById('users-registration-chart').getContext('2d');
    this.charts.usersRegistration = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'المستخدمين الجدد',
            data: data.values,
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    });
  }
  
  initProjectsStatusChart(data) {
    const ctx = document.getElementById('projects-status-chart').getContext('2d');
    this.charts.projectsStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(40, 167, 69, 0.7)',  // Completed
              'rgba(255, 193, 7, 0.7)',  // In Progress
              'rgba(23, 162, 184, 0.7)',  // Planning
              'rgba(220, 53, 69, 0.7)',  // Cancelled
              'rgba(108, 117, 125, 0.7)'  // On Hold
            ],
            borderColor: [
              'rgba(40, 167, 69, 1)',
              'rgba(255, 193, 7, 1)',
              'rgba(23, 162, 184, 1)',
              'rgba(220, 53, 69, 1)',
              'rgba(108, 117, 125, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initProjectsByTypeChart(data) {
    const ctx = document.getElementById('projects-by-type-chart').getContext('2d');
    this.charts.projectsByType = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: data.labels,
        datasets: [
          {
            data: data.values,
            backgroundColor: [
              'rgba(255, 99, 132, 0.7)',
              'rgba(54, 162, 235, 0.7)',
              'rgba(255, 206, 86, 0.7)',
              'rgba(75, 192, 192, 0.7)',
              'rgba(153, 102, 255, 0.7)',
              'rgba(255, 159, 64, 0.7)'
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        legend: {
          position: 'right'
        },
        tooltips: {
          callbacks: {
            label: (tooltipItem, data) => {
              const dataset = data.datasets[tooltipItem.datasetIndex];
              const value = dataset.data[tooltipItem.index];
              const label = data.labels[tooltipItem.index];
              const total = dataset.data.reduce((acc, val) => acc + val, 0);
              const percentage = Math.round((value / total) * 100);
              return `${label}: ${value} (${percentage}%)`;
            }
          }
        }
      }
    });
  }
  
  initProjectsTrendsChart(data) {
    const ctx = document.getElementById('projects-trends-chart').getContext('2d');
    this.charts.projectsTrends = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'إجمالي المشاريع',
            data: data.total,
            backgroundColor: 'rgba(54, 162, 235, 0.1)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(54, 162, 235, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          },
          {
            label: 'المشاريع المكتملة',
            data: data.completed,
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(40, 167, 69, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(40, 167, 69, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          },
          {
            label: 'المشاريع الجارية',
            data: data.ongoing,
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(255, 193, 7, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(255, 193, 7, 1)',
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
        }
      }
    });
  }
  
  toggleView(view) {
    // Toggle between chart and table view
    // This is a placeholder for actual implementation
    console.log(`Toggling to ${view} view`);
  }
  
  async exportReport() {
    try {
      // Show loading notification
      this.app.ui.notifications.show('info', 'جاري التصدير', 'جاري تصدير التقرير، يرجى الانتظار...');
      
      // Get filter values
      const filters = this.getFilters();
      
      // Add report type to filters
      filters.report = this.currentReport;
      
      // Send export request
      const response = await ApiClient.post(`${this.apiBaseUrl}/reports/export`, filters);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل تصدير التقرير');
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = response.data.fileUrl;
      link.download = response.data.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم تصدير التقرير بنجاح');
    } catch (error) {
      console.error('Export report error:', error);
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تصدير التقرير');
    }
  }
  
  printReport() {
    // Print current report
    window.print();
  }
  
  // Helper methods
  formatCurrency(value, includeSymbol = true) {
    if (value === undefined || value === null) return '';
    
    const formatter = new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    if (includeSymbol) {
      return formatter.format(value);
    } else {
      return new Intl.NumberFormat('ar-SA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
  }
  
  formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }
  
  renderComparisonBadge(comparison, inverse = false) {
    if (!comparison) return '';
    
    let badgeClass = '';
    let icon = '';
    
    if (comparison > 0) {
      badgeClass = inverse ? 'badge-danger' : 'badge-success';
      icon = inverse ? 'fa-arrow-up' : 'fa-arrow-up';
    } else if (comparison < 0) {
      badgeClass = inverse ? 'badge-success' : 'badge-danger';
      icon = inverse ? 'fa-arrow-down' : 'fa-arrow-down';
    } else {
      badgeClass = 'badge-secondary';
      icon = 'fa-equals';
    }
    
    return `
      <span class="badge ${badgeClass} comparison-badge">
        <i class="fas ${icon}"></i> ${Math.abs(comparison)}%
      </span>
    `;
  }
  
  renderStatusBadge(status) {
    let badgeClass = '';
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'مكتمل':
        badgeClass = 'badge-success';
        break;
      case 'pending':
      case 'قيد الانتظار':
        badgeClass = 'badge-warning';
        break;
      case 'processing':
      case 'قيد المعالجة':
        badgeClass = 'badge-info';
        break;
      case 'cancelled':
      case 'ملغي':
        badgeClass = 'badge-danger';
        break;
      case 'on hold':
      case 'معلق':
        badgeClass = 'badge-secondary';
        break;
      default:
        badgeClass = 'badge-secondary';
    }
    
    return `<span class="badge ${badgeClass}">${status}</span>`;
  }
  
  renderStarRating(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    let html = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
      html += '<i class="fas fa-star text-warning"></i>';
    }
    
    // Half star
    if (halfStar) {
      html += '<i class="fas fa-star-half-alt text-warning"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      html += '<i class="far fa-star text-warning"></i>';
    }
    
    return html;
  }
  
  getPerformanceColor(performance) {
    if (performance >= 80) return 'success';
    if (performance >= 60) return 'info';
    if (performance >= 40) return 'warning';
    return 'danger';
  }
  
  getProgressColor(progress) {
    if (progress >= 80) return 'success';
    if (progress >= 50) return 'info';
    if (progress >= 25) return 'warning';
    return 'danger';
  }
}
