document.addEventListener('DOMContentLoaded', function() {
    // Initialize feather icons
    feather.replace();

    // Sidebar toggle functionality
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebarClose = document.getElementById("sidebar-close");

    function toggleSidebar() {
        if (sidebar) {
            sidebar.classList.toggle("active");
        }
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", toggleSidebar);
    }

    if (sidebarClose) {
        sidebarClose.addEventListener("click", toggleSidebar);
    }

    // Setup budget templates button
    const templatesBtn = document.querySelector('.action-card .btn-outline');
    if (templatesBtn) {
        templatesBtn.disabled = false;
        templatesBtn.addEventListener('click', function() {
            if (typeof Utils !== 'undefined' && Utils.showNotification) {
                Utils.showNotification('Budget templates will be available in the next update!', 'info');
            } else {
                alert('Budget templates will be available soon!');
            }
        });
    }

    // Dark mode toggle functionality
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;

    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        body.classList.toggle("dark-mode", savedTheme === "dark");
        darkModeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌓";
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️";
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener("click", () => {
            body.classList.toggle("dark-mode");
            const isDarkMode = body.classList.contains("dark-mode");
            localStorage.setItem("theme", isDarkMode ? "dark" : "light");
            darkModeToggle.textContent = isDarkMode ? "☀️" : "🌓";
        });
    }
});