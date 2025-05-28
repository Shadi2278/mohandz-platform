// Notification Component for Mohandz Admin Dashboard

class NotificationComponent {
  constructor() {
    this.containerId = 'notificationContainer';
    this.init();
  }

  init() {
    this.createContainer();
  }

  createContainer() {
    // Create notification container if it doesn't exist
    if (!document.getElementById(this.containerId)) {
      const containerHtml = `
        <div id="${this.containerId}" class="position-fixed top-0 end-0 p-3" style="z-index: 1060;"></div>
      `;
      document.body.insertAdjacentHTML('beforeend', containerHtml);
    }
  }

  show(message, type = 'success', duration = 3000) {
    const container = document.getElementById(this.containerId);
    const id = 'notification-' + Date.now();
    
    // Create notification element
    const notificationHtml = `
      <div id="${id}" class="toast align-items-center text-white bg-${this.getBackgroundClass(type)} border-0" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body">
            <i class="fas ${this.getIconClass(type)} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="إغلاق"></button>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', notificationHtml);
    
    // Initialize and show toast
    const toastElement = document.getElementById(id);
    const toast = new bootstrap.Toast(toastElement, {
      autohide: true,
      delay: duration
    });
    
    toast.show();
    
    // Remove from DOM after hiding
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  getBackgroundClass(type) {
    switch (type) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'primary';
    }
  }

  getIconClass(type) {
    switch (type) {
      case 'success': return 'fa-check-circle';
      case 'error': return 'fa-exclamation-circle';
      case 'warning': return 'fa-exclamation-triangle';
      case 'info': return 'fa-info-circle';
      default: return 'fa-bell';
    }
  }
}

// Initialize notification component when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.notification = new NotificationComponent();
});
