// Data Table Component for Mohandz Admin Dashboard

class DataTableComponent {
  constructor(tableId, options = {}) {
    this.tableId = tableId;
    this.options = {
      selectable: false,
      searchable: true,
      pagination: true,
      itemsPerPage: 10,
      actions: true,
      ...options
    };
    
    this.currentPage = 1;
    this.totalPages = 1;
    this.data = [];
    this.filteredData = [];
    
    this.init();
  }
  
  init() {
    this.table = document.getElementById(this.tableId);
    if (!this.table) {
      console.error(`Table with ID ${this.tableId} not found`);
      return;
    }
    
    this.tableHead = this.table.querySelector('thead');
    this.tableBody = this.table.querySelector('tbody');
    
    if (!this.tableHead || !this.tableBody) {
      console.error(`Table ${this.tableId} must have thead and tbody elements`);
      return;
    }
    
    this.setupTableControls();
    this.setupEventListeners();
  }
  
  setupTableControls() {
    const tableContainer = this.table.parentElement;
    
    // Create table controls container if it doesn't exist
    let controlsContainer = tableContainer.querySelector('.table-controls');
    if (!controlsContainer) {
      controlsContainer = document.createElement('div');
      controlsContainer.className = 'table-controls d-flex justify-content-between align-items-center mb-3';
      tableContainer.insertBefore(controlsContainer, this.table);
    }
    
    // Add search input if searchable
    if (this.options.searchable) {
      const searchContainer = document.createElement('div');
      searchContainer.className = 'search-container';
      searchContainer.innerHTML = `
        <div class="input-group">
          <span class="input-group-text"><i class="fas fa-search"></i></span>
          <input type="text" class="form-control" id="${this.tableId}-search" placeholder="بحث...">
        </div>
      `;
      controlsContainer.appendChild(searchContainer);
    }
    
    // Add action buttons container
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'actions-container';
    
    // Add refresh button
    const refreshButton = document.createElement('button');
    refreshButton.className = 'btn btn-outline-secondary me-2';
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i>';
    refreshButton.setAttribute('data-action', 'refresh');
    refreshButton.title = 'تحديث';
    actionsContainer.appendChild(refreshButton);
    
    // Add add button if actions enabled
    if (this.options.actions) {
      const addButton = document.createElement('button');
      addButton.className = 'btn btn-primary';
      addButton.innerHTML = '<i class="fas fa-plus"></i> إضافة جديد';
      addButton.setAttribute('data-action', 'add');
      actionsContainer.appendChild(addButton);
    }
    
    controlsContainer.appendChild(actionsContainer);
    
    // Add pagination container if pagination enabled
    if (this.options.pagination) {
      const paginationContainer = document.createElement('div');
      paginationContainer.className = 'pagination-container mt-3 d-flex justify-content-between align-items-center';
      
      const pageInfo = document.createElement('div');
      pageInfo.className = 'page-info';
      pageInfo.id = `${this.tableId}-page-info`;
      
      const pageControls = document.createElement('div');
      pageControls.className = 'page-controls';
      pageControls.innerHTML = `
        <button class="btn btn-sm btn-outline-secondary me-1" data-action="first-page">
          <i class="fas fa-angle-double-right"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary me-1" data-action="prev-page">
          <i class="fas fa-angle-right"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary me-1" data-action="next-page">
          <i class="fas fa-angle-left"></i>
        </button>
        <button class="btn btn-sm btn-outline-secondary" data-action="last-page">
          <i class="fas fa-angle-double-left"></i>
        </button>
      `;
      
      paginationContainer.appendChild(pageInfo);
      paginationContainer.appendChild(pageControls);
      
      tableContainer.insertBefore(paginationContainer, this.table.nextSibling);
    }
  }
  
  setupEventListeners() {
    // Search input event
    if (this.options.searchable) {
      const searchInput = document.getElementById(`${this.tableId}-search`);
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          this.filterData(searchInput.value);
        });
      }
    }
    
    // Action buttons events
    const actionsContainer = this.table.parentElement.querySelector('.actions-container');
    if (actionsContainer) {
      actionsContainer.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;
        
        const action = button.getAttribute('data-action');
        if (action === 'refresh') {
          this.refresh();
        } else if (action === 'add') {
          this.onAdd();
        }
      });
    }
    
    // Pagination events
    if (this.options.pagination) {
      const paginationContainer = this.table.parentElement.querySelector('.pagination-container');
      if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
          const button = e.target.closest('button');
          if (!button) return;
          
          const action = button.getAttribute('data-action');
          if (action === 'first-page') {
            this.goToPage(1);
          } else if (action === 'prev-page') {
            this.goToPage(this.currentPage - 1);
          } else if (action === 'next-page') {
            this.goToPage(this.currentPage + 1);
          } else if (action === 'last-page') {
            this.goToPage(this.totalPages);
          }
        });
      }
    }
    
    // Row action buttons events
    this.tableBody.addEventListener('click', (e) => {
      const button = e.target.closest('button');
      if (!button) return;
      
      const action = button.getAttribute('data-action');
      const rowId = button.closest('tr').getAttribute('data-id');
      
      if (action && rowId) {
        if (action === 'edit') {
          this.onEdit(rowId);
        } else if (action === 'delete') {
          this.onDelete(rowId);
        } else if (action === 'view') {
          this.onView(rowId);
        }
      }
    });
  }
  
  setData(data) {
    this.data = Array.isArray(data) ? data : [];
    this.filteredData = [...this.data];
    this.updatePagination();
    this.renderTable();
  }
  
  filterData(searchTerm) {
    if (!searchTerm) {
      this.filteredData = [...this.data];
    } else {
      searchTerm = searchTerm.toLowerCase();
      this.filteredData = this.data.filter(item => {
        return Object.values(item).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }
    
    this.currentPage = 1;
    this.updatePagination();
    this.renderTable();
  }
  
  updatePagination() {
    if (!this.options.pagination) return;
    
    const totalItems = this.filteredData.length;
    this.totalPages = Math.max(1, Math.ceil(totalItems / this.options.itemsPerPage));
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    
    // Update page info
    const pageInfo = document.getElementById(`${this.tableId}-page-info`);
    if (pageInfo) {
      const startItem = (this.currentPage - 1) * this.options.itemsPerPage + 1;
      const endItem = Math.min(startItem + this.options.itemsPerPage - 1, totalItems);
      
      pageInfo.textContent = totalItems > 0 
        ? `عرض ${startItem} إلى ${endItem} من ${totalItems} عنصر`
        : 'لا توجد عناصر للعرض';
    }
    
    // Update pagination buttons state
    const paginationContainer = this.table.parentElement.querySelector('.pagination-container');
    if (paginationContainer) {
      const firstPageBtn = paginationContainer.querySelector('[data-action="first-page"]');
      const prevPageBtn = paginationContainer.querySelector('[data-action="prev-page"]');
      const nextPageBtn = paginationContainer.querySelector('[data-action="next-page"]');
      const lastPageBtn = paginationContainer.querySelector('[data-action="last-page"]');
      
      if (firstPageBtn) firstPageBtn.disabled = this.currentPage === 1;
      if (prevPageBtn) prevPageBtn.disabled = this.currentPage === 1;
      if (nextPageBtn) nextPageBtn.disabled = this.currentPage === this.totalPages;
      if (lastPageBtn) lastPageBtn.disabled = this.currentPage === this.totalPages;
    }
  }
  
  goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    
    this.currentPage = page;
    this.updatePagination();
    this.renderTable();
  }
  
  getCurrentPageData() {
    if (!this.options.pagination) return this.filteredData;
    
    const startIndex = (this.currentPage - 1) * this.options.itemsPerPage;
    return this.filteredData.slice(startIndex, startIndex + this.options.itemsPerPage);
  }
  
  renderTable() {
    const pageData = this.getCurrentPageData();
    
    // Clear table body
    this.tableBody.innerHTML = '';
    
    if (pageData.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.colSpan = this.tableHead.querySelectorAll('th').length;
      emptyCell.className = 'text-center py-4';
      emptyCell.textContent = 'لا توجد بيانات للعرض';
      emptyRow.appendChild(emptyCell);
      this.tableBody.appendChild(emptyRow);
      return;
    }
    
    // Render data rows
    pageData.forEach(item => {
      const row = this.createRow(item);
      this.tableBody.appendChild(row);
    });
  }
  
  createRow(item) {
    const row = document.createElement('tr');
    row.setAttribute('data-id', item.id || item._id);
    
    // Add checkbox column if selectable
    if (this.options.selectable) {
      const checkboxCell = document.createElement('td');
      checkboxCell.innerHTML = `
        <div class="form-check">
          <input class="form-check-input" type="checkbox">
        </div>
      `;
      row.appendChild(checkboxCell);
    }
    
    // Add data cells based on table headers
    const headers = Array.from(this.tableHead.querySelectorAll('th'));
    headers.forEach(header => {
      // Skip checkbox and actions columns
      if (header.classList.contains('checkbox-column') || 
          header.classList.contains('actions-column')) {
        return;
      }
      
      const field = header.getAttribute('data-field');
      if (!field) return;
      
      const cell = document.createElement('td');
      cell.innerHTML = this.formatCellContent(item, field);
      row.appendChild(cell);
    });
    
    // Add actions column if needed
    if (this.options.actions) {
      const actionsCell = document.createElement('td');
      actionsCell.className = 'actions';
      actionsCell.innerHTML = `
        <button class="btn btn-sm btn-info me-1" data-action="edit">
          <i class="fas fa-edit"></i>
        </button>
        <button class="btn btn-sm btn-danger" data-action="delete">
          <i class="fas fa-trash"></i>
        </button>
      `;
      row.appendChild(actionsCell);
    }
    
    return row;
  }
  
  formatCellContent(item, field) {
    // Handle nested fields (e.g., 'user.name')
    const fieldParts = field.split('.');
    let value = item;
    
    for (const part of fieldParts) {
      if (value === null || value === undefined) return '';
      value = value[part];
    }
    
    if (value === null || value === undefined) return '';
    
    // Format based on field type
    if (field.endsWith('Date') || field === 'createdAt' || field === 'updatedAt') {
      return new Date(value).toLocaleDateString('ar-SA');
    }
    
    if (field === 'status') {
      return this.formatStatus(value);
    }
    
    if (typeof value === 'boolean') {
      return value ? '<i class="fas fa-check text-success"></i>' : '<i class="fas fa-times text-danger"></i>';
    }
    
    return value;
  }
  
  formatStatus(status) {
    let badgeClass = 'secondary';
    let statusText = status;
    
    switch (status) {
      case 'active':
        badgeClass = 'success';
        statusText = 'نشط';
        break;
      case 'inactive':
        badgeClass = 'warning';
        statusText = 'غير نشط';
        break;
      case 'pending':
        badgeClass = 'info';
        statusText = 'معلق';
        break;
      case 'suspended':
        badgeClass = 'danger';
        statusText = 'محظور';
        break;
      case 'completed':
        badgeClass = 'success';
        statusText = 'مكتمل';
        break;
      case 'in_progress':
        badgeClass = 'primary';
        statusText = 'قيد التنفيذ';
        break;
      case 'cancelled':
        badgeClass = 'danger';
        statusText = 'ملغي';
        break;
    }
    
    return `<span class="badge bg-${badgeClass}">${statusText}</span>`;
  }
  
  refresh() {
    // This method should be overridden by the implementing class
    console.log('Refresh method should be implemented');
  }
  
  onAdd() {
    // This method should be overridden by the implementing class
    console.log('Add method should be implemented');
  }
  
  onEdit(id) {
    // This method should be overridden by the implementing class
    console.log('Edit method should be implemented for ID:', id);
  }
  
  onDelete(id) {
    // This method should be overridden by the implementing class
    console.log('Delete method should be implemented for ID:', id);
  }
  
  onView(id) {
    // This method should be overridden by the implementing class
    console.log('View method should be implemented for ID:', id);
  }
}

// Initialize data table components when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Tables will be initialized by their respective section controllers
});
