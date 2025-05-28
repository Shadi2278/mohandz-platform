// Projects Controller for Mohandz Admin Dashboard
// Handles project management operations

class ProjectsController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
    this.mainContent = app.ui.mainContent;
    this.currentUser = app.currentUser;
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalProjects = 0;
    this.totalPages = 0;
    this.filters = {
      search: '',
      status: '',
      client: '',
      dateFrom: '',
      dateTo: ''
    };
    this.selectedProject = null;
  }
  
  async init() {
    try {
      // Render projects template
      this.renderProjectsTemplate();
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Check if there's a project to show (from dashboard)
      document.addEventListener('show-project', (event) => {
        if (event.detail && event.detail.id) {
          this.viewProject(event.detail.id);
        }
      });
      
      // Load projects data
      await this.loadProjects();
      
      // Hide loader
      this.app.hideLoader();
    } catch (error) {
      console.error('Projects initialization error:', error);
      this.mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل بيانات المشاريع
        </div>
      `;
      this.app.hideLoader();
    }
  }
  
  renderProjectsTemplate() {
    this.mainContent.innerHTML = `
      <div class="projects-container">
        <div class="page-header">
          <div>
            <h1><i class="fas fa-project-diagram"></i> إدارة المشاريع</h1>
            <p>إدارة المشاريع الهندسية</p>
          </div>
          <div>
            <button id="add-project-btn" class="btn btn-primary">
              <i class="fas fa-plus"></i> إضافة مشروع
            </button>
            <button id="export-projects-btn" class="btn btn-success">
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
                    <input type="text" id="search-input" class="form-control" placeholder="اسم المشروع أو العميل">
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="status-filter">الحالة</label>
                    <select id="status-filter" class="form-control">
                      <option value="">الكل</option>
                      <option value="planning">التخطيط</option>
                      <option value="in_progress">قيد التنفيذ</option>
                      <option value="review">المراجعة</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
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
                <div class="col-md-2">
                  <div class="form-group mt-4">
                    <button id="apply-filters-btn" class="btn btn-primary btn-block">
                      <i class="fas fa-filter"></i> تطبيق
                    </button>
                  </div>
                </div>
              </div>
              <div class="row">
                <div class="col-md-12 text-right">
                  <button id="reset-filters-btn" class="btn btn-secondary">
                    <i class="fas fa-undo"></i> إعادة تعيين
                  </button>
                </div>
              </div>
            </div>
            
            <div class="table-responsive">
              <table id="projects-table" class="table table-hover">
                <thead>
                  <tr>
                    <th>اسم المشروع</th>
                    <th>العميل</th>
                    <th>نوع المشروع</th>
                    <th>الحالة</th>
                    <th>تاريخ البدء</th>
                    <th>تاريخ الانتهاء</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody id="projects-table-body">
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
                    عرض <span id="pagination-start">0</span> إلى <span id="pagination-end">0</span> من <span id="pagination-total">0</span> مشروع
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
    // Add project button
    document.getElementById('add-project-btn').addEventListener('click', () => {
      this.showAddProjectModal();
    });
    
    // Apply filters button
    document.getElementById('apply-filters-btn').addEventListener('click', () => {
      this.applyFilters();
    });
    
    // Reset filters button
    document.getElementById('reset-filters-btn').addEventListener('click', () => {
      this.resetFilters();
    });
    
    // Export projects button
    document.getElementById('export-projects-btn').addEventListener('click', () => {
      this.exportProjects();
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
        this.loadProjects();
      }
    });
    
    // Pagination next button
    document.getElementById('pagination-next').addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadProjects();
      }
    });
  }
  
  applyFilters() {
    this.filters.search = document.getElementById('search-input').value;
    this.filters.status = document.getElementById('status-filter').value;
    this.filters.dateFrom = document.getElementById('date-from').value;
    this.filters.dateTo = document.getElementById('date-to').value;
    this.currentPage = 1;
    this.loadProjects();
  }
  
  resetFilters() {
    document.getElementById('search-input').value = '';
    document.getElementById('status-filter').value = '';
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    
    this.filters = {
      search: '',
      status: '',
      client: '',
      dateFrom: '',
      dateTo: ''
    };
    
    this.currentPage = 1;
    this.loadProjects();
  }
  
  async loadProjects() {
    try {
      // Show table loader
      document.getElementById('projects-table-body').innerHTML = `
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
      
      if (this.filters.client) {
        params.client = this.filters.client;
      }
      
      if (this.filters.dateFrom) {
        params.dateFrom = this.filters.dateFrom;
      }
      
      if (this.filters.dateTo) {
        params.dateTo = this.filters.dateTo;
      }
      
      // Fetch projects
      const response = await ApiClient.get(`${this.apiBaseUrl}/projects`, params);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل تحميل بيانات المشاريع');
      }
      
      // Update pagination info
      this.totalProjects = response.pagination.total;
      this.totalPages = response.pagination.pages;
      
      // Update pagination UI
      this.updatePaginationUI();
      
      // Render projects table
      this.renderProjectsTable(response.data);
    } catch (error) {
      console.error('Load projects error:', error);
      document.getElementById('projects-table-body').innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">
            <i class="fas fa-exclamation-circle"></i>
            حدث خطأ أثناء تحميل بيانات المشاريع
          </td>
        </tr>
      `;
    }
  }
  
  updatePaginationUI() {
    // Update pagination info
    const start = this.totalProjects === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalProjects);
    
    document.getElementById('pagination-start').textContent = start;
    document.getElementById('pagination-end').textContent = end;
    document.getElementById('pagination-total').textContent = this.totalProjects;
    
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
        this.loadProjects();
      });
      
      pageItem.appendChild(pageLink);
      pagination.insertBefore(pageItem, nextPageItem);
    }
  }
  
  renderProjectsTable(projects) {
    const tableBody = document.getElementById('projects-table-body');
    
    if (!projects || projects.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">لا توجد مشاريع</td>
        </tr>
      `;
      return;
    }
    
    // Map status to Arabic labels and badge classes
    const statusMap = {
      'planning': { label: 'التخطيط', class: 'badge-info' },
      'in_progress': { label: 'قيد التنفيذ', class: 'badge-warning' },
      'review': { label: 'المراجعة', class: 'badge-primary' },
      'completed': { label: 'مكتمل', class: 'badge-success' },
      'cancelled': { label: 'ملغي', class: 'badge-danger' }
    };
    
    // Generate table rows
    let html = '';
    
    projects.forEach(project => {
      const status = statusMap[project.status] || { label: project.status, class: 'badge-secondary' };
      const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString('ar-SA') : '-';
      const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString('ar-SA') : '-';
      
      html += `
        <tr>
          <td>${project.name || '-'}</td>
          <td>${project.client ? project.client.name : '-'}</td>
          <td>${project.type || '-'}</td>
          <td><span class="badge ${status.class}">${status.label}</span></td>
          <td>${startDate}</td>
          <td>${endDate}</td>
          <td>
            <div class="actions">
              <button class="btn btn-sm btn-info view-project" data-id="${project._id}" title="عرض">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-primary edit-project" data-id="${project._id}" title="تعديل">
                <i class="fas fa-edit"></i>
              </button>
              ${project.status !== 'completed' && project.status !== 'cancelled' ? `
                <button class="btn btn-sm btn-danger delete-project" data-id="${project._id}" title="حذف">
                  <i class="fas fa-trash"></i>
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    });
    
    tableBody.innerHTML = html;
    
    // Add event listeners to action buttons
    tableBody.querySelectorAll('.view-project').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = button.getAttribute('data-id');
        this.viewProject(projectId);
      });
    });
    
    tableBody.querySelectorAll('.edit-project').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = button.getAttribute('data-id');
        this.editProject(projectId);
      });
    });
    
    tableBody.querySelectorAll('.delete-project').forEach(button => {
      button.addEventListener('click', () => {
        const projectId = button.getAttribute('data-id');
        this.deleteProject(projectId);
      });
    });
  }
  
  async viewProject(projectId) {
    try {
      this.app.showLoader();
      
      // Fetch project details
      const response = await ApiClient.get(`${this.apiBaseUrl}/projects/${projectId}`);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات المشروع');
        return;
      }
      
      const project = response.data;
      this.selectedProject = project;
      
      // Map status to Arabic labels and badge classes
      const statusMap = {
        'planning': { label: 'التخطيط', class: 'badge-info' },
        'in_progress': { label: 'قيد التنفيذ', class: 'badge-warning' },
        'review': { label: 'المراجعة', class: 'badge-primary' },
        'completed': { label: 'مكتمل', class: 'badge-success' },
        'cancelled': { label: 'ملغي', class: 'badge-danger' }
      };
      
      const status = statusMap[project.status] || { label: project.status, class: 'badge-secondary' };
      
      // Format dates
      const startDate = project.startDate ? new Date(project.startDate).toLocaleDateString('ar-SA') : '-';
      const endDate = project.endDate ? new Date(project.endDate).toLocaleDateString('ar-SA') : '-';
      const createdDate = new Date(project.createdAt).toLocaleDateString('ar-SA');
      const updatedDate = new Date(project.updatedAt).toLocaleDateString('ar-SA');
      
      // Calculate progress
      const progress = project.progress || 0;
      
      // Show project details modal
      ModalManager.show({
        title: `تفاصيل المشروع: ${project.name}`,
        size: 'lg',
        body: `
          <div class="project-details-container">
            <div class="row">
              <div class="col-md-6">
                <div class="card">
                  <div class="card-header">
                    <h5>معلومات المشروع</h5>
                  </div>
                  <div class="card-body">
                    <div class="info-list">
                      <div class="info-item">
                        <div class="info-label">اسم المشروع</div>
                        <div class="info-value">${project.name || '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">نوع المشروع</div>
                        <div class="info-value">${project.type || '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">الحالة</div>
                        <div class="info-value"><span class="badge ${status.class}">${status.label}</span></div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">تاريخ البدء</div>
                        <div class="info-value">${startDate}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">تاريخ الانتهاء</div>
                        <div class="info-value">${endDate}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">تاريخ الإنشاء</div>
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
                        <div class="info-label">اسم العميل</div>
                        <div class="info-value">${project.client ? project.client.name : '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">البريد الإلكتروني</div>
                        <div class="info-value">${project.client ? project.client.email : '-'}</div>
                      </div>
                      <div class="info-item">
                        <div class="info-label">رقم الهاتف</div>
                        <div class="info-value">${project.client && project.client.phone ? project.client.phone : '-'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="card mt-3">
                  <div class="card-header">
                    <h5>التقدم</h5>
                  </div>
                  <div class="card-body">
                    <div class="progress-container">
                      <div class="progress-label">
                        <span>نسبة الإنجاز</span>
                        <span>${progress}%</span>
                      </div>
                      <div class="progress">
                        <div class="progress-bar bg-success" role="progressbar" style="width: ${progress}%" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"></div>
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
                    <h5>وصف المشروع</h5>
                  </div>
                  <div class="card-body">
                    <div class="project-description">
                      ${project.description || 'لا يوجد وصف للمشروع'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            ${project.tasks && project.tasks.length > 0 ? `
              <div class="row mt-4">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h5>المهام</h5>
                    </div>
                    <div class="card-body">
                      <div class="table-responsive">
                        <table class="table table-hover">
                          <thead>
                            <tr>
                              <th>المهمة</th>
                              <th>الحالة</th>
                              <th>تاريخ البدء</th>
                              <th>تاريخ الانتهاء</th>
                              <th>المسؤول</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${project.tasks.map(task => {
                              const taskStatus = statusMap[task.status] || { label: task.status, class: 'badge-secondary' };
                              const taskStartDate = task.startDate ? new Date(task.startDate).toLocaleDateString('ar-SA') : '-';
                              const taskEndDate = task.endDate ? new Date(task.endDate).toLocaleDateString('ar-SA') : '-';
                              
                              return `
                                <tr>
                                  <td>${task.name}</td>
                                  <td><span class="badge ${taskStatus.class}">${taskStatus.label}</span></td>
                                  <td>${taskStartDate}</td>
                                  <td>${taskEndDate}</td>
                                  <td>${task.assignedTo || '-'}</td>
                                </tr>
                              `;
                            }).join('')}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            ${project.files && project.files.length > 0 ? `
              <div class="row mt-4">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h5>الملفات</h5>
                    </div>
                    <div class="card-body">
                      <div class="files-list">
                        ${project.files.map(file => `
                          <div class="file-item">
                            <a href="${file.url}" target="_blank" class="file-link">
                              <i class="fas fa-file"></i>
                              <span>${file.name}</span>
                            </a>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ` : ''}
            
            ${project.notes && project.notes.length > 0 ? `
              <div class="row mt-4">
                <div class="col-12">
                  <div class="card">
                    <div class="card-header">
                      <h5>الملاحظات</h5>
                    </div>
                    <div class="card-body">
                      <div class="notes-list">
                        ${project.notes.map(note => `
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
          <button type="button" class="btn btn-primary edit-project-btn" data-id="${project._id}">تعديل</button>
          ${project.status !== 'completed' ? `
            <button type="button" class="btn btn-success update-status-btn" data-id="${project._id}">تحديث الحالة</button>
          ` : ''}
          ${project.status !== 'completed' && project.status !== 'cancelled' ? `
            <button type="button" class="btn btn-danger delete-project-btn" data-id="${project._id}">حذف</button>
          ` : ''}
        `
      });
      
      // Add event listeners to buttons
      document.querySelector('.edit-project-btn').addEventListener('click', () => {
        ModalManager.hide();
        this.editProject(projectId);
      });
      
      const updateStatusBtn = document.querySelector('.update-status-btn');
      if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', () => {
          this.showUpdateStatusModal(projectId);
        });
      }
      
      const deleteProjectBtn = document.querySelector('.delete-project-btn');
      if (deleteProjectBtn) {
        deleteProjectBtn.addEventListener('click', () => {
          ModalManager.hide();
          this.deleteProject(projectId);
        });
      }
    } catch (error) {
      console.error('View project error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات المشروع');
    }
  }
  
  showAddProjectModal() {
    // Show add project modal
    ModalManager.show({
      title: 'إضافة مشروع جديد',
      size: 'lg',
      body: `
        <form id="add-project-form">
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="project-name">اسم المشروع <span class="text-danger">*</span></label>
                <input type="text" id="project-name" class="form-control" required>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="project-type">نوع المشروع <span class="text-danger">*</span></label>
                <select id="project-type" class="form-control" required>
                  <option value="">اختر نوع المشروع</option>
                  <option value="architectural">تصميم معماري</option>
                  <option value="structural">تصميم إنشائي</option>
                  <option value="mep">تصميم MEP</option>
                  <option value="comprehensive">تصميم شامل</option>
                  <option value="road">تصميم طرق</option>
                  <option value="survey">خدمات مساحية</option>
                  <option value="other">أخرى</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="project-client">العميل <span class="text-danger">*</span></label>
                <select id="project-client" class="form-control" required>
                  <option value="">اختر العميل</option>
                  <!-- Will be populated dynamically -->
                </select>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="project-status">الحالة <span class="text-danger">*</span></label>
                <select id="project-status" class="form-control" required>
                  <option value="planning">التخطيط</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="review">المراجعة</option>
                  <option value="completed">مكتمل</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="project-start-date">تاريخ البدء <span class="text-danger">*</span></label>
                <input type="date" id="project-start-date" class="form-control" required>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="project-end-date">تاريخ الانتهاء المتوقع</label>
                <input type="date" id="project-end-date" class="form-control">
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="project-description">وصف المشروع</label>
            <textarea id="project-description" class="form-control" rows="4"></textarea>
          </div>
          
          <div class="form-group">
            <label for="project-progress">نسبة الإنجاز (%)</label>
            <input type="range" id="project-progress" class="form-control-range" min="0" max="100" value="0">
            <div class="progress mt-2">
              <div id="progress-bar" class="progress-bar bg-success" role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
            </div>
          </div>
          
          <div class="alert alert-danger mt-3" id="add-project-error" style="display: none;"></div>
        </form>
      `,
      footer: `
        <button type="button" class="btn btn-secondary" data-dismiss="modal">إلغاء</button>
        <button type="button" class="btn btn-primary" id="save-project-btn">حفظ</button>
      `
    });
    
    // Load clients for dropdown
    this.loadClientsForDropdown();
    
    // Add event listener to progress range
    document.getElementById('project-progress').addEventListener('input', (e) => {
      const progress = e.target.value;
      document.getElementById('progress-bar').style.width = `${progress}%`;
      document.getElementById('progress-bar').setAttribute('aria-valuenow', progress);
      document.getElementById('progress-bar').textContent = `${progress}%`;
    });
    
    // Add event listener to save button
    document.getElementById('save-project-btn').addEventListener('click', () => {
      this.saveNewProject();
    });
  }
  
  async loadClientsForDropdown() {
    try {
      // Fetch clients
      const response = await ApiClient.get(`${this.apiBaseUrl}/users`, { role: 'client', limit: 100 });
      
      if (!response.success) {
        console.error('Failed to load clients for dropdown:', response.message);
        return;
      }
      
      // Populate client dropdown
      const clientDropdown = document.getElementById('project-client');
      const clients = response.data;
      
      clients.forEach(client => {
        const option = document.createElement('option');
        option.value = client._id;
        option.textContent = client.name;
        clientDropdown.appendChild(option);
      });
    } catch (error) {
      console.error('Load clients for dropdown error:', error);
    }
  }
  
  async saveNewProject() {
    try {
      // Get form values
      const name = document.getElementById('project-name').value;
      const type = document.getElementById('project-type').value;
      const clientId = document.getElementById('project-client').value;
      const status = document.getElementById('project-status').value;
      const startDate = document.getElementById('project-start-date').value;
      const endDate = document.getElementById('project-end-date').value;
      const description = document.getElementById('project-description').value;
      const progress = document.getElementById('project-progress').value;
      
      // Validate form
      if (!name || !type || !clientId || !status || !startDate) {
        document.getElementById('add-project-error').textContent = 'يرجى ملء جميع الحقول المطلوبة';
        document.getElementById('add-project-error').style.display = 'block';
        return;
      }
      
      // Disable save button
      const saveButton = document.getElementById('save-project-btn');
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      
      // Prepare data
      const data = {
        name,
        type,
        client: clientId,
        status,
        startDate,
        progress: parseInt(progress)
      };
      
      // Add optional fields
      if (endDate) {
        data.endDate = endDate;
      }
      
      if (description) {
        data.description = description;
      }
      
      // Send request
      const response = await ApiClient.post(`${this.apiBaseUrl}/projects`, data);
      
      // Enable save button
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
      
      if (!response.success) {
        document.getElementById('add-project-error').textContent = response.message || 'فشل إضافة المشروع';
        document.getElementById('add-project-error').style.display = 'block';
        return;
      }
      
      // Hide modal
      ModalManager.hide();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم إضافة المشروع بنجاح');
      
      // Reload projects
      this.loadProjects();
    } catch (error) {
      console.error('Save new project error:', error);
      document.getElementById('add-project-error').textContent = 'حدث خطأ أثناء إضافة المشروع';
      document.getElementById('add-project-error').style.display = 'block';
      
      // Enable save button
      const saveButton = document.getElementById('save-project-btn');
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
    }
  }
  
  async editProject(projectId) {
    try {
      this.app.showLoader();
      
      // Fetch project details if not already loaded
      if (!this.selectedProject || this.selectedProject._id !== projectId) {
        const response = await ApiClient.get(`${this.apiBaseUrl}/projects/${projectId}`);
        
        if (!response.success) {
          this.app.hideLoader();
          this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات المشروع');
          return;
        }
        
        this.selectedProject = response.data;
      }
      
      const project = this.selectedProject;
      
      // Fetch clients for dropdown
      const clientsResponse = await ApiClient.get(`${this.apiBaseUrl}/users`, { role: 'client', limit: 100 });
      
      this.app.hideLoader();
      
      if (!clientsResponse.success) {
        this.app.ui.notifications.show('error', 'خطأ', 'فشل تحميل بيانات العملاء');
        return;
      }
      
      const clients = clientsResponse.data;
      
      // Generate clients options
      let clientsOptions = '<option value="">اختر العميل</option>';
      clients.forEach(client => {
        clientsOptions += `<option value="${client._id}" ${project.client && project.client._id === client._id ? 'selected' : ''}>${client.name}</option>`;
      });
      
      // Format dates for input fields
      const startDate = project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '';
      const endDate = project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '';
      
      // Show edit project modal
      ModalManager.show({
        title: `تعديل المشروع: ${project.name}`,
        size: 'lg',
        body: `
          <form id="edit-project-form">
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="project-name">اسم المشروع <span class="text-danger">*</span></label>
                  <input type="text" id="project-name" class="form-control" value="${project.name || ''}" required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="project-type">نوع المشروع <span class="text-danger">*</span></label>
                  <select id="project-type" class="form-control" required>
                    <option value="">اختر نوع المشروع</option>
                    <option value="architectural" ${project.type === 'architectural' ? 'selected' : ''}>تصميم معماري</option>
                    <option value="structural" ${project.type === 'structural' ? 'selected' : ''}>تصميم إنشائي</option>
                    <option value="mep" ${project.type === 'mep' ? 'selected' : ''}>تصميم MEP</option>
                    <option value="comprehensive" ${project.type === 'comprehensive' ? 'selected' : ''}>تصميم شامل</option>
                    <option value="road" ${project.type === 'road' ? 'selected' : ''}>تصميم طرق</option>
                    <option value="survey" ${project.type === 'survey' ? 'selected' : ''}>خدمات مساحية</option>
                    <option value="other" ${project.type === 'other' ? 'selected' : ''}>أخرى</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="project-client">العميل <span class="text-danger">*</span></label>
                  <select id="project-client" class="form-control" required>
                    ${clientsOptions}
                  </select>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="project-status">الحالة <span class="text-danger">*</span></label>
                  <select id="project-status" class="form-control" required>
                    <option value="planning" ${project.status === 'planning' ? 'selected' : ''}>التخطيط</option>
                    <option value="in_progress" ${project.status === 'in_progress' ? 'selected' : ''}>قيد التنفيذ</option>
                    <option value="review" ${project.status === 'review' ? 'selected' : ''}>المراجعة</option>
                    <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>مكتمل</option>
                    <option value="cancelled" ${project.status === 'cancelled' ? 'selected' : ''}>ملغي</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <label for="project-start-date">تاريخ البدء <span class="text-danger">*</span></label>
                  <input type="date" id="project-start-date" class="form-control" value="${startDate}" required>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <label for="project-end-date">تاريخ الانتهاء المتوقع</label>
                  <input type="date" id="project-end-date" class="form-control" value="${endDate}">
                </div>
              </div>
            </div>
            
            <div class="form-group">
              <label for="project-description">وصف المشروع</label>
              <textarea id="project-description" class="form-control" rows="4">${project.description || ''}</textarea>
            </div>
            
            <div class="form-group">
              <label for="project-progress">نسبة الإنجاز (%)</label>
              <input type="range" id="project-progress" class="form-control-range" min="0" max="100" value="${project.progress || 0}">
              <div class="progress mt-2">
                <div id="progress-bar" class="progress-bar bg-success" role="progressbar" style="width: ${project.progress || 0}%" aria-valuenow="${project.progress || 0}" aria-valuemin="0" aria-valuemax="100">${project.progress || 0}%</div>
              </div>
            </div>
            
            <div class="form-group">
              <label>إضافة ملاحظة جديدة</label>
              <textarea id="project-new-note" class="form-control" rows="3" placeholder="أدخل ملاحظة جديدة هنا..."></textarea>
            </div>
            
            <div class="alert alert-danger mt-3" id="edit-project-error" style="display: none;"></div>
          </form>
        `,
        footer: `
          <button type="button" class="btn btn-secondary" data-dismiss="modal">إلغاء</button>
          <button type="button" class="btn btn-primary" id="update-project-btn">حفظ</button>
        `
      });
      
      // Add event listener to progress range
      document.getElementById('project-progress').addEventListener('input', (e) => {
        const progress = e.target.value;
        document.getElementById('progress-bar').style.width = `${progress}%`;
        document.getElementById('progress-bar').setAttribute('aria-valuenow', progress);
        document.getElementById('progress-bar').textContent = `${progress}%`;
      });
      
      // Add event listener to save button
      document.getElementById('update-project-btn').addEventListener('click', () => {
        this.updateProject(projectId);
      });
    } catch (error) {
      console.error('Edit project error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات المشروع');
    }
  }
  
  async updateProject(projectId) {
    try {
      // Get form values
      const name = document.getElementById('project-name').value;
      const type = document.getElementById('project-type').value;
      const clientId = document.getElementById('project-client').value;
      const status = document.getElementById('project-status').value;
      const startDate = document.getElementById('project-start-date').value;
      const endDate = document.getElementById('project-end-date').value;
      const description = document.getElementById('project-description').value;
      const progress = document.getElementById('project-progress').value;
      const newNote = document.getElementById('project-new-note').value;
      
      // Validate form
      if (!name || !type || !clientId || !status || !startDate) {
        document.getElementById('edit-project-error').textContent = 'يرجى ملء جميع الحقول المطلوبة';
        document.getElementById('edit-project-error').style.display = 'block';
        return;
      }
      
      // Disable update button
      const updateButton = document.getElementById('update-project-btn');
      updateButton.disabled = true;
      updateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      
      // Prepare data
      const data = {
        name,
        type,
        client: clientId,
        status,
        startDate,
        progress: parseInt(progress)
      };
      
      // Add optional fields
      if (endDate) {
        data.endDate = endDate;
      }
      
      if (description) {
        data.description = description;
      }
      
      // Add new note if provided
      if (newNote.trim()) {
        data.note = newNote.trim();
      }
      
      // Send request
      const response = await ApiClient.put(`${this.apiBaseUrl}/projects/${projectId}`, data);
      
      // Enable update button
      updateButton.disabled = false;
      updateButton.innerHTML = 'حفظ';
      
      if (!response.success) {
        document.getElementById('edit-project-error').textContent = response.message || 'فشل تحديث بيانات المشروع';
        document.getElementById('edit-project-error').style.display = 'block';
        return;
      }
      
      // Hide modal
      ModalManager.hide();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم تحديث بيانات المشروع بنجاح');
      
      // Reload projects
      this.loadProjects();
    } catch (error) {
      console.error('Update project error:', error);
      document.getElementById('edit-project-error').textContent = 'حدث خطأ أثناء تحديث بيانات المشروع';
      document.getElementById('edit-project-error').style.display = 'block';
      
      // Enable update button
      const updateButton = document.getElementById('update-project-btn');
      updateButton.disabled = false;
      updateButton.innerHTML = 'حفظ';
    }
  }
  
  showUpdateStatusModal(projectId) {
    // Get current status
    const currentStatus = this.selectedProject.status;
    
    // Determine available next statuses based on current status
    let statusOptions = '';
    
    if (currentStatus === 'planning') {
      statusOptions = `
        <option value="in_progress">قيد التنفيذ</option>
        <option value="cancelled">ملغي</option>
      `;
    } else if (currentStatus === 'in_progress') {
      statusOptions = `
        <option value="review">المراجعة</option>
        <option value="cancelled">ملغي</option>
      `;
    } else if (currentStatus === 'review') {
      statusOptions = `
        <option value="completed">مكتمل</option>
        <option value="in_progress">قيد التنفيذ</option>
        <option value="cancelled">ملغي</option>
      `;
    } else {
      statusOptions = `
        <option value="${currentStatus}" selected>لا يمكن تغيير الحالة</option>
      `;
    }
    
    // Show update status modal
    ModalManager.show({
      title: 'تحديث حالة المشروع',
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
      this.updateProjectStatus(projectId);
    });
  }
  
  async updateProjectStatus(projectId) {
    try {
      // Get form values
      const status = document.getElementById('new-status').value;
      const note = document.getElementById('status-note').value;
      
      // Validate form
      if (!status || status === this.selectedProject.status) {
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
      const response = await ApiClient.put(`${this.apiBaseUrl}/projects/${projectId}/status`, data);
      
      // Enable update button
      updateButton.disabled = false;
      updateButton.innerHTML = 'تحديث';
      
      if (!response.success) {
        document.getElementById('update-status-error').textContent = response.message || 'فشل تحديث حالة المشروع';
        document.getElementById('update-status-error').style.display = 'block';
        return;
      }
      
      // Hide modals
      ModalManager.hideAll();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم تحديث حالة المشروع بنجاح');
      
      // Reload projects
      this.loadProjects();
    } catch (error) {
      console.error('Update project status error:', error);
      document.getElementById('update-status-error').textContent = 'حدث خطأ أثناء تحديث حالة المشروع';
      document.getElementById('update-status-error').style.display = 'block';
      
      // Enable update button
      const updateButton = document.getElementById('update-status-btn');
      updateButton.disabled = false;
      updateButton.innerHTML = 'تحديث';
    }
  }
  
  deleteProject(projectId) {
    // Show confirmation dialog
    ModalManager.confirm(
      'حذف المشروع',
      'هل أنت متأكد من رغبتك في حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء.',
      async () => {
        try {
          this.app.showLoader();
          
          // Send delete request
          const response = await ApiClient.delete(`${this.apiBaseUrl}/projects/${projectId}`);
          
          this.app.hideLoader();
          
          if (!response.success) {
            this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل حذف المشروع');
            return;
          }
          
          // Show success notification
          this.app.ui.notifications.show('success', 'تم بنجاح', 'تم حذف المشروع بنجاح');
          
          // Reload projects
          this.loadProjects();
        } catch (error) {
          console.error('Delete project error:', error);
          this.app.hideLoader();
          this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء حذف المشروع');
        }
      }
    );
  }
  
  async exportProjects() {
    try {
      this.app.showLoader();
      
      // Prepare query parameters (use current filters)
      const params = { ...this.filters, export: true };
      
      // Send export request
      const response = await ApiClient.get(`${this.apiBaseUrl}/projects/export`, params);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تصدير المشاريع');
        return;
      }
      
      // Create download link
      const url = response.data.url;
      const filename = response.data.filename || 'projects-export.csv';
      
      // Download file
      ApiClient.downloadFile(url, filename);
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم تصدير المشاريع بنجاح');
    } catch (error) {
      console.error('Export projects error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تصدير المشاريع');
    }
  }
}
