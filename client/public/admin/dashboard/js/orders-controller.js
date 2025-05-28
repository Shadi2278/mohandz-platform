// Orders Controller for Mohandz Admin Dashboard
// Handles order management operations

class OrdersController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
    this.mainContent = app.ui.mainContent;
    this.currentUser = app.currentUser;
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalOrders = 0;
    this.totalPages = 0;
    this.filters = {
      search: '',
      status: '',
      service: '',
      dateFrom: '',
      dateTo: ''
    };
    this.selectedOrder = null;
  }
  
  async init() {
    try {
      // Render orders template
      this.renderOrdersTemplate();
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Check if there's an order to show (from dashboard)
      document.addEventListener('show-order', (event) => {
        if (event.detail && event.detail.id) {
          this.viewOrder(event.detail.id);
        }
      });
      
      // Load orders data
      await this.loadOrders();
      
      // Hide loader
      this.app.hideLoader();
    } catch (error) {
      console.error('Orders initialization error:', error);
      this.mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل بيانات الطلبات
        </div>
      `;
      this.app.hideLoader();
    }
  }
  
  renderOrdersTemplate() {
    this.mainContent.innerHTML = `
      <div class="orders-container">
        <div class="page-header">
          <div>
            <h1><i class="fas fa-shopping-cart"></i> إدارة الطلبات</h1>
            <p>إدارة طلبات الخدمات الهندسية</p>
          </div>
          <div>
            <button id="export-orders-btn" class="btn btn-success">
              <i class="fas fa-file-export"></i> تصدير
            </button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="filters-container">
              <div class="row">
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="search-input">بحث</label>
                    <input type="text" id="search-input" class="form-control" placeholder="رقم الطلب أو اسم العميل">
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="form-group">
                    <label for="status-filter">الحالة</label>
                    <select id="status-filter" class="form-control">
                      <option value="">الكل</option>
                      <option value="new">جديد</option>
                      <option value="processing">قيد التنفيذ</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="service-filter">الخدمة</label>
                    <select id="service-filter" class="form-control">
                      <option value="">الكل</option>
                      <!-- Will be populated dynamically -->
                    </select>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="form-group">
                    <label for="date-from">من تاريخ</label>
                    <input type="date" id="date-from" class="form-control">
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="form-group">
                    <label for="date-to">إلى تاريخ</label>
                    <input type="date" id="date-to" class="form-control">
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12 text-right">
                  <button id="apply-filters-btn" class="btn btn-primary">
                    <i class="fas fa-filter"></i> تطبيق الفلتر
                  </button>
                  <button id="reset-filters-btn" class="btn btn-secondary">
                    <i class="fas fa-undo"></i> إعادة تعيين
                  </button>
                </div>
              </div>
            </div>
            
            <div class="table-responsive">
              <table id="orders-table" class="table table-hover">
                <thead>
                  <tr>
                    <th>رقم الطلب</th>
                    <th>العميل</th>
                    <th>الخدمة</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th>تاريخ الطلب</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody id="orders-table-body">
                  <tr>
                    <td colspan="7" class="text-center">جاري التحميل...</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div class="pagination-container">
              <div class="row">
                <div class="col-md-6">
                  <div class="pagination-info">
                    عرض <span id="pagination-start">0</span> إلى <span id="pagination-end">0</span> من <span id="pagination-total">0</span> طلب
                  </div>
                </div>
                <div class="col-md-6">
                  <nav aria-label="Page navigation">
                    <ul class="pagination justify-content-end" id="pagination">
                      <li class="page-item disabled">
                        <a class="page-link" href="#" id="pagination-prev">السابق</a>
                      </li>
                      <li class="page-item disabled">
                        <a class="page-link" href="#" id="pagination-next">التالي</a>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  initEventListeners() {
    // Apply filters button
    document.getElementById('apply-filters-btn').addEventListener('click', () => {
      this.applyFilters();
    });
    
    // Reset filters button
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
      this.resetFilters();
    });
    
    // Export orders button
    document.getElementById('export-orders-btn').addEventListener('click', () => {
      this.exportOrders();
    });
    
    // Search input (apply filters on enter)
    document.getElementById('search-input').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.applyFilters();
      }
    });
    
    // Pagination prev button
    document.getElementById('pagination-prev').addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadOrders();
      }
    });
    
    // Pagination next button
    document.getElementById('pagination-next').addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadOrders();
      }
    });
    
    // Load services for filter
    this.loadServicesForFilter();
  }
  
  async loadServicesForFilter() {
    try {
      // Fetch services
      const response = await ApiClient.get(`${this.apiBaseUrl}/services`, { limit: 100 });
      
      if (!response.success) {
        console.error('Failed to load services for filter:', response.message);
        return;
      }
      
      // Populate service filter dropdown
      const serviceFilter = document.getElementById('service-filter');
      const services = response.data;
      
      services.forEach(service => {
        const option = document.createElement('option');
        option.value = service._id;
        option.textContent = service.title;
        serviceFilter.appendChild(option);
      });
    } catch (error) {
      console.error('Load services for filter error:', error);
    }
  }
  
  applyFilters() {
    this.filters.search = document.getElementById('search-input').value;
    this.filters.status = document.getElementById('status-filter').value;
    this.filters.service = document.getElementById('service-filter').value;
    this.filters.dateFrom = document.getElementById('date-from').value;
    this.filters.dateTo = document.getElementById('date-to').value;
    this.currentPage = 1;
    this.loadOrders();
  }
  
  resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('service-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    
    this.filters = {
      search: '',
      status: '',
      service: '',
      dateFrom: '',
      dateTo: ''
    };
    
    this.currentPage = 1;
    this.loadOrders();
  }
  
  async loadOrders() {
    try {
      // Show table loader
      document.getElementById('orders-table-body').innerHTML = `
        <tr>
          <td colspan="7" class="text-center">جاري التحميل...</td>
        </tr>
      `;
      
      // Prepare query parameters
      const params = {
        page: this.currentPage,
        limit: this.pageSize
      };
      
      // Add filters
      if (this.filters.search) {
        params.search = this.filters.search;
      }
      
      if (this.filters.status) {
        params.status = this.filters.status;
      }
      
      if (this.filters.service) {
        params.service = this.filters.service;
      }
      
      if (this.filters.dateFrom) {
        params.dateFrom = this.filters.dateFrom;
      }
      
      if (this.filters.dateTo) {
        params.dateTo = this.filters.dateTo;
      }
      
      // Fetch orders
      const response = await ApiClient.get(`${this.apiBaseUrl}/orders`, params);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل تحميل بيانات الطلبات');
      }
      
      // Update pagination info
      this.totalOrders = response.pagination.total;
      this.totalPages = response.pagination.pages;
      
      // Update pagination UI
      this.updatePaginationUI();
      
      // Render orders table
      this.renderOrdersTable(response.data);
    } catch (error) {
      console.error('Load orders error:', error);
      document.getElementById('orders-table-body').innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">
            <i class="fas fa-exclamation-circle"></i>
            حدث خطأ أثناء تحميل بيانات الطلبات
          </td>
        </tr>
      `;
    }
  }
  
  updatePaginationUI() {
    // Update pagination info
    const start = this.totalOrders === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalOrders);
    
    document.getElementById('pagination-start').textContent = start;
    document.getElementById('pagination-end').textContent = end;
    document.getElementById('pagination-total').textContent = this.totalOrders;
    
    // Update pagination buttons
    const prevButton = document.getElementById('pagination-prev').parentElement;
    const nextButton = document.getElementById('pagination-next').parentElement;
    
    if (this.currentPage <= 1) {
      prevButton.classList.add('disabled');
    } else {
      prevButton.classList.remove('disabled');
    }
    
    if (this.currentPage >= this.totalPages) {
      nextButton.classList.add('disabled');
    } else {
      nextButton.classList.remove('disabled');
    }
    
    // Update pagination pages
    const pagination = document.getElementById('pagination');
    
    // Remove existing page items (except prev and next)
    const pageItems = pagination.querySelectorAll('.page-item:not(:first-child):not(:last-child)');
    pageItems.forEach(item => item.remove());
    
    // Add page items
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    // Insert before next button
    const nextPageItem = pagination.querySelector('.page-item:last-child');
    
    for (let i = startPage; i <= endPage; i++) {
      const pageItem = document.createElement('li');
      pageItem.classList.add('page-item');
      
      if (i === this.currentPage) {
        pageItem.classList.add('active');
      }
      
      const pageLink = document.createElement('a');
      pageLink.classList.add('page-link');
      pageLink.href = '#';
      pageLink.textContent = i;
      
      pageLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.currentPage = i;
        this.loadOrders();
      });
      
      pageItem.appendChild(pageLink);
      pagination.insertBefore(pageItem, nextPageItem);
    }
  }
  
  renderOrdersTable(orders) {
    const tableBody = document.getElementById('orders-table-body');
    
    if (!orders || orders.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">لا توجد طلبات</td>
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
        <tr>
          <td>${order.orderNumber || '-'}</td>
          <td>${order.client ? order.client.name : '-'}</td>
          <td>${order.service ? order.service.title : '-'}</td>
          <td>${order.amount ? order.amount.toLocaleString('ar-SA') + ' ريال' : '-'}</td>
          <td><span class="badge ${status.class}">${status.label}</span></td>
          <td>${date}</td>
          <td>
            <div class="actions">
              <button class="btn btn-sm btn-info view-order" data-id="${order._id}" title="عرض">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-primary edit-order" data-id="${order._id}" title="تعديل">
                <i class="fas fa-edit"></i>
              </button>
              ${order.status !== 'completed' && order.status !== 'cancelled' ? `
                <button class="btn btn-sm btn-danger cancel-order" data-id="${order._id}" title="إلغاء">
                  <i class="fas fa-times"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to action buttons
    tableBody.querySelectorAll('.view-order').forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.getAttribute('data-id');
        this.viewOrder(orderId);
      });
    });
    
    tableBody.querySelectorAll('.edit-order').forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.getAttribute('data-id');
        this.editOrder(orderId);
      });
    });
    
    tableBody.querySelectorAll('.cancel-order').forEach(button => {
      button.addEventListener('click', () => {
        const orderId = button.getAttribute('data-id');
        this.cancelOrder(orderId);
      });
    });
  }
  
  async viewOrder(orderId) {
    try {
      this.app.showLoader();
      
      // Fetch order details
      const response = await ApiClient.get(`${this.apiBaseUrl}/orders/${orderId}`);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات الطلب');
        return;
      }
      
      const order = response.data;
      this.selectedOrder = order;
      
      // Map status to Arabic labels and badge classes
      const statusMap = {
        'new': { label: 'جديد', class: 'badge-primary' },
        'processing': { label: 'قيد التنفيذ', class: 'badge-warning' },
        'completed': { label: 'مكتمل', class: 'badge-success' },
        'cancelled': { label: 'ملغي', class: 'badge-danger' }
      };
      
      const status = statusMap[order.status] || { label: order.status, class: 'badge-secondary' };
      
      // Format dates
      const createdDate = new Date(order.createdAt).toLocaleDateString('ar-SA');
      const updatedDate = new Date(order.updatedAt).toLocaleDateString('ar-SA');
      
      // Show order details modal
      ModalManager.show({
        title: `تفاصيل الطلب: ${order.orderNumber || orderId}`,
        size: 'lg',
        body: `
          <div class="order-details-container">
            <div class="row">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h5>معلومات الطلب</h5>
                  </div>
                  <div class="card-body">
                    <div class="info-list">
                      <div class="info-item">
                        <div class="info-label">رقم الطلب</div>
                        <div class="info-value">${order.orderNumber || '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">الخدمة</div>
                        <div class="info-value">${order.service ? order.service.title : '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">المبلغ</div>
                        <div class="info-value">${order.amount ? order.amount.toLocaleString('ar-SA') + ' ريال' : '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">الحالة</div>
                        <div class="info-value"><span class="badge ${status.class}">${status.label}</span></div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">تاريخ الطلب</div>
                        <div class="info-value">${createdDate}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">آخر تحديث</div>
                        <div class="info-value">${updatedDate}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h5>معلومات العميل</h5>
                  </div>
                  <div class="card-body">
                    <div class="info-list">
                      <div class="info-item">
                        <div class="info-label">الاسم</div>
                        <div class="info-value">${order.client ? order.client.name : '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">البريد الإلكتروني</div>
                        <div class="info-value">${order.client ? order.client.email : '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">رقم الهاتف</div>
                        <div class="info-value">${order.client && order.client.phone ? order.client.phone : '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row mt-4">
              <div class="col-12">
                <div class="card">
                  <div class="card-header">
                    <h5>تفاصيل الطلب</h5>
                  </div>
                  <div class="card-body">
                    <div class="order-details">
                      ${order.details || 'لا توجد تفاصيل إضافية'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            ${order.attachments && order.attachments.length > 0 ? `
              <div class="row mt-4">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h5>المرفقات</h5>
                    </div>
                    <div class="card-body">
                      <div class="attachments-list">
                        ${order.attachments.map(attachment => `
                          <div class="attachment-item">
                            <a href="${attachment.url}" target="_blank" class="attachment-link">
                              <i class="fas fa-file"></i>
                              <span>${attachment.name}</span>
                            </a>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            ${order.notes && order.notes.length > 0 ? `
              <div class="row mt-4">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h5>الملاحظات</h5>
                    </div>
                    <div class="card-body">
                      <div class="notes-list">
                        ${order.notes.map(note => `
                          <div class="note-item">
                            <div class="note-header">
                              <span class="note-author">${note.author}</span>
                              <span class="note-date">${new Date(note.date).toLocaleString('ar-SA')}</span>
                            </div>
                            <div class="note-content">${note.content}</div>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        `,
        footer: `
          <button type="button" class="btn btn-secondary" data-dismiss="modal">إغلاق</button>
          <button type="button" class="btn btn-primary edit-order-btn" data-id="${order._id}">تعديل</button>
          ${order.status !== 'completed' ? `
            <button type="button" class="btn btn-success update-status-btn" data-id="${order._id}">تحديث الحالة</button>
          ` : ''}
          ${order.status !== 'completed' && order.status !== 'cancelled' ? `
            <button type="button" class="btn btn-danger cancel-order-btn" data-id="${order._id}">إلغاء الطلب</button>
          ` : ''}
        `
      });
      
      // Add event listeners to buttons
      document.querySelector('.edit-order-btn').addEventListener('click', () => {
        ModalManager.hide();
        this.editOrder(orderId);
      });
      
      const updateStatusBtn = document.querySelector('.update-status-btn');
      if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', () => {
          this.showUpdateStatusModal(orderId);
        });
      }
      
      const cancelOrderBtn = document.querySelector('.cancel-order-btn');
      if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', () => {
          ModalManager.hide();
          this.cancelOrder(orderId);
        });
      }
    } catch (error) {
      console.error('View order error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات الطلب');
    }
  }
  
  async editOrder(orderId) {
    try {
      this.app.showLoader();
      
      // Fetch order details if not already loaded
      if (!this.selectedOrder || this.selectedOrder._id !== orderId) {
        const response = await ApiClient.get(`${this.apiBaseUrl}/orders/${orderId}`);
        
        if (!response.success) {
          this.app.hideLoader();
          this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات الطلب');
          return;
        }
        
        this.selectedOrder = response.data;
      }
      
      const order = this.selectedOrder;
      
      // Fetch services for dropdown
      const servicesResponse = await ApiClient.get(`${this.apiBaseUrl}/services`, { limit: 100 });
      
      this.app.hideLoader();
      
      if (!servicesResponse.success) {
        this.app.ui.notifications.show('error', 'خطأ', 'فشل تحميل بيانات الخدمات');
        return;
      }
      
      const services = servicesResponse.data;
      
      // Generate services options
      let servicesOptions = '';
      services.forEach(service => {
        servicesOptions += `<option value="${service._id}" ${order.service && order.service._id === service._id ? 'selected' : ''}>${service.title}</option>`;
      });
      
      // Show edit order modal
      ModalManager.show({
        title: `تعديل الطلب: ${order.orderNumber || orderId}`,
        size: 'lg',
        body: `
          <form id="edit-order-form">
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="order-number">رقم الطلب</label>
                  <input type="text" id="order-number" class="form-control" value="${order.orderNumber || ''}" readonly>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="order-service">الخدمة <span class="text-danger">*</span></label>
                  <select id="order-service" class="form-control" required>
                    ${servicesOptions}
                  </select>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="order-amount">المبلغ (ريال) <span class="text-danger">*</span></label>
                  <input type="number" id="order-amount" class="form-control" value="${order.amount || ''}" min="0" step="0.01" required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="order-status">الحالة <span class="text-danger">*</span></label>
                  <select id="order-status" class="form-control" required>
                    <option value="new" ${order.status === 'new' ? 'selected' : ''}>جديد</option>
                    <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>قيد التنفيذ</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="order-details">تفاصيل الطلب</label>
              <textarea id="order-details" class="form-control" rows="4">${order.details || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label>إضافة ملاحظة جديدة</label>
              <textarea id="order-new-note" class="form-control" rows="3" placeholder="أدخل ملاحظة جديدة هنا..."></textarea>
            </div>
            
            <div class="alert alert-danger mt-3" id="edit-order-error" style="display: none;"></div>
          </form>
        `,
        footer: `
          <button type="button" class="btn btn-secondary" data-dismiss="modal">إلغاء</button>
          <button type="button" class="btn btn-primary" id="save-order-btn">حفظ</button>
        `
      });
      
      // Add event listener to save button
      document.getElementById('save-order-btn').addEventListener('click', () => {
        this.saveOrder(orderId);
      });
    } catch (error) {
      console.error('Edit order error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات الطلب');
    }
  }
  
  async saveOrder(orderId) {
    try {
      // Get form values
      const serviceId = document.getElementById('order-service').value;
      const amount = document.getElementById('order-amount').value;
      const status = document.getElementById('order-status').value;
      const details = document.getElementById('order-details').value;
      const newNote = document.getElementById('order-new-note').value;
      
      // Validate form
      if (!serviceId || !amount || !status) {
        document.getElementById('edit-order-error').textContent = 'يرجى ملء جميع الحقول المطلوبة';
        document.getElementById('edit-order-error').style.display = 'block';
        return;
      }
      
      // Disable save button
      const saveButton = document.getElementById('save-order-btn');
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      
      // Prepare data
      const data = {
        service: serviceId,
        amount: parseFloat(amount),
        status,
        details
      };
      
      // Add new note if provided
      if (newNote.trim()) {
        data.note = newNote.trim();
      }
      
      // Send request
      const response = await ApiClient.put(`${this.apiBaseUrl}/orders/${orderId}`, data);
      
      // Enable save button
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
      
      if (!response.success) {
        document.getElementById('edit-order-error').textContent = response.message || 'فشل حفظ بيانات الطلب';
        document.getElementById('edit-order-error').style.display = 'block';
        return;
      }
      
      // Hide modal
      ModalManager.hide();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم تحديث بيانات الطلب بنجاح');
      
      // Reload orders
      this.loadOrders();
    } catch (error) {
      console.error('Save order error:', error);
      document.getElementById('edit-order-error').textContent = 'حدث خطأ أثناء حفظ بيانات الطلب';
      document.getElementById('edit-order-error').style.display = 'block';
      
      // Enable save button
      const saveButton = document.getElementById('save-order-btn');
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
    }
  }
  
  showUpdateStatusModal(orderId) {
    // Get current status
    const currentStatus = this.selectedOrder.status;
    
    // Determine available next statuses based on current status
    let statusOptions = '';
    
    if (currentStatus === 'new') {
      statusOptions = `
        <option value="processing">قيد التنفيذ</option>
        <option value="completed">مكتمل</option>
        <option value="cancelled">ملغي</option>
      `;
    } else if (currentStatus === 'processing') {
      statusOptions = `
        <option value="completed">مكتمل</option>
        <option value="cancelled">ملغي</option>
      `;
    } else {
      statusOptions = `
        <option value="${currentStatus}" selected>لا يمكن تغيير الحالة</option>
      `;
    }
    
    // Show update status modal
    ModalManager.show({
      title: 'تحديث حالة الطلب',
      size: 'md',
      body: `
        <form id="update-status-form">
          <div class="form-group">
            <label for="new-status">الحالة الجديدة <span class="text-danger">*</span></label>
            <select id="new-status" class="form-control" required>
              ${statusOptions}
            </select>
          </div>
          
          <div class="form-group">
            <label for="status-note">ملاحظة</label>
            <textarea id="status-note" class="form-control" rows="3" placeholder="أدخل ملاحظة حول تغيير الحالة..."></textarea>
          </div>
          
          <div class="alert alert-danger mt-3" id="update-status-error" style="display: none;"></div>
        </form>
      `,
      footer: `
        <button type="button" class="btn btn-secondary" data-dismiss="modal">إلغاء</button>
        <button type="button" class="btn btn-primary" id="update-status-btn">تحديث</button>
      `
    });
    
    // Add event listener to update button
    document.getElementById('update-status-btn').addEventListener('click', () => {
      this.updateOrderStatus(orderId);
    });
  }
  
  async updateOrderStatus(orderId) {
    try {
      // Get form values
      const status = document.getElementById('new-status').value;
      const note = document.getElementById('status-note').value;
      
      // Validate form
      if (!status || status === this.selectedOrder.status) {
        document.getElementById('update-status-error').textContent = 'يرجى اختيار حالة جديدة';
        document.getElementById('update-status-error').style.display = 'block';
        return;
      }
      
      // Disable update button
      const updateButton = document.getElementById('update-status-btn');
      updateButton.disabled = true;
      updateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحديث...';
      
      // Prepare data
      const data = {
        status
      };
      
      // Add note if provided
      if (note.trim()) {
        data.note = note.trim();
      }
      
      // Send request
      const response = await ApiClient.put(`${this.apiBaseUrl}/orders/${orderId}/status`, data);
      
      // Enable update button
      updateButton.disabled = false;
      updateButton.innerHTML = 'تحديث';
      
      if (!response.success) {
        document.getElementById('update-status-error').textContent = response.message || 'فشل تحديث حالة الطلب';
        document.getElementById('update-status-error').style.display = 'block';
        return;
      }
      
      // Hide modals
      ModalManager.hideAll();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم تحديث حالة الطلب بنجاح');
      
      // Reload orders
      this.loadOrders();
    } catch (error) {
      console.error('Update order status error:', error);
      document.getElementById('update-status-error').textContent = 'حدث خطأ أثناء تحديث حالة الطلب';
      document.getElementById('update-status-error').style.display = 'block';
      
      // Enable update button
      const updateButton = document.getElementById('update-status-btn');
      updateButton.disabled = false;
      updateButton.innerHTML = 'تحديث';
    }
  }
  
  cancelOrder(orderId) {
    // Show confirmation dialog
    ModalManager.confirm(
      'إلغاء الطلب',
      'هل أنت متأكد من رغبتك في إلغاء هذا الطلب؟',
      async () => {
        try {
          this.app.showLoader();
          
          // Send cancel request
          const response = await ApiClient.put(`${this.apiBaseUrl}/orders/${orderId}/cancel`);
          
          this.app.hideLoader();
          
          if (!response.success) {
            this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل إلغاء الطلب');
            return;
          }
          
          // Show success notification
          this.app.ui.notifications.show('success', 'تم بنجاح', 'تم إلغاء الطلب بنجاح');
          
          // Reload orders
          this.loadOrders();
        } catch (error) {
          console.error('Cancel order error:', error);
          this.app.hideLoader();
          this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء إلغاء الطلب');
        }
      }
    );
  }
  
  async exportOrders() {
    try {
      this.app.showLoader();
      
      // Prepare query parameters (use current filters)
      const params = { ...this.filters, export: true };
      
      // Send export request
      const response = await ApiClient.get(`${this.apiBaseUrl}/orders/export`, params);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تصدير الطلبات');
        return;
      }
      
      // Create download link
      const url = response.data.url;
      const filename = response.data.filename || 'orders-export.csv';
      
      // Download file
      ApiClient.downloadFile(url, filename);
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم تصدير الطلبات بنجاح');
    } catch (error) {
      console.error('Export orders error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تصدير الطلبات');
    }
  }
}
