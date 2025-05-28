// Modal Components for Mohandz Admin Dashboard

// User Modal Component
class UserModalComponent {
  constructor() {
    this.modalId = 'userModal';
    this.currentUserId = null;
    this.isEditMode = false;
    this.init();
  }

  init() {
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    const modalHtml = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-labelledby="${this.modalId}Label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${this.modalId}Label">إضافة مستخدم جديد</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
            </div>
            <div class="modal-body">
              <form id="userForm">
                <div class="mb-3">
                  <label for="userName" class="form-label">الاسم</label>
                  <input type="text" class="form-control" id="userName" required>
                </div>
                <div class="mb-3">
                  <label for="userEmail" class="form-label">البريد الإلكتروني</label>
                  <input type="email" class="form-control" id="userEmail" required>
                </div>
                <div class="mb-3">
                  <label for="userPassword" class="form-label">كلمة المرور</label>
                  <input type="password" class="form-control" id="userPassword">
                  <small class="text-muted password-hint">مطلوب للمستخدمين الجدد. اتركه فارغاً للإبقاء على كلمة المرور الحالية.</small>
                </div>
                <div class="mb-3">
                  <label for="userPhone" class="form-label">رقم الهاتف</label>
                  <input type="text" class="form-control" id="userPhone">
                </div>
                <div class="mb-3">
                  <label for="userRole" class="form-label">الدور</label>
                  <select class="form-select" id="userRole" required>
                    <option value="user">مستخدم</option>
                    <option value="editor">محرر</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="userStatus" class="form-label">الحالة</label>
                  <select class="form-select" id="userStatus" required>
                    <option value="active">نشط</option>
                    <option value="inactive">غير نشط</option>
                    <option value="suspended">محظور</option>
                    <option value="pending">معلق</option>
                  </select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
              <button type="button" class="btn btn-primary" id="saveUserBtn">حفظ</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append modal to body if it doesn't exist
    if (!document.getElementById(this.modalId)) {
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
  }

  setupEventListeners() {
    // Save button click
    document.getElementById('saveUserBtn').addEventListener('click', () => {
      this.saveUser();
    });

    // Modal hidden event
    const modalElement = document.getElementById(this.modalId);
    modalElement.addEventListener('hidden.bs.modal', () => {
      this.resetForm();
    });
  }

  show(userId = null) {
    this.currentUserId = userId;
    this.isEditMode = !!userId;

    const modalTitle = document.querySelector(`#${this.modalId}Label`);
    const passwordField = document.getElementById('userPassword');
    const passwordHint = document.querySelector('.password-hint');

    if (this.isEditMode) {
      modalTitle.textContent = 'تعديل المستخدم';
      passwordField.required = false;
      passwordHint.style.display = 'block';
      this.loadUserData(userId);
    } else {
      modalTitle.textContent = 'إضافة مستخدم جديد';
      passwordField.required = true;
      passwordHint.style.display = 'none';
      this.resetForm();
    }

    const modal = new bootstrap.Modal(document.getElementById(this.modalId));
    modal.show();
  }

  async loadUserData(userId) {
    try {
      const result = await api.getUser(userId);
      if (result.success) {
        const user = result.data;
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userPhone').value = user.phone || '';
        document.getElementById('userRole').value = user.role || 'user';
        document.getElementById('userStatus').value = user.status || 'active';
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      dashboard.showNotification('فشل تحميل بيانات المستخدم', 'error');
    }
  }

  async saveUser() {
    try {
      const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value,
        status: document.getElementById('userStatus').value
      };

      const password = document.getElementById('userPassword').value;
      if (password) {
        userData.password = password;
      }

      let result;
      if (this.isEditMode) {
        result = await api.updateUser(this.currentUserId, userData);
      } else {
        result = await api.createUser(userData);
      }

      if (result.success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(this.modalId));
        modal.hide();
        dashboard.showNotification(
          this.isEditMode ? 'تم تحديث المستخدم بنجاح' : 'تم إضافة المستخدم بنجاح',
          'success'
        );
        dashboard.loadUsersData();
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      dashboard.showNotification('فشل حفظ بيانات المستخدم', 'error');
    }
  }

  resetForm() {
    document.getElementById('userForm').reset();
    this.currentUserId = null;
    this.isEditMode = false;
  }
}

// Service Modal Component
class ServiceModalComponent {
  constructor() {
    this.modalId = 'serviceModal';
    this.currentServiceId = null;
    this.isEditMode = false;
    this.init();
  }

  init() {
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    const modalHtml = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-labelledby="${this.modalId}Label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${this.modalId}Label">إضافة خدمة جديدة</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
            </div>
            <div class="modal-body">
              <form id="serviceForm">
                <div class="mb-3">
                  <label for="serviceTitle" class="form-label">عنوان الخدمة</label>
                  <input type="text" class="form-control" id="serviceTitle" required>
                </div>
                <div class="mb-3">
                  <label for="serviceDescription" class="form-label">وصف الخدمة</label>
                  <textarea class="form-control" id="serviceDescription" rows="3" required></textarea>
                </div>
                <div class="mb-3">
                  <label for="serviceCategory" class="form-label">الفئة</label>
                  <select class="form-select" id="serviceCategory" required>
                    <option value="architectural">التصاميم المعمارية</option>
                    <option value="infrastructure">الطرق والبنية التحتية</option>
                    <option value="surveying">الخدمات المساحية</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="serviceIcon" class="form-label">الأيقونة</label>
                  <input type="text" class="form-control" id="serviceIcon" placeholder="fa-home">
                  <small class="text-muted">أدخل اسم أيقونة Font Awesome (مثال: fa-home)</small>
                </div>
                <div class="mb-3">
                  <label for="servicePrice" class="form-label">السعر</label>
                  <input type="number" class="form-control" id="servicePrice" min="0" step="0.01">
                </div>
                <div class="mb-3">
                  <label for="serviceStatus" class="form-label">الحالة</label>
                  <select class="form-select" id="serviceStatus" required>
                    <option value="active">مفعلة</option>
                    <option value="inactive">معطلة</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="serviceOrder" class="form-label">الترتيب</label>
                  <input type="number" class="form-control" id="serviceOrder" min="0" value="0">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
              <button type="button" class="btn btn-primary" id="saveServiceBtn">حفظ</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append modal to body if it doesn't exist
    if (!document.getElementById(this.modalId)) {
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
  }

  setupEventListeners() {
    // Save button click
    document.getElementById('saveServiceBtn').addEventListener('click', () => {
      this.saveService();
    });

    // Modal hidden event
    const modalElement = document.getElementById(this.modalId);
    modalElement.addEventListener('hidden.bs.modal', () => {
      this.resetForm();
    });
  }

  show(serviceId = null) {
    this.currentServiceId = serviceId;
    this.isEditMode = !!serviceId;

    const modalTitle = document.querySelector(`#${this.modalId}Label`);

    if (this.isEditMode) {
      modalTitle.textContent = 'تعديل الخدمة';
      this.loadServiceData(serviceId);
    } else {
      modalTitle.textContent = 'إضافة خدمة جديدة';
      this.resetForm();
    }

    const modal = new bootstrap.Modal(document.getElementById(this.modalId));
    modal.show();
  }

  async loadServiceData(serviceId) {
    try {
      const result = await api.getService(serviceId);
      if (result.success) {
        const service = result.data;
        document.getElementById('serviceTitle').value = service.title || '';
        document.getElementById('serviceDescription').value = service.description || '';
        document.getElementById('serviceCategory').value = service.category || 'architectural';
        document.getElementById('serviceIcon').value = service.icon || '';
        document.getElementById('servicePrice').value = service.price || 0;
        document.getElementById('serviceStatus').value = service.status || 'active';
        document.getElementById('serviceOrder').value = service.order || 0;
      }
    } catch (error) {
      console.error('Failed to load service data:', error);
      dashboard.showNotification('فشل تحميل بيانات الخدمة', 'error');
    }
  }

  async saveService() {
    try {
      const serviceData = {
        title: document.getElementById('serviceTitle').value,
        description: document.getElementById('serviceDescription').value,
        category: document.getElementById('serviceCategory').value,
        icon: document.getElementById('serviceIcon').value,
        price: parseFloat(document.getElementById('servicePrice').value) || 0,
        status: document.getElementById('serviceStatus').value,
        order: parseInt(document.getElementById('serviceOrder').value) || 0
      };

      let result;
      if (this.isEditMode) {
        result = await api.updateService(this.currentServiceId, serviceData);
      } else {
        result = await api.createService(serviceData);
      }

      if (result.success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(this.modalId));
        modal.hide();
        dashboard.showNotification(
          this.isEditMode ? 'تم تحديث الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح',
          'success'
        );
        dashboard.loadServicesData();
      }
    } catch (error) {
      console.error('Failed to save service:', error);
      dashboard.showNotification('فشل حفظ بيانات الخدمة', 'error');
    }
  }

  resetForm() {
    document.getElementById('serviceForm').reset();
    this.currentServiceId = null;
    this.isEditMode = false;
  }
}

// Order Modal Component
class OrderModalComponent {
  constructor() {
    this.modalId = 'orderModal';
    this.currentOrderId = null;
    this.isEditMode = false;
    this.init();
  }

  init() {
    this.createModal();
    this.setupEventListeners();
  }

  createModal() {
    const modalHtml = `
      <div class="modal fade" id="${this.modalId}" tabindex="-1" aria-labelledby="${this.modalId}Label" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="${this.modalId}Label">تفاصيل الطلب</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="إغلاق"></button>
            </div>
            <div class="modal-body">
              <form id="orderForm">
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="orderNumber" class="form-label">رقم الطلب</label>
                    <input type="text" class="form-control" id="orderNumber" readonly>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="orderDate" class="form-label">تاريخ الطلب</label>
                    <input type="text" class="form-control" id="orderDate" readonly>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="orderClient" class="form-label">العميل</label>
                    <input type="text" class="form-control" id="orderClient" readonly>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="orderService" class="form-label">الخدمة</label>
                    <input type="text" class="form-control" id="orderService" readonly>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="orderDetails" class="form-label">تفاصيل الطلب</label>
                  <textarea class="form-control" id="orderDetails" rows="3" readonly></textarea>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="orderPrice" class="form-label">السعر</label>
                    <input type="number" class="form-control" id="orderPrice" min="0" step="0.01">
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="orderStatus" class="form-label">حالة الطلب</label>
                    <select class="form-select" id="orderStatus">
                      <option value="new">جديد</option>
                      <option value="in_review">قيد المراجعة</option>
                      <option value="accepted">مقبول</option>
                      <option value="in_progress">قيد التنفيذ</option>
                      <option value="completed">مكتمل</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                </div>
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <label for="orderPaymentStatus" class="form-label">حالة الدفع</label>
                    <select class="form-select" id="orderPaymentStatus">
                      <option value="pending">معلق</option>
                      <option value="partial">جزئي</option>
                      <option value="completed">مكتمل</option>
                    </select>
                  </div>
                  <div class="col-md-6 mb-3">
                    <label for="orderAssignedTo" class="form-label">تعيين إلى</label>
                    <select class="form-select" id="orderAssignedTo">
                      <option value="">-- غير معين --</option>
                    </select>
                  </div>
                </div>
                <div class="mb-3">
                  <label for="orderNotes" class="form-label">ملاحظات</label>
                  <textarea class="form-control" id="orderNotes" rows="3"></textarea>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
              <button type="button" class="btn btn-primary" id="saveOrderBtn">حفظ التغييرات</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Append modal to body if it doesn't exist
    if (!document.getElementById(this.modalId)) {
      document.body.insertAdjacentHTML('beforeend', modalHtml);
    }
  }

  setupEventListeners() {
    // Save button click
    document.getElementById('saveOrderBtn').addEventListener('click', () => {
      this.saveOrder();
    });

    // Modal hidden event
    const modalElement = document.getElementById(this.modalId);
    modalElement.addEventListener('hidden.bs.modal', () => {
      this.resetForm();
    });
  }

  async show(orderId) {
    if (!orderId) {
      console.error('Order ID is required');
      return;
    }

    this.currentOrderId = orderId;
    this.isEditMode = true;

    await this.loadOrderData(orderId);
    await this.loadAssigneeOptions();

    const modal = new bootstrap.Modal(document.getElementById(this.modalId));
    modal.show();
  }

  async loadOrderData(orderId) {
    try {
      const result = await api.getOrder(orderId);
      if (result.success) {
        const order = result.data;
        document.getElementById('orderNumber').value = order.orderNumber || '';
        document.getElementById('orderDate').value = new Date(order.createdAt).toLocaleDateString('ar-SA');
        document.getElementById('orderClient').value = order.client ? order.client.name : '';
        document.getElementById('orderService').value = order.service ? order.service.title : '';
        document.getElementById('orderDetails').value = order.details || '';
        document.getElementById('orderPrice').value = order.price || 0;
        document.getElementById('orderStatus').value = order.status || 'new';
        document.getElementById('orderPaymentStatus').value = order.paymentStatus || 'pending';
        document.getElementById('orderNotes').value = order.notes || '';
        
        // Set assignee if exists
        if (order.assignedTo) {
          document.getElementById('orderAssignedTo').value = order.assignedTo._id;
        }
      }
    } catch (error) {
      console.error('Failed to load order data:', error);
      dashboard.showNotification('فشل تحميل بيانات الطلب', 'error');
    }
  }

  async loadAssigneeOptions() {
    try {
      const result = await api.getUsers();
      if (result.success) {
        const users = result.data;
        const assigneeSelect = document.getElementById('orderAssignedTo');
        
        // Clear existing options except the first one
        while (assigneeSelect.options.length > 1) {
          assigneeSelect.remove(1);
        }
        
        // Add user options
        users.forEach(user => {
          const option = document.createElement('option');
          option.value = user._id;
          option.textContent = user.name;
          assigneeSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Failed to load users for assignee options:', error);
    }
  }

  async saveOrder() {
    try {
      const orderData = {
        price: parseFloat(document.getElementById('orderPrice').value) || 0,
        status: document.getElementById('orderStatus').value,
        paymentStatus: document.getElementById('orderPaymentStatus').value,
        notes: document.getElementById('orderNotes').value,
        assignedTo: document.getElementById('orderAssignedTo').value || null
      };

      const result = await api.updateOrder(this.currentOrderId, orderData);

      if (result.success) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(this.modalId));
        modal.hide();
        dashboard.showNotification('تم تحديث الطلب بنجاح', 'success');
        dashboard.loadOrdersData();
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      dashboard.showNotification('فشل حفظ بيانات الطلب', 'error');
    }
  }

  resetForm() {
    document.getElementById('orderForm').reset();
    this.currentOrderId = null;
  }
}

// Initialize modal components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.userModal = new UserModalComponent();
  window.serviceModal = new ServiceModalComponent();
  window.orderModal = new OrderModalComponent();
});
