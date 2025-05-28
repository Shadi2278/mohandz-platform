// Main JavaScript for Mohandz Engineering Services Platform

// Document Ready Function
$(document).ready(function() {
    // Initialize Bootstrap Tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize Bootstrap Popovers
    var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Navbar Scroll Effect
    $(window).scroll(function() {
        if ($(window).scrollTop() > 50) {
            $('.navbar').addClass('navbar-scrolled shadow-sm');
            $('.navbar-brand img').css('height', '50px');
        } else {
            $('.navbar').removeClass('navbar-scrolled shadow-sm');
            $('.navbar-brand img').css('height', '60px');
        }
    });

    // Back to Top Button
    $(window).scroll(function() {
        if ($(this).scrollTop() > 300) {
            $('#backToTop').addClass('active');
        } else {
            $('#backToTop').removeClass('active');
        }
    });

    $('#backToTop').click(function(e) {
        e.preventDefault();
        $('html, body').animate({scrollTop: 0}, 500);
        return false;
    });

    // Smooth Scroll for Anchor Links
    $('a[href^="#"]').on('click', function(e) {
        e.preventDefault();
        
        var target = this.hash;
        var $target = $(target);
        
        if ($target.length) {
            $('html, body').animate({
                'scrollTop': $target.offset().top - 80
            }, 800, 'swing');
        }
    });

    // Form Validation
    (function () {
        'use strict'
        
        // Fetch all the forms we want to apply custom Bootstrap validation styles to
        var forms = document.querySelectorAll('.needs-validation');
        
        // Loop over them and prevent submission
        Array.prototype.slice.call(forms)
            .forEach(function (form) {
                form.addEventListener('submit', function (event) {
                    if (!form.checkValidity()) {
                        event.preventDefault();
                        event.stopPropagation();
                    } else {
                        event.preventDefault();
                        // Show success message
                        $('#formSuccess').removeClass('d-none');
                        // Reset form
                        form.reset();
                    }
                    
                    form.classList.add('was-validated');
                }, false);
            });
    })();

    // Service Card Hover Effect
    $('.service-card').hover(
        function() {
            $(this).find('.service-icon i').addClass('fa-beat');
        },
        function() {
            $(this).find('.service-icon i').removeClass('fa-beat');
        }
    );

    // Project Card Click
    $('.project-card').click(function() {
        var projectUrl = $(this).find('a.btn').attr('href');
        if (projectUrl) {
            window.location.href = projectUrl;
        }
    });

    // Mobile Menu Toggle
    $('.navbar-toggler').click(function() {
        if ($(this).attr('aria-expanded') === 'false') {
            $(this).find('.navbar-toggler-icon').addClass('active');
        } else {
            $(this).find('.navbar-toggler-icon').removeClass('active');
        }
    });

    // Dropdown Menu on Hover (Desktop Only)
    function toggleDropdownHover() {
        if (window.innerWidth >= 992) {
            $('.dropdown').hover(
                function() {
                    $(this).find('.dropdown-menu').addClass('show');
                    $(this).find('.dropdown-toggle').attr('aria-expanded', 'true');
                },
                function() {
                    $(this).find('.dropdown-menu').removeClass('show');
                    $(this).find('.dropdown-toggle').attr('aria-expanded', 'false');
                }
            );
        } else {
            $('.dropdown').off('mouseenter mouseleave');
        }
    }

    // Initialize dropdown hover
    toggleDropdownHover();

    // Update on window resize
    $(window).resize(function() {
        toggleDropdownHover();
    });

    // Form Input Focus Effect
    $('.form-control, .form-select').focus(function() {
        $(this).parent().addClass('focused');
    }).blur(function() {
        $(this).parent().removeClass('focused');
    });

    // Handle Form Submission
    $('#contactForm').submit(function(e) {
        e.preventDefault();
        
        if (this.checkValidity()) {
            // Show success message
            $('#formSuccess').removeClass('d-none');
            // Reset form
            this.reset();
            $(this).removeClass('was-validated');
        }
    });

    // Console log for testing
    console.log('Mohandz Engineering Services Platform - All scripts loaded and initialized successfully');
});
