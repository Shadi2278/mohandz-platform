// Content Management Controller for Mohandz Admin Dashboard
// Handles website content management operations

class ContentController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
    this.mainContent = app.ui.mainContent;
    this.currentUser = app.currentUser;
    this.currentSection = 'pages';
    this.contentTypes = {
      pages: { title: 'الصفحات', icon: 'file-alt' },
      sliders: { title: 'شرائح العرض', icon: 'images' },
      testimonials: { title: 'آراء العملاء', icon: 'quote-right' },
      gallery: { title: 'معرض الصور', icon: 'photo-video' },
      faq: { title: 'الأسئلة الشائعة', icon: 'question-circle' }
    };
  }
  
  async init() {
    try {
      // Render content management template
      this.renderContentTemplate();
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Load content data for default section
      await this.loadContent(this.currentSection);
      
      // Hide loader
      this.app.hideLoader();
    } catch (error) {
      console.error('Content management initialization error:', error);
      this.mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل بيانات إدارة المحتوى
        </div>
      `;
      this.app.hideLoader();
    }
  }
  
  renderContentTemplate() {
    this.mainContent.innerHTML = `
      <div class="content-management-container">
        <div class="page-header">
          <div>
            <h1><i class="fas fa-edit"></i> إدارة المحتوى</h1>
            <p>إدارة محتوى الموقع</p>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-3">
            <div class="card">
              <div class="card-header">
                <h5>أقسام المحتوى</h5>
              </div>
              <div class="card-body p-0">
                <div class="content-nav">
                  <ul class="nav flex-column">
                    ${Object.entries(this.contentTypes).map(([key, value]) => `
                      <li class="nav-item">
                        <a class="nav-link ${key === this.currentSection ? 'active' : ''}" href="#" data-section="${key}">
                          <i class="fas fa-${value.icon}"></i> ${value.title}
                        </a>
                      </li>
                    `).join('')}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-9">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 id="content-section-title">${this.contentTypes[this.currentSection].title}</h5>
                <button id="add-content-btn" class="btn btn-primary">
                  <i class="fas fa-plus"></i> إضافة جديد
                </button>
              </div>
              <div class="card-body">
                <div id="content-container">
                  <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="sr-only">جاري التحميل...</span>
                    </div>
                    <p class="mt-2">جاري تحميل المحتوى...</p>
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
    // Content section navigation
    document.querySelectorAll('.content-nav .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.currentTarget.getAttribute('data-section');
        this.changeSection(section);
      });
    });
    
    // Add content button
    document.getElementById('add-content-btn').addEventListener('click', () => {
      this.showAddContentModal();
    });
  }
  
  async changeSection(section) {
    if (section === this.currentSection) return;
    
    // Update current section
    this.currentSection = section;
    
    // Update UI
    document.querySelectorAll('.content-nav .nav-link').forEach(link => {
      if (link.getAttribute('data-section') === section) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Update section title
    document.getElementById('content-section-title').textContent = this.contentTypes[section].title;
    
    // Show loader
    document.getElementById('content-container').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">جاري التحميل...</span>
        </div>
        <p class="mt-2">جاري تحميل المحتوى...</p>
      </div>
    `;
    
    // Load content for selected section
    await this.loadContent(section);
  }
  
  async loadContent(section) {
    try {
      // Fetch content based on section
      const response = await ApiClient.get(`${this.apiBaseUrl}/content/${section}`);
      
      if (!response.success) {
        throw new Error(response.message || `فشل تحميل بيانات ${this.contentTypes[section].title}`);
      }
      
      // Render content based on section
      switch (section) {
        case 'pages':
          this.renderPages(response.data);
          break;
        case 'sliders':
          this.renderSliders(response.data);
          break;
        case 'testimonials':
          this.renderTestimonials(response.data);
          break;
        case 'gallery':
          this.renderGallery(response.data);
          break;
        case 'faq':
          this.renderFAQ(response.data);
          break;
        default:
          throw new Error('قسم غير معروف');
      }
    } catch (error) {
      console.error(`Load ${section} error:`, error);
      document.getElementById('content-container').innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل بيانات ${this.contentTypes[section].title}
        </div>
      `;
    }
  }
  
  renderPages(pages) {
    const container = document.getElementById('content-container');
    
    if (!pages || pages.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          لا توجد صفحات. انقر على "إضافة جديد" لإضافة صفحة جديدة.
        </div>
      `;
      return;
    }
    
    // Generate pages table
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover">
          <thead>
            <tr>
              <th>العنوان</th>
              <th>المسار</th>
              <th>آخر تحديث</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            ${pages.map(page => `
              <tr>
                <td>${page.title}</td>
                <td>${page.slug}</td>
                <td>${new Date(page.updatedAt).toLocaleDateString('ar-SA')}</td>
                <td>
                  <span class="badge ${page.published ? 'badge-success' : 'badge-secondary'}">
                    ${page.published ? 'منشور' : 'مسودة'}
                  </span>
                </td>
                <td>
                  <div class="actions">
                    <button class="btn btn-sm btn-info view-page" data-id="${page._id}" title="عرض">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary edit-page" data-id="${page._id}" title="تعديل">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-page" data-id="${page._id}" title="حذف">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    
    // Add event listeners to action buttons
    container.querySelectorAll('.view-page').forEach(button => {
      button.addEventListener('click', () => {
        const pageId = button.getAttribute('data-id');
        this.viewPage(pageId);
      });
    });
    
    container.querySelectorAll('.edit-page').forEach(button => {
      button.addEventListener('click', () => {
        const pageId = button.getAttribute('data-id');
        this.editPage(pageId);
      });
    });
    
    container.querySelectorAll('.delete-page').forEach(button => {
      button.addEventListener('click', () => {
        const pageId = button.getAttribute('data-id');
        this.deletePage(pageId);
      });
    });
  }
  
  renderSliders(sliders) {
    const container = document.getElementById('content-container');
    
    if (!sliders || sliders.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          لا توجد شرائح عرض. انقر على "إضافة جديد" لإضافة شريحة جديدة.
        </div>
      `;
      return;
    }
    
    // Generate sliders grid
    container.innerHTML = `
      <div class="row">
        ${sliders.map(slider => `
          <div class="col-md-4 mb-4">
            <div class="card slider-card">
              <div class="card-img-top slider-img-container">
                <img src="${slider.image}" alt="${slider.title}" class="slider-img">
              </div>
              <div class="card-body">
                <h5 class="card-title">${slider.title}</h5>
                <p class="card-text">${slider.subtitle || ''}</p>
                <div class="slider-order">الترتيب: ${slider.order || 0}</div>
                <div class="slider-status">
                  <span class="badge ${slider.active ? 'badge-success' : 'badge-secondary'}">
                    ${slider.active ? 'نشط' : 'غير نشط'}
                  </span>
                </div>
              </div>
              <div class="card-footer">
                <div class="actions">
                  <button class="btn btn-sm btn-primary edit-slider" data-id="${slider._id}" title="تعديل">
                    <i class="fas fa-edit"></i> تعديل
                  </button>
                  <button class="btn btn-sm btn-danger delete-slider" data-id="${slider._id}" title="حذف">
                    <i class="fas fa-trash"></i> حذف
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners to action buttons
    container.querySelectorAll('.edit-slider').forEach(button => {
      button.addEventListener('click', () => {
        const sliderId = button.getAttribute('data-id');
        this.editSlider(sliderId);
      });
    });
    
    container.querySelectorAll('.delete-slider').forEach(button => {
      button.addEventListener('click', () => {
        const sliderId = button.getAttribute('data-id');
        this.deleteSlider(sliderId);
      });
    });
  }
  
  renderTestimonials(testimonials) {
    const container = document.getElementById('content-container');
    
    if (!testimonials || testimonials.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          لا توجد آراء للعملاء. انقر على "إضافة جديد" لإضافة رأي جديد.
        </div>
      `;
      return;
    }
    
    // Generate testimonials list
    container.innerHTML = `
      <div class="testimonials-list">
        ${testimonials.map(testimonial => `
          <div class="testimonial-item">
            <div class="testimonial-header">
              <div class="testimonial-avatar">
                ${testimonial.avatar ? `<img src="${testimonial.avatar}" alt="${testimonial.name}">` : `
                  <div class="avatar-placeholder">
                    <i class="fas fa-user"></i>
                  </div>
                `}
              </div>
              <div class="testimonial-info">
                <h5 class="testimonial-name">${testimonial.name}</h5>
                <div class="testimonial-position">${testimonial.position || ''}</div>
                <div class="testimonial-rating">
                  ${Array(5).fill(0).map((_, i) => `
                    <i class="fas fa-star ${i < testimonial.rating ? 'active' : ''}"></i>
                  `).join('')}
                </div>
              </div>
              <div class="testimonial-status">
                <span class="badge ${testimonial.active ? 'badge-success' : 'badge-secondary'}">
                  ${testimonial.active ? 'نشط' : 'غير نشط'}
                </span>
              </div>
            </div>
            <div class="testimonial-content">
              "${testimonial.content}"
            </div>
            <div class="testimonial-footer">
              <div class="testimonial-date">
                ${new Date(testimonial.date || testimonial.createdAt).toLocaleDateString('ar-SA')}
              </div>
              <div class="actions">
                <button class="btn btn-sm btn-primary edit-testimonial" data-id="${testimonial._id}" title="تعديل">
                  <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="btn btn-sm btn-danger delete-testimonial" data-id="${testimonial._id}" title="حذف">
                  <i class="fas fa-trash"></i> حذف
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners to action buttons
    container.querySelectorAll('.edit-testimonial').forEach(button => {
      button.addEventListener('click', () => {
        const testimonialId = button.getAttribute('data-id');
        this.editTestimonial(testimonialId);
      });
    });
    
    container.querySelectorAll('.delete-testimonial').forEach(button => {
      button.addEventListener('click', () => {
        const testimonialId = button.getAttribute('data-id');
        this.deleteTestimonial(testimonialId);
      });
    });
  }
  
  renderGallery(gallery) {
    const container = document.getElementById('content-container');
    
    if (!gallery || gallery.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          لا توجد صور في المعرض. انقر على "إضافة جديد" لإضافة صورة جديدة.
        </div>
      `;
      return;
    }
    
    // Generate gallery grid
    container.innerHTML = `
      <div class="row gallery-grid">
        ${gallery.map(item => `
          <div class="col-md-3 mb-4">
            <div class="card gallery-card">
              <div class="card-img-top gallery-img-container">
                <img src="${item.image}" alt="${item.title}" class="gallery-img">
              </div>
              <div class="card-body">
                <h5 class="card-title">${item.title}</h5>
                <p class="card-text">${item.description || ''}</p>
                <div class="gallery-category">${item.category || 'عام'}</div>
              </div>
              <div class="card-footer">
                <div class="actions">
                  <button class="btn btn-sm btn-primary edit-gallery-item" data-id="${item._id}" title="تعديل">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-sm btn-danger delete-gallery-item" data-id="${item._id}" title="حذف">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners to action buttons
    container.querySelectorAll('.edit-gallery-item').forEach(button => {
      button.addEventListener('click', () => {
        const itemId = button.getAttribute('data-id');
        this.editGalleryItem(itemId);
      });
    });
    
    container.querySelectorAll('.delete-gallery-item').forEach(button => {
      button.addEventListener('click', () => {
        const itemId = button.getAttribute('data-id');
        this.deleteGalleryItem(itemId);
      });
    });
  }
  
  renderFAQ(faq) {
    const container = document.getElementById('content-container');
    
    if (!faq || faq.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          لا توجد أسئلة شائعة. انقر على "إضافة جديد" لإضافة سؤال جديد.
        </div>
      `;
      return;
    }
    
    // Group FAQ by category
    const faqByCategory = faq.reduce((acc, item) => {
      const category = item.category || 'عام';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
    
    // Generate FAQ accordion
    container.innerHTML = `
      <div class="faq-container">
        ${Object.entries(faqByCategory).map(([category, items], categoryIndex) => `
          <div class="faq-category">
            <h4 class="faq-category-title">${category}</h4>
            <div class="accordion" id="faqAccordion${categoryIndex}">
              ${items.map((item, index) => `
                <div class="card">
                  <div class="card-header" id="faqHeading${categoryIndex}_${index}">
                    <h2 class="mb-0 d-flex justify-content-between align-items-center">
                      <button class="btn btn-link btn-block text-right collapsed" type="button" data-toggle="collapse" data-target="#faqCollapse${categoryIndex}_${index}" aria-expanded="false" aria-controls="faqCollapse${categoryIndex}_${index}">
                        ${item.question}
                      </button>
                      <div class="faq-actions">
                        <button class="btn btn-sm btn-primary edit-faq" data-id="${item._id}" title="تعديل">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-faq" data-id="${item._id}" title="حذف">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </h2>
                  </div>
                  <div id="faqCollapse${categoryIndex}_${index}" class="collapse" aria-labelledby="faqHeading${categoryIndex}_${index}" data-parent="#faqAccordion${categoryIndex}">
                    <div class="card-body">
                      ${item.answer}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
    
    // Add event listeners to action buttons
    container.querySelectorAll('.edit-faq').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const faqId = button.getAttribute('data-id');
        this.editFAQ(faqId);
      });
    });
    
    container.querySelectorAll('.delete-faq').forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const faqId = button.getAttribute('data-id');
        this.deleteFAQ(faqId);
      });
    });
  }
  
  showAddContentModal() {
    // Determine modal content based on current section
    let modalTitle = `إضافة ${this.contentTypes[this.currentSection].title.slice(0, -1)} جديد`;
    let modalBody = '';
    
    switch (this.currentSection) {
      case 'pages':
        modalBody = this.getPageFormHTML();
        break;
      case 'sliders':
        modalBody = this.getSliderFormHTML();
        break;
      case 'testimonials':
        modalBody = this.getTestimonialFormHTML();
        break;
      case 'gallery':
        modalBody = this.getGalleryFormHTML();
        break;
      case 'faq':
        modalBody = this.getFAQFormHTML();
        break;
    }
    
    // Show modal
    ModalManager.show({
      title: modalTitle,
      size: 'lg',
      body: modalBody,
      footer: `
        <button type="button" class="btn btn-secondary" data-dismiss="modal">إلغاء</button>
        <button type="button" class="btn btn-primary" id="save-content-btn">حفظ</button>
      `
    });
    
    // Initialize rich text editor if needed
    if (this.currentSection === 'pages') {
      this.initRichTextEditor('page-content');
    }
    
    // Add event listener to save button
    document.getElementById('save-content-btn').addEventListener('click', () => {
      this.saveContent();
    });
    
    // Add event listener to image upload if needed
    if (['sliders', 'testimonials', 'gallery'].includes(this.currentSection)) {
      document.getElementById(`${this.currentSection.slice(0, -1)}-image-upload`).addEventListener('change', (e) => {
        this.handleImageUpload(e, `${this.currentSection.slice(0, -1)}-image-preview`);
      });
    }
  }
  
  getPageFormHTML() {
    return `
      <form id="page-form">
        <div class="row">
          <div class="col-md-8">
            <div class="form-group">
              <label for="page-title">عنوان الصفحة <span class="text-danger">*</span></label>
              <input type="text" id="page-title" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label for="page-slug">المسار (Slug) <span class="text-danger">*</span></label>
              <input type="text" id="page-slug" class="form-control" required>
              <small class="form-text text-muted">المسار يجب أن يكون فريداً ويحتوي على أحرف إنجليزية وأرقام وشرطات فقط</small>
            </div>
            
            <div class="form-group">
              <label for="page-content">محتوى الصفحة <span class="text-danger">*</span></label>
              <textarea id="page-content" class="form-control rich-editor" rows="10" required></textarea>
            </div>
          </div>
          
          <div class="col-md-4">
            <div class="card">
              <div class="card-header">
                <h5>إعدادات الصفحة</h5>
              </div>
              <div class="card-body">
                <div class="form-group">
                  <label for="page-meta-title">عنوان الميتا (SEO)</label>
                  <input type="text" id="page-meta-title" class="form-control">
                </div>
                
                <div class="form-group">
                  <label for="page-meta-description">وصف الميتا (SEO)</label>
                  <textarea id="page-meta-description" class="form-control" rows="3"></textarea>
                </div>
                
                <div class="form-group">
                  <label for="page-meta-keywords">الكلمات المفتاحية (SEO)</label>
                  <input type="text" id="page-meta-keywords" class="form-control">
                  <small class="form-text text-muted">افصل بين الكلمات المفتاحية بفواصل</small>
                </div>
                
                <div class="form-group">
                  <div class="custom-control custom-switch">
                    <input type="checkbox" class="custom-control-input" id="page-published" checked>
                    <label class="custom-control-label" for="page-published">نشر الصفحة</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="alert alert-danger mt-3" id="page-form-error" style="display: none;"></div>
      </form>
    `;
  }
  
  getSliderFormHTML() {
    return `
      <form id="slider-form">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="slider-title">العنوان <span class="text-danger">*</span></label>
              <input type="text" id="slider-title" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label for="slider-subtitle">العنوان الفرعي</label>
              <input type="text" id="slider-subtitle" class="form-control">
            </div>
            
            <div class="form-group">
              <label for="slider-button-text">نص الزر</label>
              <input type="text" id="slider-button-text" class="form-control">
            </div>
            
            <div class="form-group">
              <label for="slider-button-url">رابط الزر</label>
              <input type="text" id="slider-button-url" class="form-control">
            </div>
            
            <div class="form-group">
              <label for="slider-order">الترتيب</label>
              <input type="number" id="slider-order" class="form-control" min="0" value="0">
            </div>
            
            <div class="form-group">
              <div class="custom-control custom-switch">
                <input type="checkbox" class="custom-control-input" id="slider-active" checked>
                <label class="custom-control-label" for="slider-active">نشط</label>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="form-group">
              <label for="slider-image-upload">الصورة <span class="text-danger">*</span></label>
              <div class="custom-file">
                <input type="file" class="custom-file-input" id="slider-image-upload" accept="image/*" required>
                <label class="custom-file-label" for="slider-image-upload">اختر صورة</label>
              </div>
              <small class="form-text text-muted">الحجم الموصى به: 1920×600 بكسل</small>
            </div>
            
            <div class="form-group">
              <div class="image-preview-container">
                <div id="slider-image-preview" class="image-preview">
                  <div class="no-image">
                    <i class="fas fa-image"></i>
                    <p>معاينة الصورة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="alert alert-danger mt-3" id="slider-form-error" style="display: none;"></div>
      </form>
    `;
  }
  
  getTestimonialFormHTML() {
    return `
      <form id="testimonial-form">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="testimonial-name">الاسم <span class="text-danger">*</span></label>
              <input type="text" id="testimonial-name" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label for="testimonial-position">المسمى الوظيفي</label>
              <input type="text" id="testimonial-position" class="form-control">
            </div>
            
            <div class="form-group">
              <label for="testimonial-content">المحتوى <span class="text-danger">*</span></label>
              <textarea id="testimonial-content" class="form-control" rows="5" required></textarea>
            </div>
            
            <div class="form-group">
              <label for="testimonial-rating">التقييم</label>
              <select id="testimonial-rating" class="form-control">
                <option value="5">5 نجوم</option>
                <option value="4">4 نجوم</option>
                <option value="3">3 نجوم</option>
                <option value="2">2 نجوم</option>
                <option value="1">1 نجمة</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="testimonial-date">التاريخ</label>
              <input type="date" id="testimonial-date" class="form-control">
            </div>
            
            <div class="form-group">
              <div class="custom-control custom-switch">
                <input type="checkbox" class="custom-control-input" id="testimonial-active" checked>
                <label class="custom-control-label" for="testimonial-active">نشط</label>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="form-group">
              <label for="testimonial-image-upload">الصورة الشخصية</label>
              <div class="custom-file">
                <input type="file" class="custom-file-input" id="testimonial-image-upload" accept="image/*">
                <label class="custom-file-label" for="testimonial-image-upload">اختر صورة</label>
              </div>
              <small class="form-text text-muted">الحجم الموصى به: 200×200 بكسل</small>
            </div>
            
            <div class="form-group">
              <div class="image-preview-container">
                <div id="testimonial-image-preview" class="image-preview">
                  <div class="no-image">
                    <i class="fas fa-user"></i>
                    <p>معاينة الصورة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="alert alert-danger mt-3" id="testimonial-form-error" style="display: none;"></div>
      </form>
    `;
  }
  
  getGalleryFormHTML() {
    return `
      <form id="gallery-form">
        <div class="row">
          <div class="col-md-6">
            <div class="form-group">
              <label for="gallery-title">العنوان <span class="text-danger">*</span></label>
              <input type="text" id="gallery-title" class="form-control" required>
            </div>
            
            <div class="form-group">
              <label for="gallery-description">الوصف</label>
              <textarea id="gallery-description" class="form-control" rows="3"></textarea>
            </div>
            
            <div class="form-group">
              <label for="gallery-category">التصنيف</label>
              <input type="text" id="gallery-category" class="form-control" value="عام">
            </div>
            
            <div class="form-group">
              <label for="gallery-order">الترتيب</label>
              <input type="number" id="gallery-order" class="form-control" min="0" value="0">
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="form-group">
              <label for="gallery-image-upload">الصورة <span class="text-danger">*</span></label>
              <div class="custom-file">
                <input type="file" class="custom-file-input" id="gallery-image-upload" accept="image/*" required>
                <label class="custom-file-label" for="gallery-image-upload">اختر صورة</label>
              </div>
            </div>
            
            <div class="form-group">
              <div class="image-preview-container">
                <div id="gallery-image-preview" class="image-preview">
                  <div class="no-image">
                    <i class="fas fa-image"></i>
                    <p>معاينة الصورة</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="alert alert-danger mt-3" id="gallery-form-error" style="display: none;"></div>
      </form>
    `;
  }
  
  getFAQFormHTML() {
    return `
      <form id="faq-form">
        <div class="form-group">
          <label for="faq-question">السؤال <span class="text-danger">*</span></label>
          <input type="text" id="faq-question" class="form-control" required>
        </div>
        
        <div class="form-group">
          <label for="faq-answer">الإجابة <span class="text-danger">*</span></label>
          <textarea id="faq-answer" class="form-control" rows="5" required></textarea>
        </div>
        
        <div class="form-group">
          <label for="faq-category">التصنيف</label>
          <input type="text" id="faq-category" class="form-control" value="عام">
        </div>
        
        <div class="form-group">
          <label for="faq-order">الترتيب</label>
          <input type="number" id="faq-order" class="form-control" min="0" value="0">
        </div>
        
        <div class="form-group">
          <div class="custom-control custom-switch">
            <input type="checkbox" class="custom-control-input" id="faq-active" checked>
            <label class="custom-control-label" for="faq-active">نشط</label>
          </div>
        </div>
        
        <div class="alert alert-danger mt-3" id="faq-form-error" style="display: none;"></div>
      </form>
    `;
  }
  
  initRichTextEditor(elementId) {
    // Initialize rich text editor (using a simple implementation for demo)
    // In a real implementation, you would use a library like CKEditor, TinyMCE, etc.
    const editor = document.getElementById(elementId);
    
    // Add basic toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'rich-editor-toolbar';
    toolbar.innerHTML = `
      <button type="button" class="btn btn-sm btn-light" data-command="bold" title="Bold"><i class="fas fa-bold"></i></button>
      <button type="button" class="btn btn-sm btn-light" data-command="italic" title="Italic"><i class="fas fa-italic"></i></button>
      <button type="button" class="btn btn-sm btn-light" data-command="underline" title="Underline"><i class="fas fa-underline"></i></button>
      <button type="button" class="btn btn-sm btn-light" data-command="strikeThrough" title="Strike Through"><i class="fas fa-strikethrough"></i></button>
      <div class="btn-group">
        <button type="button" class="btn btn-sm btn-light" data-command="justifyLeft" title="Align Left"><i class="fas fa-align-left"></i></button>
        <button type="button" class="btn btn-sm btn-light" data-command="justifyCenter" title="Align Center"><i class="fas fa-align-center"></i></button>
        <button type="button" class="btn btn-sm btn-light" data-command="justifyRight" title="Align Right"><i class="fas fa-align-right"></i></button>
      </div>
      <div class="btn-group">
        <button type="button" class="btn btn-sm btn-light" data-command="insertUnorderedList" title="Bullet List"><i class="fas fa-list-ul"></i></button>
        <button type="button" class="btn btn-sm btn-light" data-command="insertOrderedList" title="Numbered List"><i class="fas fa-list-ol"></i></button>
      </div>
      <button type="button" class="btn btn-sm btn-light" data-command="createLink" title="Insert Link"><i class="fas fa-link"></i></button>
      <button type="button" class="btn btn-sm btn-light" data-command="insertImage" title="Insert Image"><i class="fas fa-image"></i></button>
    `;
    
    // Insert toolbar before editor
    editor.parentNode.insertBefore(toolbar, editor);
    
    // Create editable div
    const editorContainer = document.createElement('div');
    editorContainer.className = 'rich-editor-container';
    editorContainer.contentEditable = true;
    editorContainer.innerHTML = editor.value;
    
    // Replace textarea with editable div
    editor.style.display = 'none';
    editor.parentNode.insertBefore(editorContainer, editor.nextSibling);
    
    // Add event listeners to toolbar buttons
    toolbar.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        const command = button.getAttribute('data-command');
        
        if (command === 'createLink') {
          const url = prompt('أدخل الرابط:');
          if (url) document.execCommand(command, false, url);
        } else if (command === 'insertImage') {
          const url = prompt('أدخل رابط الصورة:');
          if (url) document.execCommand(command, false, url);
        } else {
          document.execCommand(command, false, null);
        }
        
        // Update textarea value
        editor.value = editorContainer.innerHTML;
      });
    });
    
    // Update textarea on input
    editorContainer.addEventListener('input', () => {
      editor.value = editorContainer.innerHTML;
    });
  }
  
  handleImageUpload(event, previewId) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.match('image.*')) {
      this.app.ui.notifications.show('error', 'خطأ', 'يرجى اختيار ملف صورة صالح');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      this.app.ui.notifications.show('error', 'خطأ', 'حجم الصورة كبير جداً. الحد الأقصى هو 5 ميجابايت');
      return;
    }
    
    // Create file reader
    const reader = new FileReader();
    
    // Set preview image when loaded
    reader.onload = (e) => {
      const preview = document.getElementById(previewId);
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      preview.dataset.file = file.name;
      preview.dataset.base64 = e.target.result;
    };
    
    // Read file as data URL
    reader.readAsDataURL(file);
  }
  
  async saveContent() {
    try {
      // Get form values based on current section
      let data = {};
      let formError = null;
      
      switch (this.currentSection) {
        case 'pages':
          data = this.getPageFormData();
          formError = document.getElementById('page-form-error');
          break;
        case 'sliders':
          data = this.getSliderFormData();
          formError = document.getElementById('slider-form-error');
          break;
        case 'testimonials':
          data = this.getTestimonialFormData();
          formError = document.getElementById('testimonial-form-error');
          break;
        case 'gallery':
          data = this.getGalleryFormData();
          formError = document.getElementById('gallery-form-error');
          break;
        case 'faq':
          data = this.getFAQFormData();
          formError = document.getElementById('faq-form-error');
          break;
      }
      
      // Validate data
      if (!data) {
        return;
      }
      
      // Disable save button
      const saveButton = document.getElementById('save-content-btn');
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      
      // Send request
      const response = await ApiClient.post(`${this.apiBaseUrl}/content/${this.currentSection}`, data);
      
      // Enable save button
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
      
      if (!response.success) {
        formError.textContent = response.message || `فشل إضافة ${this.contentTypes[this.currentSection].title.slice(0, -1)} جديد`;
        formError.style.display = 'block';
        return;
      }
      
      // Hide modal
      ModalManager.hide();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', `تم إضافة ${this.contentTypes[this.currentSection].title.slice(0, -1)} جديد بنجاح`);
      
      // Reload content
      this.loadContent(this.currentSection);
    } catch (error) {
      console.error(`Save ${this.currentSection} error:`, error);
      const formError = document.getElementById(`${this.currentSection.slice(0, -1)}-form-error`);
      formError.textContent = `حدث خطأ أثناء إضافة ${this.contentTypes[this.currentSection].title.slice(0, -1)} جديد`;
      formError.style.display = 'block';
      
      // Enable save button
      const saveButton = document.getElementById('save-content-btn');
      saveButton.disabled = false;
      saveButton.innerHTML = 'حفظ';
    }
  }
  
  getPageFormData() {
    const title = document.getElementById('page-title').value;
    const slug = document.getElementById('page-slug').value;
    const content = document.getElementById('page-content').value;
    const metaTitle = document.getElementById('page-meta-title').value;
    const metaDescription = document.getElementById('page-meta-description').value;
    const metaKeywords = document.getElementById('page-meta-keywords').value;
    const published = document.getElementById('page-published').checked;
    
    // Validate required fields
    if (!title || !slug || !content) {
      document.getElementById('page-form-error').textContent = 'يرجى ملء جميع الحقول المطلوبة';
      document.getElementById('page-form-error').style.display = 'block';
      return null;
    }
    
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      document.getElementById('page-form-error').textContent = 'المسار يجب أن يحتوي على أحرف إنجليزية صغيرة وأرقام وشرطات فقط';
      document.getElementById('page-form-error').style.display = 'block';
      return null;
    }
    
    return {
      title,
      slug,
      content,
      meta: {
        title: metaTitle || title,
        description: metaDescription,
        keywords: metaKeywords
      },
      published
    };
  }
  
  getSliderFormData() {
    const title = document.getElementById('slider-title').value;
    const subtitle = document.getElementById('slider-subtitle').value;
    const buttonText = document.getElementById('slider-button-text').value;
    const buttonUrl = document.getElementById('slider-button-url').value;
    const order = parseInt(document.getElementById('slider-order').value) || 0;
    const active = document.getElementById('slider-active').checked;
    
    // Get image data
    const imagePreview = document.getElementById('slider-image-preview');
    const imageBase64 = imagePreview.dataset.base64;
    
    // Validate required fields
    if (!title || !imageBase64) {
      document.getElementById('slider-form-error').textContent = 'يرجى ملء جميع الحقول المطلوبة واختيار صورة';
      document.getElementById('slider-form-error').style.display = 'block';
      return null;
    }
    
    return {
      title,
      subtitle,
      buttonText,
      buttonUrl,
      order,
      active,
      image: imageBase64
    };
  }
  
  getTestimonialFormData() {
    const name = document.getElementById('testimonial-name').value;
    const position = document.getElementById('testimonial-position').value;
    const content = document.getElementById('testimonial-content').value;
    const rating = parseInt(document.getElementById('testimonial-rating').value) || 5;
    const date = document.getElementById('testimonial-date').value;
    const active = document.getElementById('testimonial-active').checked;
    
    // Get avatar data
    const imagePreview = document.getElementById('testimonial-image-preview');
    const imageBase64 = imagePreview.dataset.base64;
    
    // Validate required fields
    if (!name || !content) {
      document.getElementById('testimonial-form-error').textContent = 'يرجى ملء جميع الحقول المطلوبة';
      document.getElementById('testimonial-form-error').style.display = 'block';
      return null;
    }
    
    const data = {
      name,
      position,
      content,
      rating,
      active
    };
    
    // Add optional fields
    if (date) {
      data.date = date;
    }
    
    if (imageBase64) {
      data.avatar = imageBase64;
    }
    
    return data;
  }
  
  getGalleryFormData() {
    const title = document.getElementById('gallery-title').value;
    const description = document.getElementById('gallery-description').value;
    const category = document.getElementById('gallery-category').value;
    const order = parseInt(document.getElementById('gallery-order').value) || 0;
    
    // Get image data
    const imagePreview = document.getElementById('gallery-image-preview');
    const imageBase64 = imagePreview.dataset.base64;
    
    // Validate required fields
    if (!title || !imageBase64) {
      document.getElementById('gallery-form-error').textContent = 'يرجى ملء جميع الحقول المطلوبة واختيار صورة';
      document.getElementById('gallery-form-error').style.display = 'block';
      return null;
    }
    
    return {
      title,
      description,
      category,
      order,
      image: imageBase64
    };
  }
  
  getFAQFormData() {
    const question = document.getElementById('faq-question').value;
    const answer = document.getElementById('faq-answer').value;
    const category = document.getElementById('faq-category').value;
    const order = parseInt(document.getElementById('faq-order').value) || 0;
    const active = document.getElementById('faq-active').checked;
    
    // Validate required fields
    if (!question || !answer) {
      document.getElementById('faq-form-error').textContent = 'يرجى ملء جميع الحقول المطلوبة';
      document.getElementById('faq-form-error').style.display = 'block';
      return null;
    }
    
    return {
      question,
      answer,
      category,
      order,
      active
    };
  }
  
  async viewPage(pageId) {
    try {
      this.app.showLoader();
      
      // Fetch page details
      const response = await ApiClient.get(`${this.apiBaseUrl}/content/pages/${pageId}`);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات الصفحة');
        return;
      }
      
      const page = response.data;
      
      // Show page details modal
      ModalManager.show({
        title: `عرض الصفحة: ${page.title}`,
        size: 'lg',
        body: `
          <div class="page-view-container">
            <div class="page-view-header">
              <div class="page-view-title">${page.title}</div>
              <div class="page-view-slug">المسار: ${page.slug}</div>
              <div class="page-view-status">
                <span class="badge ${page.published ? 'badge-success' : 'badge-secondary'}">
                  ${page.published ? 'منشور' : 'مسودة'}
                </span>
              </div>
            </div>
            
            <div class="page-view-meta">
              <div class="page-view-meta-item">
                <div class="page-view-meta-label">عنوان الميتا:</div>
                <div class="page-view-meta-value">${page.meta && page.meta.title || page.title}</div>
              </div>
              ${page.meta && page.meta.description ? `
                <div class="page-view-meta-item">
                  <div class="page-view-meta-label">وصف الميتا:</div>
                  <div class="page-view-meta-value">${page.meta.description}</div>
                </div>
              ` : ''}
              ${page.meta && page.meta.keywords ? `
                <div class="page-view-meta-item">
                  <div class="page-view-meta-label">الكلمات المفتاحية:</div>
                  <div class="page-view-meta-value">${page.meta.keywords}</div>
                </div>
              ` : ''}
            </div>
            
            <div class="page-view-content">
              <h5>محتوى الصفحة:</h5>
              <div class="page-content-preview">
                ${page.content}
              </div>
            </div>
            
            <div class="page-view-footer">
              <div class="page-view-dates">
                <div>تاريخ الإنشاء: ${new Date(page.createdAt).toLocaleString('ar-SA')}</div>
                <div>آخر تحديث: ${new Date(page.updatedAt).toLocaleString('ar-SA')}</div>
              </div>
            </div>
          </div>
        `,
        footer: `
          <button type="button" class="btn btn-secondary" data-dismiss="modal">إغلاق</button>
          <button type="button" class="btn btn-primary edit-page-btn" data-id="${page._id}">تعديل</button>
        `
      });
      
      // Add event listener to edit button
      document.querySelector('.edit-page-btn').addEventListener('click', () => {
        ModalManager.hide();
        this.editPage(pageId);
      });
    } catch (error) {
      console.error('View page error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات الصفحة');
    }
  }
  
  async editPage(pageId) {
    try {
      this.app.showLoader();
      
      // Fetch page details
      const response = await ApiClient.get(`${this.apiBaseUrl}/content/pages/${pageId}`);
      
      this.app.hideLoader();
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل تحميل بيانات الصفحة');
        return;
      }
      
      const page = response.data;
      
      // Show edit page modal
      ModalManager.show({
        title: `تعديل الصفحة: ${page.title}`,
        size: 'lg',
        body: this.getPageFormHTML(),
        footer: `
          <button type="button" class="btn btn-secondary" data-dismiss="modal">إلغاء</button>
          <button type="button" class="btn btn-primary" id="update-page-btn">حفظ</button>
        `
      });
      
      // Initialize rich text editor
      this.initRichTextEditor('page-content');
      
      // Fill form with page data
      document.getElementById('page-title').value = page.title;
      document.getElementById('page-slug').value = page.slug;
      document.getElementById('page-content').value = page.content;
      document.querySelector('.rich-editor-container').innerHTML = page.content;
      
      if (page.meta) {
        document.getElementById('page-meta-title').value = page.meta.title || '';
        document.getElementById('page-meta-description').value = page.meta.description || '';
        document.getElementById('page-meta-keywords').value = page.meta.keywords || '';
      }
      
      document.getElementById('page-published').checked = page.published;
      
      // Add event listener to update button
      document.getElementById('update-page-btn').addEventListener('click', () => {
        this.updatePage(pageId);
      });
    } catch (error) {
      console.error('Edit page error:', error);
      this.app.hideLoader();
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء تحميل بيانات الصفحة');
    }
  }
  
  async updatePage(pageId) {
    try {
      // Get form data
      const data = this.getPageFormData();
      
      // Validate data
      if (!data) {
        return;
      }
      
      // Disable update button
      const updateButton = document.getElementById('update-page-btn');
      updateButton.disabled = true;
      updateButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      
      // Send request
      const response = await ApiClient.put(`${this.apiBaseUrl}/content/pages/${pageId}`, data);
      
      // Enable update button
      updateButton.disabled = false;
      updateButton.innerHTML = 'حفظ';
      
      if (!response.success) {
        document.getElementById('page-form-error').textContent = response.message || 'فشل تحديث بيانات الصفحة';
        document.getElementById('page-form-error').style.display = 'block';
        return;
      }
      
      // Hide modal
      ModalManager.hide();
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم تحديث بيانات الصفحة بنجاح');
      
      // Reload content
      this.loadContent('pages');
    } catch (error) {
      console.error('Update page error:', error);
      document.getElementById('page-form-error').textContent = 'حدث خطأ أثناء تحديث بيانات الصفحة';
      document.getElementById('page-form-error').style.display = 'block';
      
      // Enable update button
      const updateButton = document.getElementById('update-page-btn');
      updateButton.disabled = false;
      updateButton.innerHTML = 'حفظ';
    }
  }
  
  deletePage(pageId) {
    // Show confirmation dialog
    ModalManager.confirm(
      'حذف الصفحة',
      'هل أنت متأكد من رغبتك في حذف هذه الصفحة؟ لا يمكن التراجع عن هذا الإجراء.',
      async () => {
        try {
          this.app.showLoader();
          
          // Send delete request
          const response = await ApiClient.delete(`${this.apiBaseUrl}/content/pages/${pageId}`);
          
          this.app.hideLoader();
          
          if (!response.success) {
            this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل حذف الصفحة');
            return;
          }
          
          // Show success notification
          this.app.ui.notifications.show('success', 'تم بنجاح', 'تم حذف الصفحة بنجاح');
          
          // Reload content
          this.loadContent('pages');
        } catch (error) {
          console.error('Delete page error:', error);
          this.app.hideLoader();
          this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء حذف الصفحة');
        }
      }
    );
  }
  
  // Similar methods for other content types (sliders, testimonials, gallery, FAQ)
  // These would follow the same pattern as the page methods above
  
  editSlider(sliderId) {
    // Implementation similar to editPage
  }
  
  updateSlider(sliderId) {
    // Implementation similar to updatePage
  }
  
  deleteSlider(sliderId) {
    // Implementation similar to deletePage
  }
  
  editTestimonial(testimonialId) {
    // Implementation similar to editPage
  }
  
  updateTestimonial(testimonialId) {
    // Implementation similar to updatePage
  }
  
  deleteTestimonial(testimonialId) {
    // Implementation similar to deletePage
  }
  
  editGalleryItem(itemId) {
    // Implementation similar to editPage
  }
  
  updateGalleryItem(itemId) {
    // Implementation similar to updatePage
  }
  
  deleteGalleryItem(itemId) {
    // Implementation similar to deletePage
  }
  
  editFAQ(faqId) {
    // Implementation similar to editPage
  }
  
  updateFAQ(faqId) {
    // Implementation similar to updatePage
  }
  
  deleteFAQ(faqId) {
    // Implementation similar to deletePage
  }
}
