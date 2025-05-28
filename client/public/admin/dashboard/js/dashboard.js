// Dashboard JavaScript for Mohandz Admin Panel

document.addEventListener('DOMContentLoaded', function() {
    // Toggle sidebar
    const toggleSidebar = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (toggleSidebar) {
        toggleSidebar.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');
        });
    }
    
    // Navigation
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const contentSections = document.querySelectorAll('.content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(link => link.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all content sections
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Show the corresponding content section
            const targetSection = this.getAttribute('data-section');
            document.getElementById(`${targetSection}-section`).classList.add('active');
        });
    });
    
    // Dropdown menus
    const dropdownButtons = document.querySelectorAll('.notification-btn, .user-btn');
    const dropdownMenus = document.querySelectorAll('.dropdown-menu');
    
    dropdownButtons.forEach(button => {
        button.addEventListener('click', function() {
            const dropdown = this.nextElementSibling;
            dropdown.classList.toggle('show');
        });
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.matches('.notification-btn, .user-btn') && 
            !e.target.closest('.dropdown-menu') &&
            !e.target.closest('.notification-btn') && 
            !e.target.closest('.user-btn')) {
            dropdownMenus.forEach(menu => menu.classList.remove('show'));
        }
    });
    
    // Initialize charts if Chart.js is available
    if (typeof Chart !== 'undefined') {
        // Orders Chart
        const ordersChartCtx = document.getElementById('ordersChart');
        if (ordersChartCtx) {
            const ordersChart = new Chart(ordersChartCtx, {
                type: 'line',
                data: {
                    labels: ['السبت', 'الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
                    datasets: [{
                        label: 'الطلبات',
                        data: [5, 8, 12, 8, 10, 15, 12],
                        backgroundColor: 'rgba(0, 86, 179, 0.1)',
                        borderColor: '#0056b3',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // Services Chart
        const servicesChartCtx = document.getElementById('servicesChart');
        if (servicesChartCtx) {
            const servicesChart = new Chart(servicesChartCtx, {
                type: 'doughnut',
                data: {
                    labels: ['التصاميم المعمارية', 'الطرق والبنية التحتية', 'الخدمات المساحية'],
                    datasets: [{
                        data: [45, 30, 25],
                        backgroundColor: ['#0056b3', '#f8a100', '#28a745'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                boxWidth: 12
                            }
                        }
                    },
                    cutout: '70%'
                }
            });
        }
    }
    
    // Form validation
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            form.classList.add('was-validated');
        }, false);
    });
    
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('tbody .form-check-input');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    // Logout functionality
    const logoutBtn = document.getElementById('logout-btn');
    const logoutLink = document.getElementById('logout-link');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            handleLogout();
        });
    }
    
    function handleLogout() {
        // Here you would typically make an API call to logout
        // For now, we'll just redirect to the login page
        alert('تم تسجيل الخروج بنجاح');
        window.location.href = '../index.html';
    }
    
    // Responsive sidebar
    if (window.innerWidth < 992) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
    }
    
    window.addEventListener('resize', function() {
        if (window.innerWidth < 992) {
            sidebar.classList.add('collapsed');
            mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            mainContent.classList.remove('expanded');
        }
    });
});
