// Users Controller for Mohandz Admin Dashboard
// Handles user management operations

class UsersController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
    this.mainContent = app.ui.mainContent;
    this.currentUser = app.currentUser;
    this.dataTable = null;
    this.currentPage = 1;
    this.pageSize = 10;
    this.totalUsers = 0;
    this.totalPages = 0;
    this.filters = {
      search: '',
      role: '',
      status: ''
    };
  }
  
  async init() {
    try {
      // Render users template
      this.renderUsersTemplate();
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Load users data
      await this.loadUsers();
      
      // Hide loader
      this.app.hideLoader();
    } catch (error) {
      console.error('Users initialization error:', error);
      this.mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل بيانات المستخدمين
        </div>
      `;
      this.app.hideLoader();
    }
  }
  
  renderUsersTemplate() {
    this.mainContent.innerHTML = `
      <div class="users-container">
        <div class="page-header">
          <div>
            <h1><i class="fas fa-users"></i> إدارة المستخدمين</h1>
            <p>إدارة حسابات المستخدمين والصلاحيات</p>
          </div>
          <div>
            <button id="add-user-btn" class="btn btn-primary">
              <i class="fas fa-plus"></i> إضافة مستخدم
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
                    <input type="text" id="search-input" class="form-control" placeholder="بحث بالاسم أو البريد الإلكتروني أو رقم الهاتف">
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="form-group">
                    <label for="role-filter">الدور</label>
                    <select id="role-filter" class="form-control">
                      <option value="">الكل</option>
                      <option value="admin">مدير</option>
                      <option value="editor">محرر</option>
                      <option value="client">عميل</option>
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
                      <option value="blocked">محظور</option>
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
            
            <div class="table-responsive">
              <table id="users-table" class="table table-hover">
                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>البريد الإلكتروني</th>
                    <th>رقم الهاتف</th>
                    <th>الدور</th>
                    <th>الحالة</th>
                    <th>تاريخ التسجيل</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody id="users-table-body">
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
                    عرض <span id="pagination-start">0</span> إلى <span id="pagination-end">0</span> من <span id="pagination-total">0</span> مستخدم
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
    // Add user button
    document.getElementById('add-user-btn').addEventListener('click', () => {
      this.showUserModal();
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
        this.loadUsers();
      }
    });
    
    // Pagination next button
    document.getElementById('pagination-next').addEventListener('click', (e) => {
      e.preventDefault();
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadUsers();
      }
    });
  }
  
  applyFilters() {
    this.filters.search = document.getElementById('search-input').value;
    this.filters.role = document.getElementById('role-filter').value;
    this.filters.status = document.getElementById('status-filter').value;
    this.currentPage = 1;
    this.loadUsers();
  }
  
  async loadUsers() {
    try {
      // Show table loader
      document.getElementById('users-table-body').innerHTML = `
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
      
      if (this.filters.role) {
        params.role = this.filters.role;
      }
      
      if (this.filters.status) {
        params.status = this.filters.status;
      }
      
      // Fetch users
      const response = await ApiClient.get(`${this.apiBaseUrl}/users`, params);
      
      if (!response.success) {
        throw new Error(response.message || 'فشل تحميل بيانات المستخدمين');
      }
      
      // Update pagination info
      this.totalUsers = response.pagination.total;
      this.totalPages = response.pagination.pages;
      
      // Update pagination UI
      this.updatePaginationUI();
      
      // Render users table
      this.renderUsersTable(response.data);
    } catch (error) {
      console.error('Load users error:', error);
      document.getElementById('users-table-body').innerHTML = `
        <tr>
          <td colspan="7" class="text-center text-danger">
            <i class="fas fa-exclamation-circle"></i>
            حدث خطأ أثناء تحميل بيانات المستخدمين
          </td>
        </tr>
      `;
    }
  }
  
  updatePaginationUI() {
    // Update pagination info
    const start = this.totalUsers === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalUsers);
    
    document.getElementById('pagination-start').textContent = start;
    document.getElementById('pagination-end').textContent = end;
    document.getElementById('pagination-total').textContent = this.totalUsers;
    
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
        this.loadUsers();
      });
      
      pageItem.appendChild(pageLink);
      pagination.insertBefore(pageItem, nextPageItem);
    }
  }
  
  renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    
    if (!users || users.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center">لا يوجد مستخدمين</td>
        </tr>
      `;
      return;
    }
    
    // Map role to Arabic labels
    const roleMap = {
      'admin': 'مدير',
      'editor': 'محرر',
      'client': 'عميل'
    };
    
    // Map status to Arabic labels and badge classes
    const statusMap = {
      'active': { label: 'نشط', class: 'badge-success' },
      'inactive': { label: 'غير نشط', class: 'badge-secondary' },
      'blocked': { label: 'محظور', class: 'badge-danger' }
    };
    
    // Generate table rows
    let html = '';
    
    users.forEach(user => {
      const role = roleMap[user.role] || user.role;
      const status = statusMap[user.status] || { label: user.status, class: 'badge-secondary' };
      const date = new Date(user.createdAt).toLocaleDateString('ar-SA');
      
      html += `
        <tr>
          <td>
            <div class="user-info">
              <div class="user-avatar">
                <img src="${user.avatar || '/admin/dashboard/img/default-avatar.png'}" alt="${user.name}">
              </div>
              <div class="user-name">${user.name}</div>
            </div>
          </td>
          <td>${user.email}</td>
          <td>${user.phone || '-'}</td>
          <td>${role}</td>
          <td><span class="badge ${status.class}">${status.label}</span></td>
          <td>${date}</td>
          <td>
            <div class="actions">
              <button class="btn btn-sm btn-info view-user" data-id="${user._id}" title="عرض">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-sm btn-primary edit-user" data-id="${user._id}" title="تعديل">
                <i class="fas fa-edit"></i>
              </button>
              ${user._id !== this.currentUser._id ? `
                <button class="btn btn-sm btn-danger delete-user" data-id="${user._id}" title="حذف">
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
    tableBody.querySelectorAll('.view-user').forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.getAttribute('data-id');
        this.viewUser(userId);
      });
    });
    
    tableBody.querySelectorAll('.edit-user').forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.getAttribute('data-id');
        this.editUser(userId);
      });
    });
    
    tableBody.querySelectorAll('.delete-user').forEach(button => {
      button.addEventListener('click', () => {
        const userId = button.getAttribute('data-id');
        this.deleteUser(userId);
      });
    });
  }
  
  async viewUser(userId) {
    try {
      this.app.showLoader();
      
      // Fetch user details
      const response = await ApiClient.get(`${this.apiBaseUrl}/users/${userId}`);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات المستخدم');
        return;
      }
      
      const user = response.data;
      
      // Map role to Arabic labels
      const roleMap = {
        'admin': 'مدير',
        'editor': 'محرر',
        'client': 'عميل'
      };
      
      // Map status to Arabic labels
      const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'blocked': 'محظور'
      };
      
      // Show user details modal
      ModalManager.show({
        title: `بيانات المستخدم: ${user.name}`,
        size: 'lg',
        body: `
          <div class="user-details-container">
            <div class="row">
              <div class="col-md-4 text-center">
                <div class="user-avatar-large">
                  <img src="${user.avatar || '/admin/dashboard/img/default-avatar.png'}" alt="${user.name}">
                </div>
                <h4 class="mt-3">${user.name}</h4>
                <p class="text-muted">${roleMap[user.role] || user.role}</p>
              </div>
              <div class="col-md-8">
                <div class="user-info-list">
                  <div class="info-item">
                    <div class="info-label">البريد الإلكتروني</div>
                    <div class="info-value">${user.email}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">رقم الهاتف</div>
                    <div class="info-value">${user.phone || '-'}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">الحالة</div>
                    <div class="info-value">${statusMap[user.status] || user.status}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">تاريخ التسجيل</div>
                    <div class="info-value">${new Date(user.createdAt).toLocaleDateString('ar-SA')}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">آخر تسجيل دخول</div>
                    <div class="info-value">${user.lastLogin ? new Date(user.lastLogin).toLocaleString('ar-SA') : '-'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `,
        footer: `
          <button type="button" class="btn btn-secondary" data-dismiss="modal">إغلاق</button>
          <button type="button" class="btn btn-primary edit-user-btn" data-id="${user._id}">تعديل</button>
        `
      });
      
      // Add event listener to edit button
      document.querySelector('.edit-user-btn').addEventListener('click', () => {
        ModalManager.hide();
        this.editUser(userId);
      });
    } catch (error) {
      console.error('View user error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات المستخدم');
    }
  }
  
  async editUser(userId) {
    try {
      this.app.showLoader();
      
      // Fetch user details
      const response = await ApiClient.get(`${this.apiBaseUrl}/users/${userId}`);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات المستخدم');
        return;
      }
      
      const user = response.data;
      
      // Show user edit modal
      this.showUserModal(user);
    } catch (error) {
      console.error('Edit user error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات المستخدم');
    }
  }
  
  showUserModal(user = null) {
    const isEdit = !!user;
    const title = isEdit ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد';
    
    // Determine available roles based on current user role
    let roleOptions = '';
    
    if (this.currentUser.role === 'admin') {
      roleOptions = `
        <option value="admin" ${isEdit && user.role === 'admin' ? 'selected' : ''}>مدير</option>
        <option value="editor" ${isEdit && user.role === 'editor' ? 'selected' : ''}>محرر</option>
        <option value="client" ${isEdit && user.role === 'client' ? 'selected' : ''}>عميل</option>
      `;
    } else {
      roleOptions = `
        <option value="client" ${isEdit && user.role === 'client' ? 'selected' : ''}>عميل</option>
      `;
    }
    
    ModalManager.show({
      title: title,
      size: 'lg',
      body: `
        <form id="user-form">
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="user-name">الاسم <span class="text-danger">*</span></label>
                <input type="text" id="user-name" class="form-control" value="${isEdit ? user.name : ''}" required>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="user-email">البريد الإلكتروني <span class="text-danger">*</span></label>
                <input type="email" id="user-email" class="form-control" value="${isEdit ? user.email : ''}" required>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="user-phone">رقم الهاتف</label>
                <input type="text" id="user-phone" class="form-control" value="${isEdit && user.phone ? user.phone : ''}">
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="user-role">الدور <span class="text-danger">*</span></label>
                <select id="user-role" class="form-control" required>
                  ${roleOptions}
                </select>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6">
              <div class="form-group">
                <label for="user-password">${isEdit ? 'كلمة المرور (اتركها فارغة للإبقاء على كلمة المرور الحالية)' : 'كلمة المرور <span class="text-danger">*</span>'}</label>
                <input type="password" id="user-password" class="form-control" ${isEdit ? '' : 'required'}>
              </div>
            </div>
            <div class="col-md-6">
              <div class="form-group">
                <label for="user-status">الحالة <span class="text-danger">*</span></label>
                <select id="user-status" class="form-control" required>
                  <option value="active" ${isEdit && user.status === 'active' ? 'selected' : ''}>نشط</option>
                  <option value="inactive" ${isEdit && user.status === 'inactive' ? 'selected' : ''}>غير نشط</option>
                  <option value="blocked" ${isEdit && user.status === 'blocked' ? 'selected' : ''}>محظور</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label for="user-avatar">الصورة الشخصية</label>
            <div class="custom-file">
              <input type="file" class="custom-file-input" id="user-avatar" accept="image/*">
              <label class="custom-file-label" for="user-avatar">اختر صورة</label>
            </div>
            ${isEdit && user.avatar ? `
              <div class="avatar-preview mt-2">
                <img src="${user.avatar}" alt="${user.name}" class="img-thumbnail" style="max-height: 100px;">
              </div>
            ` : ''}
          </div>
          
          <div class="alert alert-danger mt-3" id="user-form-error" style="display: none;"></div>
        </form>
      `,
      footer: `
        <button type="button" class="btn btn-secondary" data-dismiss="modal">إلغاء</button>
        <button type="button" class="btn btn-primary" id="save-user-btn">حفظ</button>
      `
    });
    
    // Add event listener to save button
    document.getElementById('save-user-btn').addEventListener('click', () => {
      this.saveUser(isEdit ? user._id : null);
    });
    
    // Add event listener to file input
    document.getElementById('user-avatar').addEventListener('change', (e) => {
      const fileName = e.target.files[0]?.name || 'اختر صورة';
      e.target.nextElementSibling.textContent = fileName;
    });
  }
  
  async saveUser(userId = null) {
    try {
      // Get form values
      const name = document.getElementById('user-name').value;
      const email = document.getElementById('user-email').value;
      const phone = document.getElementById('user-phone').value;
      const role = document.getElementById('user-role').value;
      const password = document.getElementById('user-password').value;
      const status = document.getElementById('user-status').value;
      const avatarFile = document.getElementById('user-avatar').files[0];
      
      // Validate form
      if (!name || !email || !role || !status || (!userId && !password)) {
        document.getElementById('user-form-error').textContent = 'يرجى ملء جميع الحقول المطلوبة';
        document.getElementById('user-form-error').style.display = 'block';
        return;
      }
      
      // Disable save button
      const saveButton = document.getElementById('save-user-btn');
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      
      // Prepare form data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('role', role);
      formData.append('status', status);
      
      if (password) {
        formData.append('password', password);
      }
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }
      
      // Send request
      let response;
      
      if (userId) {
        // Update user
        response = await ApiClient.uploadFile(`${this.apiBaseUrl}/users/${userId}`, formData);
      } else {
        // Create user
        response = await ApiClient.uploadFile(`${this.apiBaseUrl}/users`, formData);
      }
      
      // Enable save button
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
      
      if (!response.success) {
        document.getElementById('user-form-error').textContent = response.message || 'فشل حفظ بيانات المستخدم';
        document.getElementById('user-form-error').style.display = 'block';
        return;
      }
      
      // Hide modal
      ModalManager.hide();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', userId ? 'تم تحديث بيانات المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح');
      
      // Reload users
      this.loadUsers();
    } catch (error) {
      console.error('Save user error:', error);
      document.getElementById('user-form-error').textContent = 'حدث خطأ أثناء حفظ بيانات المستخدم';
      document.getElementById('user-form-error').style.display = 'block';
      
      // Enable save button
      const saveButton = document.getElementById('save-user-btn');
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
    }
  }
  
  deleteUser(userId) {
    // Show confirmation dialog
    ModalManager.confirm(
      'حذف المستخدم',
      'هل أنت متأكد من رغبتك في حذف هذا المستخدم؟ لا يمكن التراجع عن هذا الإجراء.',
      async () => {
        try {
          this.app.showLoader();
          
          // Send delete request
          const response = await ApiClient.delete(`${this.apiBaseUrl}/users/${userId}`);
          
          this.app.hideLoader();
          
          if (!response.success) {
            this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل حذف المستخدم');
            return;
          }
          
          // Show success notification
          this.app.ui.notifications.show('success', 'تم بنجاح', 'تم حذف المستخدم بنجاح');
          
          // Reload users
          this.loadUsers();
        } catch (error) {
          console.error('Delete user error:', error);
          this.app.hideLoader();
          this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء حذف المستخدم');
        }
      }
    );
  }
}
