// API Client for Mohandz Admin Dashboard
// Handles all API requests with authentication

class ApiClient {
  static get(url, params = {}) {
    return this.request('GET', url, null, params);
  }
  
  static post(url, data = {}, params = {}) {
    return this.request('POST', url, data, params);
  }
  
  static put(url, data = {}, params = {}) {
    return this.request('PUT', url, data, params);
  }
  
  static delete(url, params = {}) {
    return this.request('DELETE', url, null, params);
  }
  
  static async request(method, url, data = null, params = {}) {
    try {
      // Add query parameters to URL if provided
      if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
      }
      
      // Prepare request options
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      // Add authentication token if available
      const token = localStorage.getItem('token');
      if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Add request body for POST and PUT requests
      if (data) {
        if (data instanceof FormData) {
          // If data is FormData, remove Content-Type header to let browser set it
          delete options.headers['Content-Type'];
          options.body = data;
        } else {
          options.body = JSON.stringify(data);
        }
      }
      
      // Send request
      const response = await fetch(url, options);
      
      // Handle JSON response
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        
        // Add status code to response
        json.statusCode = response.status;
        
        // Handle authentication errors
        if (response.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token');
          window.location.href = '/admin/login.html';
          return json;
        }
        
        return json;
      }
      
      // Handle non-JSON responses (like file downloads)
      if (response.ok) {
        const blob = await response.blob();
        return {
          success: true,
          data: blob,
          statusCode: response.status
        };
      }
      
      // Handle error
      return {
        success: false,
        message: 'خطأ في الاستجابة',
        statusCode: response.status
      };
    } catch (error) {
      console.error('API request error:', error);
      return {
        success: false,
        message: 'خطأ في الاتصال بالخادم',
        error: error.message
      };
    }
  }
  
  // Special method for file uploads
  static async uploadFile(url, formData, onProgress = null) {
    try {
      // Add authentication token if available
      const token = localStorage.getItem('token');
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        // Setup progress event
        if (onProgress && typeof onProgress === 'function') {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              onProgress(percentComplete);
            }
          });
        }
        
        // Setup completion handler
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              resolve({
                success: true,
                message: 'تم رفع الملف بنجاح',
                statusCode: xhr.status
              });
            }
          } else {
            try {
              const response = JSON.parse(xhr.responseText);
              reject(response);
            } catch (e) {
              reject({
                success: false,
                message: 'خطأ في رفع الملف',
                statusCode: xhr.status
              });
            }
          }
        };
        
        // Setup error handler
        xhr.onerror = function() {
          reject({
            success: false,
            message: 'خطأ في الاتصال بالخادم',
            statusCode: 0
          });
        };
        
        // Open and send request
        xhr.open('POST', url, true);
        
        // Add authentication header
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
      });
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        message: 'خطأ في رفع الملف',
        error: error.message
      };
    }
  }
  
  // Method to download file
  static downloadFile(url, filename) {
    // Create a hidden link element
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // Add to document, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
