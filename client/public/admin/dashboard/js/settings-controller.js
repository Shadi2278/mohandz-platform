// Settings Controller for Mohandz Admin Dashboard
// Handles system settings management operations

class SettingsController {
  constructor(app) {
    this.app = app;
    this.apiBaseUrl = app.apiBaseUrl;
    this.mainContent = app.ui.mainContent;
    this.currentUser = app.currentUser;
    this.currentSection = 'general';
    this.settingsSections = {
      general: { title: 'الإعدادات العامة', icon: 'cog' },
      appearance: { title: 'المظهر والتصميم', icon: 'palette' },
      contact: { title: 'معلومات الاتصال', icon: 'address-card' },
      social: { title: 'وسائل التواصل الاجتماعي', icon: 'share-alt' },
      seo: { title: 'تحسين محركات البحث', icon: 'search' },
      email: { title: 'إعدادات البريد الإلكتروني', icon: 'envelope' },
      security: { title: 'الأمان والخصوصية', icon: 'shield-alt' }
    };
  }
  
  async init() {
    try {
      // Render settings template
      this.renderSettingsTemplate();
      
      // Initialize event listeners
      this.initEventListeners();
      
      // Load settings data for default section
      await this.loadSettings(this.currentSection);
      
      // Hide loader
      this.app.hideLoader();
    } catch (error) {
      console.error('Settings initialization error:', error);
      this.mainContent.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل الإعدادات
        </div>
      `;
      this.app.hideLoader();
    }
  }
  
  renderSettingsTemplate() {
    this.mainContent.innerHTML = `
      <div class="settings-container">
        <div class="page-header">
          <div>
            <h1><i class="fas fa-cogs"></i> إعدادات النظام</h1>
            <p>تخصيص وإدارة إعدادات المنصة</p>
          </div>
        </div>
        
        <div class="row">
          <div class="col-md-3">
            <div class="card">
              <div class="card-header">
                <h5>أقسام الإعدادات</h5>
              </div>
              <div class="card-body p-0">
                <div class="settings-nav">
                  <ul class="nav flex-column">
                    ${Object.entries(this.settingsSections).map(([key, value]) => `
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
                <h5 id="settings-section-title">${this.settingsSections[this.currentSection].title}</h5>
                <button id="save-settings-btn" class="btn btn-primary">
                  <i class="fas fa-save"></i> حفظ الإعدادات
                </button>
              </div>
              <div class="card-body">
                <div id="settings-form-container">
                  <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                      <span class="sr-only">جاري التحميل...</span>
                    </div>
                    <p class="mt-2">جاري تحميل الإعدادات...</p>
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
    // Settings section navigation
    document.querySelectorAll('.settings-nav .nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.currentTarget.getAttribute('data-section');
        this.changeSection(section);
      });
    });
    
    // Save settings button
    document.getElementById('save-settings-btn').addEventListener('click', () => {
      this.saveSettings();
    });
  }
  
  async changeSection(section) {
    if (section === this.currentSection) return;
    
    // Check for unsaved changes
    if (this.hasUnsavedChanges()) {
      const confirmed = await new Promise(resolve => {
        ModalManager.confirm(
          'تغييرات غير محفوظة',
          'لديك تغييرات غير محفوظة. هل تريد المتابعة بدون حفظ التغييرات؟',
          () => resolve(true),
          () => resolve(false)
        );
      });
      
      if (!confirmed) return;
    }
    
    // Update current section
    this.currentSection = section;
    
    // Update UI
    document.querySelectorAll('.settings-nav .nav-link').forEach(link => {
      if (link.getAttribute('data-section') === section) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
    
    // Update section title
    document.getElementById('settings-section-title').textContent = this.settingsSections[section].title;
    
    // Show loader
    document.getElementById('settings-form-container').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="sr-only">جاري التحميل...</span>
        </div>
        <p class="mt-2">جاري تحميل الإعدادات...</p>
      </div>
    `;
    
    // Load settings for selected section
    await this.loadSettings(section);
  }
  
  hasUnsavedChanges() {
    // Check if form has been modified
    const form = document.getElementById('settings-form');
    if (!form) return false;
    
    return form.dataset.modified === 'true';
  }
  
  async loadSettings(section) {
    try {
      // Fetch settings based on section
      const response = await ApiClient.get(`${this.apiBaseUrl}/settings/${section}`);
      
      if (!response.success) {
        throw new Error(response.message || `فشل تحميل ${this.settingsSections[section].title}`);
      }
      
      // Render settings form based on section
      this.renderSettingsForm(section, response.data);
    } catch (error) {
      console.error(`Load ${section} settings error:`, error);
      document.getElementById('settings-form-container').innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          حدث خطأ أثناء تحميل ${this.settingsSections[section].title}
        </div>
      `;
    }
  }
  
  renderSettingsForm(section, settings) {
    const container = document.getElementById('settings-form-container');
    
    // Generate form based on section
    let formHTML = '';
    
    switch (section) {
      case 'general':
        formHTML = this.renderGeneralSettingsForm(settings);
        break;
      case 'appearance':
        formHTML = this.renderAppearanceSettingsForm(settings);
        break;
      case 'contact':
        formHTML = this.renderContactSettingsForm(settings);
        break;
      case 'social':
        formHTML = this.renderSocialSettingsForm(settings);
        break;
      case 'seo':
        formHTML = this.renderSEOSettingsForm(settings);
        break;
      case 'email':
        formHTML = this.renderEmailSettingsForm(settings);
        break;
      case 'security':
        formHTML = this.renderSecuritySettingsForm(settings);
        break;
      default:
        formHTML = `
          <div class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            قسم إعدادات غير معروف
          </div>
        `;
    }
    
    // Render form
    container.innerHTML = `
      <form id="settings-form" data-section="${section}" data-modified="false">
        ${formHTML}
        <div class="alert alert-danger mt-3" id="settings-form-error" style="display: none;"></div>
        <div class="alert alert-success mt-3" id="settings-form-success" style="display: none;"></div>
      </form>
    `;
    
    // Add change event listener to form inputs
    const form = document.getElementById('settings-form');
    form.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('change', () => {
        form.dataset.modified = 'true';
      });
    });
    
    // Initialize color pickers if needed
    if (section === 'appearance') {
      this.initColorPickers();
    }
    
    // Initialize image uploads if needed
    if (['general', 'appearance'].includes(section)) {
      this.initImageUploads();
    }
  }
  
  renderGeneralSettingsForm(settings) {
    return `
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="site-name">اسم الموقع <span class="text-danger">*</span></label>
            <input type="text" id="site-name" name="siteName" class="form-control" value="${settings.siteName || 'منصة مهندز'}" required>
          </div>
          
          <div class="form-group">
            <label for="site-description">وصف الموقع</label>
            <textarea id="site-description" name="siteDescription" class="form-control" rows="3">${settings.siteDescription || 'منصة للخدمات الهندسية'}</textarea>
          </div>
          
          <div class="form-group">
            <label for="site-language">لغة الموقع</label>
            <select id="site-language" name="siteLanguage" class="form-control">
              <option value="ar" ${(settings.siteLanguage || 'ar') === 'ar' ? 'selected' : ''}>العربية</option>
              <option value="en" ${(settings.siteLanguage || 'ar') === 'en' ? 'selected' : ''}>الإنجليزية</option>
              <option value="both" ${(settings.siteLanguage || 'ar') === 'both' ? 'selected' : ''}>ثنائي اللغة</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="site-currency">العملة الافتراضية</label>
            <select id="site-currency" name="siteCurrency" class="form-control">
              <option value="SAR" ${(settings.siteCurrency || 'SAR') === 'SAR' ? 'selected' : ''}>ريال سعودي (SAR)</option>
              <option value="USD" ${(settings.siteCurrency || 'SAR') === 'USD' ? 'selected' : ''}>دولار أمريكي (USD)</option>
              <option value="EUR" ${(settings.siteCurrency || 'SAR') === 'EUR' ? 'selected' : ''}>يورو (EUR)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="site-timezone">المنطقة الزمنية</label>
            <select id="site-timezone" name="siteTimezone" class="form-control">
              <option value="Asia/Riyadh" ${(settings.siteTimezone || 'Asia/Riyadh') === 'Asia/Riyadh' ? 'selected' : ''}>الرياض (GMT+3)</option>
              <option value="Asia/Dubai" ${(settings.siteTimezone || 'Asia/Riyadh') === 'Asia/Dubai' ? 'selected' : ''}>دبي (GMT+4)</option>
              <option value="Asia/Jerusalem" ${(settings.siteTimezone || 'Asia/Riyadh') === 'Asia/Jerusalem' ? 'selected' : ''}>القدس (GMT+2)</option>
              <option value="Europe/Istanbul" ${(settings.siteTimezone || 'Asia/Riyadh') === 'Europe/Istanbul' ? 'selected' : ''}>إسطنبول (GMT+3)</option>
            </select>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="form-group">
            <label for="site-logo-upload">شعار الموقع</label>
            <div class="custom-file">
              <input type="file" class="custom-file-input" id="site-logo-upload" accept="image/*">
              <label class="custom-file-label" for="site-logo-upload">اختر صورة</label>
            </div>
            <small class="form-text text-muted">الحجم الموصى به: 200×60 بكسل</small>
          </div>
          
          <div class="form-group">
            <div class="image-preview-container">
              <div id="site-logo-preview" class="image-preview">
                ${settings.siteLogo ? `<img src="${settings.siteLogo}" alt="شعار الموقع">` : `
                  <div class="no-image">
                    <i class="fas fa-image"></i>
                    <p>لا يوجد شعار</p>
                  </div>
                `}
              </div>
              <input type="hidden" name="siteLogo" value="${settings.siteLogo || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="site-favicon-upload">أيقونة الموقع (Favicon)</label>
            <div class="custom-file">
              <input type="file" class="custom-file-input" id="site-favicon-upload" accept="image/*">
              <label class="custom-file-label" for="site-favicon-upload">اختر صورة</label>
            </div>
            <small class="form-text text-muted">الحجم الموصى به: 32×32 بكسل</small>
          </div>
          
          <div class="form-group">
            <div class="image-preview-container">
              <div id="site-favicon-preview" class="image-preview favicon-preview">
                ${settings.siteFavicon ? `<img src="${settings.siteFavicon}" alt="أيقونة الموقع">` : `
                  <div class="no-image">
                    <i class="fas fa-image"></i>
                    <p>لا توجد أيقونة</p>
                  </div>
                `}
              </div>
              <input type="hidden" name="siteFavicon" value="${settings.siteFavicon || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="site-maintenance" name="maintenanceMode" ${settings.maintenanceMode ? 'checked' : ''}>
              <label class="custom-control-label" for="site-maintenance">وضع الصيانة</label>
            </div>
            <small class="form-text text-muted">عند تفعيل وضع الصيانة، سيتم عرض صفحة الصيانة للزوار</small>
          </div>
          
          <div class="form-group">
            <label for="maintenance-message">رسالة الصيانة</label>
            <textarea id="maintenance-message" name="maintenanceMessage" class="form-control" rows="3">${settings.maintenanceMessage || 'الموقع قيد الصيانة حالياً، يرجى المحاولة لاحقاً.'}</textarea>
          </div>
        </div>
      </div>
    `;
  }
  
  renderAppearanceSettingsForm(settings) {
    return `
      <div class="row">
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">الألوان الرئيسية</h5>
          
          <div class="form-group">
            <label for="primary-color">اللون الرئيسي</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text color-preview" style="background-color: ${settings.primaryColor || '#007bff'}"></span>
              </div>
              <input type="text" id="primary-color" name="primaryColor" class="form-control color-input" value="${settings.primaryColor || '#007bff'}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="secondary-color">اللون الثانوي</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text color-preview" style="background-color: ${settings.secondaryColor || '#6c757d'}"></span>
              </div>
              <input type="text" id="secondary-color" name="secondaryColor" class="form-control color-input" value="${settings.secondaryColor || '#6c757d'}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="accent-color">لون التمييز</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text color-preview" style="background-color: ${settings.accentColor || '#ffc107'}"></span>
              </div>
              <input type="text" id="accent-color" name="accentColor" class="form-control color-input" value="${settings.accentColor || '#ffc107'}">
            </div>
          </div>
          
          <h5 class="settings-section-subtitle mt-4">الخطوط</h5>
          
          <div class="form-group">
            <label for="main-font">الخط الرئيسي</label>
            <select id="main-font" name="mainFont" class="form-control">
              <option value="Cairo" ${(settings.mainFont || 'Cairo') === 'Cairo' ? 'selected' : ''}>Cairo</option>
              <option value="Tajawal" ${(settings.mainFont || 'Cairo') === 'Tajawal' ? 'selected' : ''}>Tajawal</option>
              <option value="Almarai" ${(settings.mainFont || 'Cairo') === 'Almarai' ? 'selected' : ''}>Almarai</option>
              <option value="Changa" ${(settings.mainFont || 'Cairo') === 'Changa' ? 'selected' : ''}>Changa</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="heading-font">خط العناوين</label>
            <select id="heading-font" name="headingFont" class="form-control">
              <option value="Cairo" ${(settings.headingFont || 'Cairo') === 'Cairo' ? 'selected' : ''}>Cairo</option>
              <option value="Tajawal" ${(settings.headingFont || 'Cairo') === 'Tajawal' ? 'selected' : ''}>Tajawal</option>
              <option value="Almarai" ${(settings.headingFont || 'Cairo') === 'Almarai' ? 'selected' : ''}>Almarai</option>
              <option value="Changa" ${(settings.headingFont || 'Cairo') === 'Changa' ? 'selected' : ''}>Changa</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="base-font-size">حجم الخط الأساسي</label>
            <select id="base-font-size" name="baseFontSize" class="form-control">
              <option value="14px" ${(settings.baseFontSize || '16px') === '14px' ? 'selected' : ''}>صغير (14px)</option>
              <option value="16px" ${(settings.baseFontSize || '16px') === '16px' ? 'selected' : ''}>متوسط (16px)</option>
              <option value="18px" ${(settings.baseFontSize || '16px') === '18px' ? 'selected' : ''}>كبير (18px)</option>
            </select>
          </div>
        </div>
        
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">الصور الخلفية</h5>
          
          <div class="form-group">
            <label for="hero-image-upload">صورة الغلاف الرئيسية</label>
            <div class="custom-file">
              <input type="file" class="custom-file-input" id="hero-image-upload" accept="image/*">
              <label class="custom-file-label" for="hero-image-upload">اختر صورة</label>
            </div>
            <small class="form-text text-muted">الحجم الموصى به: 1920×600 بكسل</small>
          </div>
          
          <div class="form-group">
            <div class="image-preview-container">
              <div id="hero-image-preview" class="image-preview hero-preview">
                ${settings.heroImage ? `<img src="${settings.heroImage}" alt="صورة الغلاف">` : `
                  <div class="no-image">
                    <i class="fas fa-image"></i>
                    <p>لا توجد صورة</p>
                  </div>
                `}
              </div>
              <input type="hidden" name="heroImage" value="${settings.heroImage || ''}">
            </div>
          </div>
          
          <h5 class="settings-section-subtitle mt-4">تخطيط الصفحة</h5>
          
          <div class="form-group">
            <label for="layout-style">نمط التخطيط</label>
            <select id="layout-style" name="layoutStyle" class="form-control">
              <option value="wide" ${(settings.layoutStyle || 'wide') === 'wide' ? 'selected' : ''}>واسع</option>
              <option value="boxed" ${(settings.layoutStyle || 'wide') === 'boxed' ? 'selected' : ''}>محدود</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="sidebar-position">موضع الشريط الجانبي</label>
            <select id="sidebar-position" name="sidebarPosition" class="form-control">
              <option value="right" ${(settings.sidebarPosition || 'right') === 'right' ? 'selected' : ''}>يمين</option>
              <option value="left" ${(settings.sidebarPosition || 'right') === 'left' ? 'selected' : ''}>يسار</option>
            </select>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-animations" name="enableAnimations" ${settings.enableAnimations !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-animations">تفعيل التأثيرات الحركية</label>
            </div>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-rtl" name="enableRTL" ${settings.enableRTL !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-rtl">تفعيل اتجاه RTL (من اليمين إلى اليسار)</label>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  renderContactSettingsForm(settings) {
    return `
      <div class="row">
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">معلومات الاتصال الرئيسية</h5>
          
          <div class="form-group">
            <label for="contact-email">البريد الإلكتروني</label>
            <input type="email" id="contact-email" name="contactEmail" class="form-control" value="${settings.contactEmail || ''}">
          </div>
          
          <div class="form-group">
            <label for="contact-phone">رقم الهاتف</label>
            <input type="text" id="contact-phone" name="contactPhone" class="form-control" value="${settings.contactPhone || ''}">
          </div>
          
          <div class="form-group">
            <label for="contact-whatsapp">رقم الواتساب</label>
            <input type="text" id="contact-whatsapp" name="contactWhatsapp" class="form-control" value="${settings.contactWhatsapp || ''}">
          </div>
          
          <div class="form-group">
            <label for="contact-fax">رقم الفاكس</label>
            <input type="text" id="contact-fax" name="contactFax" class="form-control" value="${settings.contactFax || ''}">
          </div>
          
          <div class="form-group">
            <label for="business-hours">ساعات العمل</label>
            <textarea id="business-hours" name="businessHours" class="form-control" rows="3">${settings.businessHours || 'الأحد - الخميس: 9:00 ص - 5:00 م'}</textarea>
          </div>
        </div>
        
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">العنوان</h5>
          
          <div class="form-group">
            <label for="address-line1">العنوان (السطر 1)</label>
            <input type="text" id="address-line1" name="addressLine1" class="form-control" value="${settings.addressLine1 || ''}">
          </div>
          
          <div class="form-group">
            <label for="address-line2">العنوان (السطر 2)</label>
            <input type="text" id="address-line2" name="addressLine2" class="form-control" value="${settings.addressLine2 || ''}">
          </div>
          
          <div class="form-group">
            <label for="address-city">المدينة</label>
            <input type="text" id="address-city" name="addressCity" class="form-control" value="${settings.addressCity || ''}">
          </div>
          
          <div class="form-group">
            <label for="address-state">المنطقة/المحافظة</label>
            <input type="text" id="address-state" name="addressState" class="form-control" value="${settings.addressState || ''}">
          </div>
          
          <div class="form-group">
            <label for="address-zip">الرمز البريدي</label>
            <input type="text" id="address-zip" name="addressZip" class="form-control" value="${settings.addressZip || ''}">
          </div>
          
          <div class="form-group">
            <label for="address-country">الدولة</label>
            <input type="text" id="address-country" name="addressCountry" class="form-control" value="${settings.addressCountry || 'المملكة العربية السعودية'}">
          </div>
          
          <div class="form-group">
            <label for="google-maps">رابط خرائط جوجل</label>
            <input type="text" id="google-maps" name="googleMapsUrl" class="form-control" value="${settings.googleMapsUrl || ''}">
            <small class="form-text text-muted">رابط الموقع على خرائط جوجل لعرضه في صفحة الاتصال</small>
          </div>
        </div>
      </div>
    `;
  }
  
  renderSocialSettingsForm(settings) {
    return `
      <div class="row">
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">روابط وسائل التواصل الاجتماعي</h5>
          
          <div class="form-group">
            <label for="social-facebook">فيسبوك</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="fab fa-facebook-f"></i></span>
              </div>
              <input type="text" id="social-facebook" name="socialFacebook" class="form-control" value="${settings.socialFacebook || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="social-twitter">تويتر</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="fab fa-twitter"></i></span>
              </div>
              <input type="text" id="social-twitter" name="socialTwitter" class="form-control" value="${settings.socialTwitter || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="social-instagram">انستغرام</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="fab fa-instagram"></i></span>
              </div>
              <input type="text" id="social-instagram" name="socialInstagram" class="form-control" value="${settings.socialInstagram || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="social-linkedin">لينكد إن</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="fab fa-linkedin-in"></i></span>
              </div>
              <input type="text" id="social-linkedin" name="socialLinkedin" class="form-control" value="${settings.socialLinkedin || ''}">
            </div>
          </div>
          
          <div class="form-group">
            <label for="social-youtube">يوتيوب</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text"><i class="fab fa-youtube"></i></span>
              </div>
              <input type="text" id="social-youtube" name="socialYoutube" class="form-control" value="${settings.socialYoutube || ''}">
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">إعدادات المشاركة</h5>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-social-sharing" name="enableSocialSharing" ${settings.enableSocialSharing !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-social-sharing">تفعيل أزرار مشاركة المحتوى</label>
            </div>
            <small class="form-text text-muted">عرض أزرار مشاركة المحتوى على وسائل التواصل الاجتماعي</small>
          </div>
          
          <div class="form-group">
            <label>منصات المشاركة</label>
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="share-facebook" name="shareFacebook" ${settings.shareFacebook !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="share-facebook">فيسبوك</label>
            </div>
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="share-twitter" name="shareTwitter" ${settings.shareTwitter !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="share-twitter">تويتر</label>
            </div>
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="share-linkedin" name="shareLinkedin" ${settings.shareLinkedin !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="share-linkedin">لينكد إن</label>
            </div>
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="share-whatsapp" name="shareWhatsapp" ${settings.shareWhatsapp !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="share-whatsapp">واتساب</label>
            </div>
            <div class="custom-control custom-checkbox">
              <input type="checkbox" class="custom-control-input" id="share-email" name="shareEmail" ${settings.shareEmail !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="share-email">البريد الإلكتروني</label>
            </div>
          </div>
          
          <h5 class="settings-section-subtitle mt-4">تكامل وسائل التواصل الاجتماعي</h5>
          
          <div class="form-group">
            <label for="facebook-app-id">معرف تطبيق فيسبوك (App ID)</label>
            <input type="text" id="facebook-app-id" name="facebookAppId" class="form-control" value="${settings.facebookAppId || ''}">
            <small class="form-text text-muted">مطلوب لتكامل فيسبوك وزر الإعجاب</small>
          </div>
          
          <div class="form-group">
            <label for="twitter-username">اسم المستخدم على تويتر</label>
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text">@</span>
              </div>
              <input type="text" id="twitter-username" name="twitterUsername" class="form-control" value="${settings.twitterUsername || ''}">
            </div>
            <small class="form-text text-muted">يستخدم في بطاقات تويتر وعند المشاركة</small>
          </div>
        </div>
      </div>
    `;
  }
  
  renderSEOSettingsForm(settings) {
    return `
      <div class="row">
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">الإعدادات الأساسية</h5>
          
          <div class="form-group">
            <label for="meta-title">عنوان الميتا الافتراضي</label>
            <input type="text" id="meta-title" name="metaTitle" class="form-control" value="${settings.metaTitle || ''}">
            <small class="form-text text-muted">يظهر في عنوان المتصفح وفي نتائج البحث</small>
          </div>
          
          <div class="form-group">
            <label for="meta-description">وصف الميتا الافتراضي</label>
            <textarea id="meta-description" name="metaDescription" class="form-control" rows="3">${settings.metaDescription || ''}</textarea>
            <small class="form-text text-muted">يظهر في نتائج البحث تحت عنوان الصفحة</small>
          </div>
          
          <div class="form-group">
            <label for="meta-keywords">الكلمات المفتاحية الافتراضية</label>
            <textarea id="meta-keywords" name="metaKeywords" class="form-control" rows="2">${settings.metaKeywords || ''}</textarea>
            <small class="form-text text-muted">افصل بين الكلمات المفتاحية بفواصل</small>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-canonical" name="enableCanonical" ${settings.enableCanonical !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-canonical">تفعيل روابط Canonical</label>
            </div>
            <small class="form-text text-muted">يساعد في تجنب مشاكل المحتوى المكرر</small>
          </div>
        </div>
        
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">الروبوتات والخرائط</h5>
          
          <div class="form-group">
            <label for="robots-txt">محتوى ملف robots.txt</label>
            <textarea id="robots-txt" name="robotsTxt" class="form-control" rows="5">${settings.robotsTxt || 'User-agent: *\nAllow: /'}</textarea>
            <small class="form-text text-muted">يحدد كيفية تعامل محركات البحث مع موقعك</small>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-sitemap" name="enableSitemap" ${settings.enableSitemap !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-sitemap">تفعيل خريطة الموقع (Sitemap)</label>
            </div>
            <small class="form-text text-muted">إنشاء وتحديث خريطة الموقع تلقائياً</small>
          </div>
          
          <h5 class="settings-section-subtitle mt-4">تحليلات وتتبع</h5>
          
          <div class="form-group">
            <label for="google-analytics">رمز تتبع Google Analytics</label>
            <input type="text" id="google-analytics" name="googleAnalytics" class="form-control" value="${settings.googleAnalytics || ''}">
            <small class="form-text text-muted">مثال: UA-XXXXXXXXX-X أو G-XXXXXXXXXX</small>
          </div>
          
          <div class="form-group">
            <label for="google-tag-manager">معرف Google Tag Manager</label>
            <input type="text" id="google-tag-manager" name="googleTagManager" class="form-control" value="${settings.googleTagManager || ''}">
            <small class="form-text text-muted">مثال: GTM-XXXXXX</small>
          </div>
          
          <div class="form-group">
            <label for="google-search-console">رمز التحقق من Google Search Console</label>
            <input type="text" id="google-search-console" name="googleSearchConsole" class="form-control" value="${settings.googleSearchConsole || ''}">
            <small class="form-text text-muted">رمز HTML للتحقق من ملكية الموقع</small>
          </div>
        </div>
      </div>
      
      <h5 class="settings-section-subtitle mt-4">بطاقات وسائل التواصل الاجتماعي</h5>
      
      <div class="row">
        <div class="col-md-6">
          <div class="form-group">
            <label for="og-title">عنوان Open Graph الافتراضي</label>
            <input type="text" id="og-title" name="ogTitle" class="form-control" value="${settings.ogTitle || ''}">
          </div>
          
          <div class="form-group">
            <label for="og-description">وصف Open Graph الافتراضي</label>
            <textarea id="og-description" name="ogDescription" class="form-control" rows="3">${settings.ogDescription || ''}</textarea>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="form-group">
            <label for="twitter-card-type">نوع بطاقة تويتر</label>
            <select id="twitter-card-type" name="twitterCardType" class="form-control">
              <option value="summary" ${(settings.twitterCardType || 'summary') === 'summary' ? 'selected' : ''}>ملخص (Summary)</option>
              <option value="summary_large_image" ${(settings.twitterCardType || 'summary') === 'summary_large_image' ? 'selected' : ''}>ملخص مع صورة كبيرة (Summary Large Image)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="twitter-description">وصف بطاقة تويتر الافتراضي</label>
            <textarea id="twitter-description" name="twitterDescription" class="form-control" rows="3">${settings.twitterDescription || ''}</textarea>
          </div>
        </div>
      </div>
    `;
  }
  
  renderEmailSettingsForm(settings) {
    return `
      <div class="row">
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">إعدادات SMTP</h5>
          
          <div class="form-group">
            <label for="smtp-host">خادم SMTP</label>
            <input type="text" id="smtp-host" name="smtpHost" class="form-control" value="${settings.smtpHost || ''}">
          </div>
          
          <div class="form-group">
            <label for="smtp-port">منفذ SMTP</label>
            <input type="number" id="smtp-port" name="smtpPort" class="form-control" value="${settings.smtpPort || '587'}">
          </div>
          
          <div class="form-group">
            <label for="smtp-username">اسم المستخدم</label>
            <input type="text" id="smtp-username" name="smtpUsername" class="form-control" value="${settings.smtpUsername || ''}">
          </div>
          
          <div class="form-group">
            <label for="smtp-password">كلمة المرور</label>
            <input type="password" id="smtp-password" name="smtpPassword" class="form-control" value="${settings.smtpPassword ? '••••••••' : ''}">
            <small class="form-text text-muted">اترك فارغاً إذا لم ترغب في تغيير كلمة المرور الحالية</small>
          </div>
          
          <div class="form-group">
            <label for="smtp-encryption">نوع التشفير</label>
            <select id="smtp-encryption" name="smtpEncryption" class="form-control">
              <option value="tls" ${(settings.smtpEncryption || 'tls') === 'tls' ? 'selected' : ''}>TLS</option>
              <option value="ssl" ${(settings.smtpEncryption || 'tls') === 'ssl' ? 'selected' : ''}>SSL</option>
              <option value="none" ${(settings.smtpEncryption || 'tls') === 'none' ? 'selected' : ''}>بدون تشفير</option>
            </select>
          </div>
          
          <div class="form-group">
            <button type="button" id="test-email-btn" class="btn btn-info">
              <i class="fas fa-paper-plane"></i> اختبار إعدادات البريد
            </button>
          </div>
        </div>
        
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">إعدادات البريد</h5>
          
          <div class="form-group">
            <label for="mail-from-name">اسم المرسل</label>
            <input type="text" id="mail-from-name" name="mailFromName" class="form-control" value="${settings.mailFromName || 'منصة مهندز'}">
          </div>
          
          <div class="form-group">
            <label for="mail-from-email">بريد المرسل</label>
            <input type="email" id="mail-from-email" name="mailFromEmail" class="form-control" value="${settings.mailFromEmail || ''}">
          </div>
          
          <div class="form-group">
            <label for="mail-reply-to">الرد إلى</label>
            <input type="email" id="mail-reply-to" name="mailReplyTo" class="form-control" value="${settings.mailReplyTo || ''}">
          </div>
          
          <h5 class="settings-section-subtitle mt-4">قوالب البريد الإلكتروني</h5>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-welcome-email" name="enableWelcomeEmail" ${settings.enableWelcomeEmail !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-welcome-email">تفعيل بريد الترحيب</label>
            </div>
            <small class="form-text text-muted">إرسال بريد ترحيبي للمستخدمين الجدد</small>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-order-emails" name="enableOrderEmails" ${settings.enableOrderEmails !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-order-emails">تفعيل بريد الطلبات</label>
            </div>
            <small class="form-text text-muted">إرسال بريد للعملاء عند إنشاء أو تحديث الطلبات</small>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-admin-notifications" name="enableAdminNotifications" ${settings.enableAdminNotifications !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-admin-notifications">تفعيل إشعارات المدير</label>
            </div>
            <small class="form-text text-muted">إرسال إشعارات للمدير عند إنشاء طلبات جديدة أو تسجيل مستخدمين جدد</small>
          </div>
          
          <div class="form-group">
            <label for="admin-notification-email">بريد إشعارات المدير</label>
            <input type="email" id="admin-notification-email" name="adminNotificationEmail" class="form-control" value="${settings.adminNotificationEmail || ''}">
          </div>
        </div>
      </div>
    `;
  }
  
  renderSecuritySettingsForm(settings) {
    return `
      <div class="row">
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">إعدادات الحساب</h5>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-registration" name="enableRegistration" ${settings.enableRegistration !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-registration">تفعيل التسجيل</label>
            </div>
            <small class="form-text text-muted">السماح للمستخدمين بإنشاء حسابات جديدة</small>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="require-email-verification" name="requireEmailVerification" ${settings.requireEmailVerification !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="require-email-verification">طلب تأكيد البريد الإلكتروني</label>
            </div>
            <small class="form-text text-muted">يجب على المستخدمين تأكيد بريدهم الإلكتروني قبل تسجيل الدخول</small>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="require-admin-approval" name="requireAdminApproval" ${settings.requireAdminApproval === true ? 'checked' : ''}>
              <label class="custom-control-label" for="require-admin-approval">طلب موافقة المدير</label>
            </div>
            <small class="form-text text-muted">يجب موافقة المدير على الحسابات الجديدة قبل تفعيلها</small>
          </div>
          
          <div class="form-group">
            <label for="default-user-role">الدور الافتراضي للمستخدمين الجدد</label>
            <select id="default-user-role" name="defaultUserRole" class="form-control">
              <option value="user" ${(settings.defaultUserRole || 'user') === 'user' ? 'selected' : ''}>مستخدم عادي</option>
              <option value="customer" ${(settings.defaultUserRole || 'user') === 'customer' ? 'selected' : ''}>عميل</option>
              <option value="engineer" ${(settings.defaultUserRole || 'user') === 'engineer' ? 'selected' : ''}>مهندس</option>
            </select>
          </div>
          
          <h5 class="settings-section-subtitle mt-4">سياسة كلمة المرور</h5>
          
          <div class="form-group">
            <label for="password-min-length">الحد الأدنى لطول كلمة المرور</label>
            <input type="number" id="password-min-length" name="passwordMinLength" class="form-control" min="6" max="32" value="${settings.passwordMinLength || '8'}">
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="password-require-uppercase" name="passwordRequireUppercase" ${settings.passwordRequireUppercase !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="password-require-uppercase">طلب حرف كبير</label>
            </div>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="password-require-number" name="passwordRequireNumber" ${settings.passwordRequireNumber !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="password-require-number">طلب رقم</label>
            </div>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="password-require-special" name="passwordRequireSpecial" ${settings.passwordRequireSpecial === true ? 'checked' : ''}>
              <label class="custom-control-label" for="password-require-special">طلب حرف خاص</label>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <h5 class="settings-section-subtitle">إعدادات الجلسة</h5>
          
          <div class="form-group">
            <label for="session-lifetime">مدة الجلسة (بالدقائق)</label>
            <input type="number" id="session-lifetime" name="sessionLifetime" class="form-control" min="15" value="${settings.sessionLifetime || '120'}">
            <small class="form-text text-muted">المدة التي يبقى فيها المستخدم مسجل الدخول</small>
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-remember-me" name="enableRememberMe" ${settings.enableRememberMe !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-remember-me">تفعيل "تذكرني"</label>
            </div>
            <small class="form-text text-muted">السماح للمستخدمين بالبقاء مسجلين الدخول</small>
          </div>
          
          <div class="form-group">
            <label for="remember-me-lifetime">مدة "تذكرني" (بالأيام)</label>
            <input type="number" id="remember-me-lifetime" name="rememberMeLifetime" class="form-control" min="1" value="${settings.rememberMeLifetime || '30'}">
          </div>
          
          <h5 class="settings-section-subtitle mt-4">حماية الموقع</h5>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-recaptcha" name="enableRecaptcha" ${settings.enableRecaptcha === true ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-recaptcha">تفعيل reCAPTCHA</label>
            </div>
            <small class="form-text text-muted">حماية النماذج من البريد العشوائي والروبوتات</small>
          </div>
          
          <div class="form-group">
            <label for="recaptcha-site-key">مفتاح الموقع reCAPTCHA</label>
            <input type="text" id="recaptcha-site-key" name="recaptchaSiteKey" class="form-control" value="${settings.recaptchaSiteKey || ''}">
          </div>
          
          <div class="form-group">
            <label for="recaptcha-secret-key">المفتاح السري reCAPTCHA</label>
            <input type="text" id="recaptcha-secret-key" name="recaptchaSecretKey" class="form-control" value="${settings.recaptchaSecretKey || ''}">
          </div>
          
          <div class="form-group">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id="enable-rate-limiting" name="enableRateLimiting" ${settings.enableRateLimiting !== false ? 'checked' : ''}>
              <label class="custom-control-label" for="enable-rate-limiting">تفعيل تحديد معدل الطلبات</label>
            </div>
            <small class="form-text text-muted">حماية الموقع من هجمات القوة الغاشمة وطلبات API المفرطة</small>
          </div>
          
          <div class="form-group">
            <label for="max-login-attempts">الحد الأقصى لمحاولات تسجيل الدخول</label>
            <input type="number" id="max-login-attempts" name="maxLoginAttempts" class="form-control" min="3" value="${settings.maxLoginAttempts || '5'}">
            <small class="form-text text-muted">عدد محاولات تسجيل الدخول الفاشلة قبل قفل الحساب مؤقتاً</small>
          </div>
        </div>
      </div>
    `;
  }
  
  initColorPickers() {
    // Initialize color pickers for color inputs
    document.querySelectorAll('.color-input').forEach(input => {
      // Update color preview on input change
      input.addEventListener('input', () => {
        const preview = input.parentElement.querySelector('.color-preview');
        if (preview) {
          preview.style.backgroundColor = input.value;
        }
      });
      
      // Add click event to preview to open color picker
      const preview = input.parentElement.querySelector('.color-preview');
      if (preview) {
        preview.addEventListener('click', () => {
          input.focus();
          input.click();
        });
      }
    });
  }
  
  initImageUploads() {
    // Initialize image uploads
    document.querySelectorAll('input[type="file"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Get preview element ID from input ID
        const previewId = input.id.replace('-upload', '-preview');
        const preview = document.getElementById(previewId);
        if (!preview) return;
        
        // Check file type
        if (!file.type.match('image.*')) {
          this.app.ui.notifications.show('error', 'خطأ', 'يرجى اختيار ملف صورة صالح');
          return;
        }
        
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          this.app.ui.notifications.show('error', 'خطأ', 'حجم الصورة كبير جداً. الحد الأقصى هو 2 ميجابايت');
          return;
        }
        
        // Create file reader
        const reader = new FileReader();
        
        // Set preview image when loaded
        reader.onload = (e) => {
          preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
          
          // Update hidden input with base64 data
          const hiddenInput = preview.parentElement.querySelector('input[type="hidden"]');
          if (hiddenInput) {
            hiddenInput.value = e.target.result;
          }
          
          // Mark form as modified
          document.getElementById('settings-form').dataset.modified = 'true';
        };
        
        // Read file as data URL
        reader.readAsDataURL(file);
        
        // Update file input label
        const label = input.parentElement.querySelector('.custom-file-label');
        if (label) {
          label.textContent = file.name;
        }
      });
    });
  }
  
  async saveSettings() {
    try {
      // Get form data
      const form = document.getElementById('settings-form');
      const section = form.dataset.section;
      
      // Collect form data
      const formData = {};
      form.querySelectorAll('input, textarea, select').forEach(input => {
        if (input.type === 'checkbox') {
          formData[input.name] = input.checked;
        } else if (input.type === 'file') {
          // Skip file inputs, we use hidden inputs for base64 data
        } else if (input.type === 'password' && input.value === '••••••••') {
          // Skip password fields with placeholder value
        } else {
          formData[input.name] = input.value;
        }
      });
      
      // Disable save button
      const saveButton = document.getElementById('save-settings-btn');
      saveButton.disabled = true;
      saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
      
      // Hide previous messages
      document.getElementById('settings-form-error').style.display = 'none';
      document.getElementById('settings-form-success').style.display = 'none';
      
      // Send request
      const response = await ApiClient.put(`${this.apiBaseUrl}/settings/${section}`, formData);
      
      // Enable save button
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ الإعدادات';
      
      if (!response.success) {
        document.getElementById('settings-form-error').textContent = response.message || `فشل حفظ ${this.settingsSections[section].title}`;
        document.getElementById('settings-form-error').style.display = 'block';
        return;
      }
      
      // Show success message
      document.getElementById('settings-form-success').textContent = `تم حفظ ${this.settingsSections[section].title} بنجاح`;
      document.getElementById('settings-form-success').style.display = 'block';
      
      // Mark form as unmodified
      form.dataset.modified = 'false';
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', `تم حفظ ${this.settingsSections[section].title} بنجاح`);
      
      // If email settings were saved, add event listener to test email button
      if (section === 'email') {
        document.getElementById('test-email-btn').addEventListener('click', () => {
          this.testEmailSettings();
        });
      }
    } catch (error) {
      console.error(`Save ${this.currentSection} settings error:`, error);
      document.getElementById('settings-form-error').textContent = `حدث خطأ أثناء حفظ ${this.settingsSections[this.currentSection].title}`;
      document.getElementById('settings-form-error').style.display = 'block';
      
      // Enable save button
      const saveButton = document.getElementById('save-settings-btn');
      saveButton.disabled = false;
      saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ الإعدادات';
    }
  }
  
  async testEmailSettings() {
    try {
      // Disable test button
      const testButton = document.getElementById('test-email-btn');
      testButton.disabled = true;
      testButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاختبار...';
      
      // Send test email request
      const response = await ApiClient.post(`${this.apiBaseUrl}/settings/email/test`, {
        recipient: this.currentUser.email
      });
      
      // Enable test button
      testButton.disabled = false;
      testButton.innerHTML = '<i class="fas fa-paper-plane"></i> اختبار إعدادات البريد';
      
      if (!response.success) {
        this.app.ui.notifications.show('error', 'خطأ', response.message || 'فشل إرسال بريد الاختبار');
        return;
      }
      
      // Show success notification
      this.app.ui.notifications.show('success', 'تم بنجاح', 'تم إرسال بريد الاختبار بنجاح. يرجى التحقق من صندوق الوارد الخاص بك.');
    } catch (error) {
      console.error('Test email error:', error);
      
      // Enable test button
      const testButton = document.getElementById('test-email-btn');
      testButton.disabled = false;
      testButton.innerHTML = '<i class="fas fa-paper-plane"></i> اختبار إعدادات البريد';
      
      this.app.ui.notifications.show('error', 'خطأ', 'حدث خطأ أثناء اختبار إعدادات البريد');
    }
  }
}
