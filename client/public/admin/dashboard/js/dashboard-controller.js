// Dashboard Controller for Mohandz Admin Dashboard
// Handles the main dashboard view with statistics and charts

class DashboardController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
    this.mainContent = app.ui.mainContent;
    this.charts = {};
  }
  
  async init() {
    try {
      // Render dashboard template
      this.renderDashboardTemplate();
      
      // Load dashboard data
      await this.loadDashboardData();
      
      // Hide loader
      this.app.hideLoader();
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      this.mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل لوحة المعلومات
        </div>
      `;
      this.app.hideLoader();
    }
  }
  
  renderDashboardTemplate() {
    this.mainContent.innerHTML = `
      <div class="dashboard-container">
        <div class="page-header">
          <h1><i class="fas fa-tachometer-alt"></i> لوحة المعلومات</h1>
          <p>نظرة عامة على منصة مهندز</p>
        </div>
        
        <div class="stats-cards">
          <div class="row">
            <div class="col-md-3">
              <div class="stats-card">
                <div class="stats-card-icon bg-primary">
                  <i class="fas fa-users"></i>
                </div>
                <div class="stats-card-content">
                  <h3 id="users-count">0</h3>
                  <p>المستخدمين</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stats-card">
                <div class="stats-card-icon bg-success">
                  <i class="fas fa-tools"></i>
                </div>
                <div class="stats-card-content">
                  <h3 id="services-count">0</h3>
                  <p>الخدمات</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stats-card">
                <div class="stats-card-icon bg-warning">
                  <i class="fas fa-shopping-cart"></i>
                </div>
                <div class="stats-card-content">
                  <h3 id="orders-count">0</h3>
                  <p>الطلبات</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stats-card">
                <div class="stats-card-icon bg-info">
                  <i class="fas fa-project-diagram"></i>
                </div>
                <div class="stats-card-content">
                  <h3 id="projects-count">0</h3>
                  <p>المشاريع</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-8">
            <div class="card">
              <div class="card-header">
                <h5>الإيرادات الشهرية</h5>
              </div>
              <div class="card-body">
                <canvas id="revenue-chart" height="300"></canvas>
              </div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="card">
              <div class="card-header">
                <h5>حالة الطلبات</h5>
              </div>
              <div class="card-body">
                <canvas id="orders-status-chart" height="260"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row mt-4">
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5>أحدث الطلبات</h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>رقم الطلب</th>
                        <th>العميل</th>
                        <th>الخدمة</th>
                        <th>الحالة</th>
                        <th>التاريخ</th>
                      </tr>
                    </thead>
                    <tbody id="recent-orders-table">
                      <tr>
                        <td colspan="5" class="text-center">جاري التحميل...</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-6">
            <div class="card">
              <div class="card-header">
                <h5>أكثر الخدمات طلباً</h5>
              </div>
              <div class="card-body">
                <canvas id="top-services-chart" height="260"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadDashboardData() {
    try {
      // Fetch dashboard statistics
      const response = await ApiClient.get(`${this.apiBaseUrl}/reports/dashboard`);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل تحميل بيانات لوحة المعلومات');
      }
      
      const data = response.data;
      
      // Update stats cards
      document.getElementById('users-count').textContent = data.counts.users.toLocaleString('ar-SA');
      document.getElementById('services-count').textContent = data.counts.services.toLocaleString('ar-SA');
      document.getElementById('orders-count').textContent = data.counts.orders.toLocaleString('ar-SA');
      document.getElementById('projects-count').textContent = data.counts.projects.toLocaleString('ar-SA');
      
      // Render charts
      this.renderRevenueChart(data.revenue.monthly);
      this.renderOrdersStatusChart(data.ordersByStatus);
      this.renderTopServicesChart(data.topServices);
      
      // Render recent orders table
      this.renderRecentOrdersTable(data.recentOrders);
    } catch (error) {
      console.error('Load dashboard data error:', error);
      throw error;
    }
  }
  
  renderRevenueChart(monthlyData) {
    const ctx = document.getElementById('revenue-chart').getContext('2d');
    
    // Month names in Arabic
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    this.charts.revenue = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'الإيرادات (ريال)',
          data: monthlyData,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(54, 162, 235, 1)',
          pointBorderColor: '#fff',
          pointBorderWidth: 1,
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: {
                family: 'Cairo'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.raw.toLocaleString('ar-SA')} ريال`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return value.toLocaleString('ar-SA');
              },
              font: {
                family: 'Cairo'
              }
            }
          },
          x: {
            ticks: {
              font: {
                family: 'Cairo'
              }
            }
          }
        }
      }
    });
  }
  
  renderOrdersStatusChart(statusData) {
    const ctx = document.getElementById('orders-status-chart').getContext('2d');
    
    // Map status to Arabic labels
    const statusLabels = {
      'new': 'جديد',
      'processing': 'قيد التنفيذ',
      'completed': 'مكتمل',
      'cancelled': 'ملغي'
    };
    
    // Map status to colors
    const statusColors = {
      'new': 'rgba(54, 162, 235, 0.8)',
      'processing': 'rgba(255, 193, 7, 0.8)',
      'completed': 'rgba(40, 167, 69, 0.8)',
      'cancelled': 'rgba(220, 53, 69, 0.8)'
    };
    
    // Prepare data for chart
    const labels = [];
    const data = [];
    const backgroundColor = [];
    
    statusData.forEach(item => {
      labels.push(statusLabels[item._id] || item._id);
      data.push(item.count);
      backgroundColor.push(statusColors[item._id] || 'rgba(108, 117, 125, 0.8)');
    });
    
    this.charts.ordersStatus = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              font: {
                family: 'Cairo'
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.raw || 0;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value} (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }
  
  renderTopServicesChart(servicesData) {
    const ctx = document.getElementById('top-services-chart').getContext('2d');
    
    // Prepare data for chart
    const labels = [];
    const data = [];
    
    servicesData.forEach(item => {
      labels.push(item.service.title);
      data.push(item.count);
    });
    
    this.charts.topServices = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'عدد الطلبات',
          data: data,
          backgroundColor: 'rgba(40, 167, 69, 0.8)',
          borderColor: 'rgba(40, 167, 69, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0,
              font: {
                family: 'Cairo'
              }
            }
          },
          y: {
            ticks: {
              font: {
                family: 'Cairo'
              }
            }
          }
        }
      }
    });
  }
  
  renderRecentOrdersTable(orders) {
    const tableBody = document.getElementById('recent-orders-table');
    
    if (!orders || orders.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center">لا توجد طلبات حديثة</td>
        </tr>
      `;
      return;
    }
    
    // Map status to Arabic labels and badge classes
    const statusMap = {
      'new': { label: 'جديد', class: 'badge-primary' },
      'processing': { label: 'قيد التنفيذ', class: 'badge-warning' },
      'completed': { label: 'مكتمل', class: 'badge-success' },
      'cancelled': { label: 'ملغي', class: 'badge-danger' }
    };
    
    // Generate table rows
    let html = '';
    
    orders.forEach(order => {
      const status = statusMap[order.status] || { label: order.status, class: 'badge-secondary' };
      const date = new Date(order.createdAt).toLocaleDateString('ar-SA');
      
      html += `
        <tr data-id="${order._id}" class="order-row">
          <td>${order.orderNumber || '-'}</td>
          <td>${order.client ? order.client.name : '-'}</td>
          <td>${order.service ? order.service.title : '-'}</td>
          <td><span class="badge ${status.class}">${status.label}</span></td>
          <td>${date}</td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
    // Add click event to rows
    tableBody.querySelectorAll('.order-row').forEach(row => {
      row.addEventListener('click', () => {
        const orderId = row.getAttribute('data-id');
        this.app.loadSection('orders');
        // Notify orders controller to show this order
        setTimeout(() => {
          const event = new CustomEvent('show-order', { detail: { id: orderId } });
          document.dispatchEvent(event);
        }, 500);
      });
    });
  }
}
