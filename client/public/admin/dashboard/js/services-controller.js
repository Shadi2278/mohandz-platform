// Services Controller for Mohandz Admin Dashboard
// Handles engineering services management operations

class ServicesController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
    this.mainContent = app.ui.mainContent;
    this.currentUser = app.currentUser;
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalServices = 0;
    this.totalPages = 0;
    this.filters = {
      search: '',
      category: '',
      status: ''
    };
  }
  
  async init() {
    try {
      // Render services template
      this.renderServicesTemplate();
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Load services data
      await this.loadServices();
      
      // Hide loader
      this.app.hideLoader();
    } catch (error) {
      console.error('Services initialization error:', error);
      this.mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل بيانات الخدمات
        </div>
      `;
      this.app.hideLoader();
    }
  }
  
  renderServicesTemplate() {
    this.mainContent.innerHTML = `
      <div class="services-container">
        <div class="page-header">
          <div>
            <h1><i class="fas fa-tools"></i> إدارة الخدمات الهندسية</h1>
            <p>إدارة الخدمات المقدمة في منصة مهندز</p>
          </div>
          <div>
            <button id="add-service-btn" class="btn btn-primary">
              <i class="fas fa-plus"></i> إضافة خدمة
            </button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            <div class="filters-container">
              <div class="row">
                <div class="col-md-4">
                  <div class="form-group">
                    <label for="search-input">بحث</label>
                    <input type="text" id="search-input" class="form-control" placeholder="بحث بعنوان الخدمة أو الوصف">
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="category-filter">التصنيف</label>
                    <select id="category-filter" class="form-control">
                      <option value="">الكل</option>
                      <option value="architectural">التصاميم المعمارية والإنشائية</option>
                      <option value="roads">خدمات الطرق والبنية التحتية</option>
                      <option value="survey">خدمات الموقع المساحية</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="status-filter">الحالة</label>
                    <select id="status-filter" class="form-control">
                      <option value="">الكل</option>
                      <option value="active">نشط</option>
                      <option value="inactive">غير نشط</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-2">
                  <div class="form-group">
                    <label>&nbsp;</label>
                    <button id="apply-filters-btn" class="btn btn-primary btn-block">تطبيق</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="services-grid" id="services-grid">
              <div class="text-center p-5">
                <i class="fas fa-spinner fa-spin fa-2x"></i>
                <p class="mt-2">جاري تحميل الخدمات...</p>
              </div>
            </div>
            
            <div class="pagination-container">
              <div class="row">
                <div class="col-md-6">
                  <div class="pagination-info">
                    عرض <span id="pagination-start">0</span> إلى <span id="pagination-end">0</span> من <span id="pagination-total">0</span> خدمة
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
    // Add service button
    document.getElementById('add-service-btn').addEventListener('click', () => {
      this.showServiceModal();
    });
    
    // Apply filters button
    document.getElementById('apply-filters-btn').addEventListener('click', () => {
      this.applyFilters();
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
        this.loadServices();
      }
    });
    
    // Pagination next button
    document.getElementById('pagination-next').addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadServices();
      }
    });
  }
  
  applyFilters() {
    this.filters.search = document.getElementById('search-input').value;
    this.filters.category = document.getElementById('category-filter').value;
    this.filters.status = document.getElementById('status-filter').value;
    this.currentPage = 1;
    this.loadServices();
  }
  
  async loadServices() {
    try {
      // Show grid loader
      document.getElementById('services-grid').innerHTML = `
        <div class="text-center p-5">
          <i class="fas fa-spinner fa-spin fa-2x"></i>
          <p class="mt-2">جاري تحميل الخدمات...</p>
        </div>
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
      
      if (this.filters.category) {
        params.category = this.filters.category;
      }
      
      if (this.filters.status) {
        params.status = this.filters.status;
      }
      
      // Fetch services
      const response = await ApiClient.get(`${this.apiBaseUrl}/services`, params);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل تحميل بيانات الخدمات');
      }
      
      // Update pagination info
      this.totalServices = response.pagination.total;
      this.totalPages = response.pagination.pages;
      
      // Update pagination UI
      this.updatePaginationUI();
      
      // Render services grid
      this.renderServicesGrid(response.data);
    } catch (error) {
      console.error('Load services error:', error);
      document.getElementById('services-grid').innerHTML = `
        <div class="alert alert-danger text-center">
          <i class="fas fa-exclamation-circle fa-2x mb-3"></i>
          <p>حدث خطأ أثناء تحميل بيانات الخدمات</p>
        </div>
      `;
    }
  }
  
  updatePaginationUI() {
    // Update pagination info
    const start = this.totalServices === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalServices);
    
    document.getElementById('pagination-start').textContent = start;
    document.getElementById('pagination-end').textContent = end;
    document.getElementById('pagination-total').textContent = this.totalServices;
    
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
        this.loadServices();
      });
      
      pageItem.appendChild(pageLink);
      pagination.insertBefore(pageItem, nextPageItem);
    }
  }
  
  renderServicesGrid(services) {
    const servicesGrid = document.getElementById('services-grid');
    
    if (!services || services.length === 0) {
      servicesGrid.innerHTML = `
        <div class="alert alert-info text-center">
          <i class="fas fa-info-circle fa-2x mb-3"></i>
          <p>لا توجد خدمات متاحة</p>
        </div>
      `;
      return;
    }
    
    // Map category to Arabic labels
    const categoryMap = {
      'architectural': 'التصاميم المعمارية والإنشائية',
      'roads': 'خدمات الطرق والبنية التحتية',
      'survey': 'خدمات الموقع المساحية'
    };
    
    // Generate grid items
    let html = '<div class="row">';
    
    services.forEach(service => {
      const category = categoryMap[service.category] || service.category;
      const statusClass = service.status === 'active' ? 'badge-success' : 'badge-secondary';
      const statusLabel = service.status === 'active' ? 'نشط' : 'غير نشط';
      
      html += `
        <div class="col-md-4 mb-4">
          <div class="service-card">
            <div class="service-image">
              <img src="${service.image || '/admin/dashboard/img/service-placeholder.jpg'}" alt="${service.title}">
              <span class="service-badge badge ${statusClass}">${statusLabel}</span>
            </div>
            <div class="service-content">
              <h3 class="service-title">${service.title}</h3>
              <div class="service-category">${category}</div>
              <div class="service-price">${service.price.toLocaleString('ar-SA')} ريال</div>
              <p class="service-description">${service.shortDescription || ''}</p>
              <div class="service-actions">
                <button class="btn btn-sm btn-info view-service" data-id="${service._id}" title="عرض">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary edit-service" data-id="${service._id}" title="تعديل">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-service" data-id="${service._id}" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    servicesGrid.innerHTML = html;
    
    // Add event listeners to action buttons
    servicesGrid.querySelectorAll('.view-service').forEach(button => {
      button.addEventListener('click', () => {
        const serviceId = button.getAttribute('data-id');
        this.viewService(serviceId);
      });
    });
    
    servicesGrid.querySelectorAll('.edit-service').forEach(button => {
      button.addEventListener('click', () => {
        const serviceId = button.getAttribute('data-id');
        this.editService(serviceId);
      });
    });
    
    servicesGrid.querySelectorAll('.delete-service').forEach(button => {
      button.addEventListener('click', () => {
        const serviceId = button.getAttribute('data-id');
        this.deleteService(serviceId);
      });
    });
  }
  
  async viewService(serviceId) {
    try {
      this.app.showLoader();
      
      // Fetch service details
      const response = await ApiClient.get(`${this.apiBaseUrl}/services/${serviceId}`);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات الخدمة');
        return;
      }
      
      const service = response.data;
      
      // Map category to Arabic labels
      const categoryMap = {
        'architectural': 'التصاميم المعمارية والإنشائية',
        'roads': 'خدمات الطرق والبنية التحتية',
        'survey': 'خدمات الموقع المساحية'
      };
      
      // Map status to Arabic labels
      const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط'
      };
      
      // Show service details modal
      ModalManager.show({
        title: `تفاصيل الخدمة: ${service.title}`,
        size: 'lg',
        body: `
          <div class="service-details-container">
            <div class="row">
              <div class="col-md-4">
                <div class="service-image-large">
                  <img src="${service.image || '/admin/dashboard/img/service-placeholder.jpg'}" alt="${service.title}" class="img-fluid">
                </div>
              </div>
              <div class="col-md-8">
                <h3>${service.title}</h3>
                <div class="service-info-list">
                  <div class="info-item">
                    <div class="info-label">التصنيف</div>
                    <div class="info-value">${categoryMap[service.category] || service.category}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">السعر</div>
                    <div class="info-value">${service.price.toLocaleString('ar-SA')} ريال</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">الحالة</div>
                    <div class="info-value">${statusMap[service.status] || service.status}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">الوصف المختصر</div>
                    <div class="info-value">${service.shortDescription || '-'}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="row mt-4">
              <div class="col-12">
                <h4>الوصف التفصيلي</h4>
                <div class="service-description-full">
                  ${service.description || '-'}
                </div>
              </div>
            </div>
            
            ${service.features && service.features.length > 0 ? `
              <div class="row mt-4">
                <div class="col-12">
                  <h4>المميزات</h4>
                  <ul class="service-features-list">
                    ${service.features.map(feature => `<li>${feature}</li>`).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}
            
            ${service.requirements && service.requirements.length > 0 ? `
              <div class="row mt-4">
                <div class="col-12">
                  <h4>المتطلبات</h4>
                  <ul class="service-requirements-list">
                    ${service.requirements.map(requirement => `<li>${requirement}</li>`).join('')}
                  </ul>
                </div>
              </div>
            ` : ''}
          </div>
        `,
        footer: `
          <button type="button" class="btn btn-secondary" data-dismiss="modal">إغلاق</button>
          <button type="button" class="btn btn-primary edit-service-btn" data-id="${service._id}">تعديل</button>
        `
      });
      
      // Add event listener to edit button
      document.querySelector('.edit-service-btn').addEventListener('click', () => {
        ModalManager.hide();
        this.editService(serviceId);
      });
    } catch (error) {
      console.error('View service error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات الخدمة');
    }
  }
  
  async editService(serviceId) {
    try {
      this.app.showLoader();
      
      // Fetch service details
      const response = await ApiClient.get(`${this.apiBaseUrl}/services/${serviceId}`);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات الخدمة');
        return;
      }
      
      const service = response.data;
      
      // Show service edit modal
      this.showServiceModal(service);
    } catch (error) {
      console.error('Edit service error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات الخدمة');
    }
  }
  
  showServiceModal(service = null) {
    const isEdit = !!service;
    const title = isEdit ? 'تعديل بيانات الخدمة' : 'إضافة خدمة جديدة';
    
    // Prepare features and requirements fields
    let featuresFields = '';
    if (isEdit && service.features && service.features.length > 0) {
      service.features.forEach((feature, index) => {
        featuresFields += `
          <div class="feature-item input-group mb-2">
            <input type="text" class="form-control feature-input" value="${feature}" placeholder="أدخل ميزة">
            <div class="input-group-append">
              <button type="button" class="btn btn-danger remove-feature">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        `;
      });
    } else {
      featuresFields = `
        <div class="feature-item input-group mb-2">
          <input type="text" class="form-control feature-input" placeholder="أدخل ميزة">
          <div class="input-group-append">
            <button type="button" class="btn btn-danger remove-feature">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    }
    
    let requirementsFields = '';
    if (isEdit && service.requirements && service.requirements.length > 0) {
      service.requirements.forEach((requirement, index) => {
        requirementsFields += `
          <div class="requirement-item input-group mb-2">
            <input type="text" class="form-control requirement-input" value="${requirement}" placeholder="أدخل متطلب">
            <div class="input-group-append">
              <button type="button" class="btn btn-danger remove-requirement">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        `;
      });
    } else {
      requirementsFields = `
        <div class="requirement-item input-group mb-2">
          <input type="text" class="form-control requirement-input" placeholder="أدخل متطلب">
          <div class="input-group-append">
            <button type="button" class="btn btn-danger remove-requirement">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    }
    
    ModalManager.show({
      title: title,
      size: 'lg',
      body: `
        <form id="service-form">
          <div class="row">
            <div class="col-md-8">
              <div class="form-group">
                <label for="service-title">عنوان الخدمة <span class="text-danger">*</span></label>
                <input type="text" id="service-title" class="form-control" value="${isEdit ? service.title : ''}" required>
              </div>
            </div>
            <div class="col-md-4">
              <div class="form-group">
                <label for="service-price">السعر (ريال) <span class="text-danger">*</span></label>
                <input type="number" id="service-price" class="form-control" value="${isEdit ? service.price : ''}" min="0" step="0.01" required>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="service-category">التصنيف <span class="text-danger">*</span></label>
                <select id="service-category" class="form-control" required>
                  <option value="architectural" ${isEdit && service.category === 'architectural' ? 'selected' : ''}>التصاميم المعمارية والإنشائية</option>
                  <option value="roads" ${isEdit && service.category === 'roads' ? 'selected' : ''}>خدمات الطرق والبنية التحتية</option>
                  <option value="survey" ${isEdit && service.category === 'survey' ? 'selected' : ''}>خدمات الموقع المساحية</option>
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="service-status">الحالة <span class="text-danger">*</span></label>
                <select id="service-status" class="form-control" required>
                  <option value="active" ${isEdit && service.status === 'active' ? 'selected' : ''}>نشط</option>
                  <option value="inactive" ${isEdit && service.status === 'inactive' ? 'selected' : ''}>غير نشط</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="service-short-description">الوصف المختصر</label>
            <input type="text" id="service-short-description" class="form-control" value="${isEdit && service.shortDescription ? service.shortDescription : ''}" maxlength="150">
            <small class="form-text text-muted">الحد الأقصى 150 حرف</small>
          </div>
          
          <div class="form-group">
            <label for="service-description">الوصف التفصيلي</label>
            <textarea id="service-description" class="form-control" rows="5">${isEdit && service.description ? service.description : ''}</textarea>
          </div>
          
          <div class="form-group">
            <label for="service-image">صورة الخدمة</label>
            <div class="custom-file">
              <input type="file" class="custom-file-input" id="service-image" accept="image/*">
              <label class="custom-file-label" for="service-image">اختر صورة</label>
            </div>
            ${isEdit && service.image ? `
              <div class="image-preview mt-2">
                <img src="${service.image}" alt="${service.title}" class="img-thumbnail" style="max-height: 100px;">
              </div>
            ` : ''}
          </div>
          
          <div class="form-group">
            <label>المميزات</label>
            <div id="features-container">
              ${featuresFields}
            </div>
            <button type="button" class="btn btn-sm btn-success mt-2" id="add-feature-btn">
              <i class="fas fa-plus"></i> إضافة ميزة
            </button>
          </div>
          
          <div class="form-group">
            <label>المتطلبات</label>
            <div id="requirements-container">
              ${requirementsFields}
            </div>
            <button type="button" class="btn btn-sm btn-success mt-2" id="add-requirement-btn">
              <i class="fas fa-plus"></i> إضافة متطلب
            </button>
          </div>
          
          <div class="alert alert-danger mt-3" id="service-form-error" style="display: none;"></div>
        </form>
      `,
      footer: `
        <button type="button" class="btn btn-secondary" data-dismiss="modal">إلغاء</button>
        <button type="button" class="btn btn-primary" id="save-service-btn">حفظ</button>
      `
    });
    
    // Add event listener to save button
    document.getElementById('save-service-btn').addEventListener('click', () => {
      this.saveService(isEdit ? service._id : null);
    });
    
    // Add event listener to file input
    document.getElementById('service-image').addEventListener('change', (e) => {
      const fileName = e.target.files[0]?.name || 'اختر صورة';
      e.target.nextElementSibling.textContent = fileName;
    });
    
    // Add event listener to add feature button
    document.getElementById('add-feature-btn').addEventListener('click', () => {
      const featuresContainer = document.getElementById('features-container');
      const featureItem = document.createElement('div');
      featureItem.className = 'feature-item input-group mb-2';
      featureItem.innerHTML = `
        <input type="text" class="form-control feature-input" placeholder="أدخل ميزة">
        <div class="input-group-append">
          <button type="button" class="btn btn-danger remove-feature">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      featuresContainer.appendChild(featureItem);
      
      // Add event listener to remove button
      featureItem.querySelector('.remove-feature').addEventListener('click', () => {
        featuresContainer.removeChild(featureItem);
      });
    });
    
    // Add event listener to add requirement button
    document.getElementById('add-requirement-btn').addEventListener('click', () => {
      const requirementsContainer = document.getElementById('requirements-container');
      const requirementItem = document.createElement('div');
      requirementItem.className = 'requirement-item input-group mb-2';
      requirementItem.innerHTML = `
        <input type="text" class="form-control requirement-input" placeholder="أدخل متطلب">
        <div class="input-group-append">
          <button type="button" class="btn btn-danger remove-requirement">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;
      requirementsContainer.appendChild(requirementItem);
      
      // Add event listener to remove button
      requirementItem.querySelector('.remove-requirement').addEventListener('click', () => {
        requirementsContainer.removeChild(requirementItem);
      });
    });
    
    // Add event listeners to existing remove buttons
    document.querySelectorAll('.remove-feature').forEach(button => {
      button.addEventListener('click', () => {
        const featureItem = button.closest('.feature-item');
        featureItem.parentElement.removeChild(featureItem);
      });
    });
    
    document.querySelectorAll('.remove-requirement').forEach(button => {
      button.addEventListener('click', () => {
        const requirementItem = button.closest('.requirement-item');
        requirementItem.parentElement.removeChild(requirementItem);
      });
    });
  }
  
  async saveService(serviceId = null) {
    try {
      // Get form values
      const title = document.getElementById('service-title').value;
      const price = document.getElementById('service-price').value;
      const category = document.getElementById('service-category').value;
      const status = document.getElementById('service-status').value;
      const shortDescription = document.getElementById('service-short-description').value;
      const description = document.getElementById('service-description').value;
      const imageFile = document.getElementById('service-image').files[0];
      
      // Get features
      const features = [];
      document.querySelectorAll('.feature-input').forEach(input => {
        if (input.value.trim()) {
          features.push(input.value.trim());
        }
      });
      
      // Get requirements
      const requirements = [];
      document.querySelectorAll('.requirement-input').forEach(input => {
        if (input.value.trim()) {
          requirements.push(input.value.trim());
        }
      });
      
      // Validate form
      if (!title || !price || !category || !status) {
        document.getElementById('service-form-error').textContent = 'يرجى ملء جميع الحقول المطلوبة';
        document.getElementById('service-form-error').style.display = 'block';
        return;
      }
      
      // Disable save button
      const saveButton = document.getElementById('save-service-btn');
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      
      // Prepare form data
      const formData = new FormData();
      formData.append('title', title);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('status', status);
      formData.append('shortDescription', shortDescription);
      formData.append('description', description);
      
      // Add features and requirements
      features.forEach((feature, index) => {
        formData.append(`features[${index}]`, feature);
      });
      
      requirements.forEach((requirement, index) => {
        formData.append(`requirements[${index}]`, requirement);
      });
      
      // Add image if provided
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      // Send request
      let response;
      
      if (serviceId) {
        // Update service
        response = await ApiClient.uploadFile(`${this.apiBaseUrl}/services/${serviceId}`, formData);
      } else {
        // Create service
        response = await ApiClient.uploadFile(`${this.apiBaseUrl}/services`, formData);
      }
      
      // Enable save button
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
      
      if (!response.success) {
        document.getElementById('service-form-error').textContent = response.message || 'فشل حفظ بيانات الخدمة';
        document.getElementById('service-form-error').style.display = 'block';
        return;
      }
      
      // Hide modal
      ModalManager.hide();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', serviceId ? 'تم تحديث بيانات الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح');
      
      // Reload services
      this.loadServices();
    } catch (error) {
      console.error('Save service error:', error);
      document.getElementById('service-form-error').textContent = 'حدث خطأ أثناء حفظ بيانات الخدمة';
      document.getElementById('service-form-error').style.display = 'block';
      
      // Enable save button
      const saveButton = document.getElementById('save-service-btn');
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
    }
  }
  
  deleteService(serviceId) {
    // Show confirmation dialog
    ModalManager.confirm(
      'حذف الخدمة',
      'هل أنت متأكد من رغبتك في حذف هذه الخدمة؟ لا يمكن التراجع عن هذا الإجراء.',
      async () => {
        try {
          this.app.showLoader();
          
          // Send delete request
          const response = await ApiClient.delete(`${this.apiBaseUrl}/services/${serviceId}`);
          
          this.app.hideLoader();
          
          if (!response.success) {
            this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل حذف الخدمة');
            return;
          }
          
          // Show success notification
          this.app.ui.notifications.show('success', 'تم بنجاح', 'تم حذف الخدمة بنجاح');
          
          // Reload services
          this.loadServices();
        } catch (error) {
          console.error('Delete service error:', error);
          this.app.hideLoader();
          this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء حذف الخدمة');
        }
      }
    );
  }
}
