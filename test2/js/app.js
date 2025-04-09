/**
 * Main application file
 * Initializes the app and handles navigation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check for categories update flag in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('reset_categories')) {
        // Clear categories to force reload
        localStorage.removeItem('categories');
        // Redirect to normal URL without the parameter
        window.location.href = window.location.pathname;
        return;
    }
    
    // Initialize storage with default data if needed
    Storage.initialize();
    
    // Force reload of categories to ensure new options are available
    const categories = Storage.getCategories();
    console.log('Loaded categories:', categories.length);
    
    // Initialize dark mode
    Utils.initDarkMode();
    
    // Initialize feather icons
    feather.replace();
    
    // Set current date in the header
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const today = new Date();
        currentDateElement.textContent = Utils.formatDate(today);
    }
    
    // Initialize all modules
    initializeApp();
    
    // Set up event listeners
    setupEventListeners();
    
    // Handle page navigation from URL parameters
    handleURLParameters();
});

/**
 * Initialize all application modules
 */
function initializeApp() {
    // Initialize dashboard
    Dashboard.initialize();
    
    // Initialize transactions
    Transactions.initialize();
    
    // Initialize budgets
    Budgets.initialize();
    
    // Initialize goals
    Goals.initialize();
    
    // Initialize bills
    Bills.initialize();
    
    // Initialize reports
    Reports.initialize();
    
    // Initialize settings
    Settings.initialize();
    
    // Initialize data export/import
    DataExport.initialize();
}

/**
 * Set up global event listeners
 */
function setupEventListeners() {
    // Navigation event handlers
    const menuItems = document.querySelectorAll('.sidebar-menu li');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // Update active menu item
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Update page title
            const pageName = this.getAttribute('data-page');
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                pageTitle.textContent = this.querySelector('a').textContent.trim();
            }
            
            // Show the appropriate page content
            showPage(pageName);
        });
    });
    
    // Sidebar toggle for mobile
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.toggle('active');
            }
        });
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-modal, .cancel-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
                document.body.style.overflow = ''; // Re-enable scrolling
            }
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = ''; // Re-enable scrolling
            }
        });
    });
    
    // Export data button
    const exportDataBtn = document.getElementById('export-data');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', function() {
            DataExport.exportJSON();
        });
    }
}

/**
 * Show a specific page and hide others
 * @param {string} pageName - Name of the page to show
 */
function showPage(pageName) {
    // Hide all pages first
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    const selectedPage = document.getElementById(`${pageName}-page`);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }
    
    // Update data for the selected page if necessary
    switch (pageName) {
        case 'dashboard':
            Dashboard.refresh();
            break;
        case 'transactions':
            Transactions.refresh();
            break;
        case 'budgets':
            Budgets.refresh();
            break;
        case 'goals':
            Goals.refresh();
            break;
        case 'bills':
            Bills.refresh();
            break;
        case 'reports':
            Reports.refresh();
            break;
        case 'settings':
            Settings.refresh();
            break;
    }
    
    // Close mobile sidebar after navigation
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth < 768 && sidebar && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
}

/**
 * Handle navigation via URL parameters
 * This allows linking to specific pages from feature pages
 */
function handleURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if there's a page parameter
    if (urlParams.has('page')) {
        const pageName = urlParams.get('page');
        const validPages = ['dashboard', 'transactions', 'budgets', 'bills', 'goals', 'reports', 'settings'];
        
        if (validPages.includes(pageName)) {
            // Update active menu item
            const menuItems = document.querySelectorAll('.sidebar-menu li');
            menuItems.forEach(item => {
                if (item.getAttribute('data-page') === pageName) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Update page title
            const pageTitle = document.getElementById('page-title');
            if (pageTitle) {
                const activeMenuItem = document.querySelector(`.sidebar-menu li[data-page="${pageName}"]`);
                if (activeMenuItem) {
                    pageTitle.textContent = activeMenuItem.querySelector('a').textContent.trim();
                }
            }
            
            // Show the specified page
            showPage(pageName);
            
            // Handle specific actions for the page
            if (urlParams.has('action')) {
                const action = urlParams.get('action');
                
                switch(pageName) {
                    case 'transactions':
                        if (action === 'add') {
                            // Open add transaction modal
                            if (typeof Transactions !== 'undefined' && Transactions.showAddModal) {
                                // If type parameter is provided, use it to set transaction type
                                if (urlParams.has('type')) {
                                    const type = urlParams.get('type');
                                    setTimeout(() => {
                                        Transactions.showAddModal(type);
                                    }, 100);
                                } else {
                                    setTimeout(() => {
                                        Transactions.showAddModal();
                                    }, 100);
                                }
                            }
                        }
                        break;
                        
                    case 'budgets':
                        if (action === 'add') {
                            // Open add budget modal
                            if (typeof Budgets !== 'undefined' && Budgets.showAddModal) {
                                setTimeout(() => {
                                    Budgets.showAddModal();
                                }, 100);
                            }
                        }
                        break;
                        
                    case 'bills':
                        if (action === 'add') {
                            // Open add bill modal
                            if (typeof Bills !== 'undefined' && Bills.showAddModal) {
                                // If type parameter is provided, use it to set bill type
                                if (urlParams.has('type')) {
                                    const type = urlParams.get('type');
                                    setTimeout(() => {
                                        Bills.showAddModal(type);
                                    }, 100);
                                } else {
                                    setTimeout(() => {
                                        Bills.showAddModal();
                                    }, 100);
                                }
                            }
                        }
                        break;
                        
                    case 'goals':
                        if (action === 'add') {
                            // Open add goal modal
                            if (typeof Goals !== 'undefined' && Goals.showAddModal) {
                                setTimeout(() => {
                                    Goals.showAddModal();
                                }, 100);
                            }
                        }
                        break;
                        
                    case 'settings':
                        if (action === 'add_category') {
                            // Open add category modal
                            if (typeof Settings !== 'undefined' && Settings.showAddCategoryModal) {
                                setTimeout(() => {
                                    Settings.showAddCategoryModal();
                                }, 100);
                            }
                        }
                        break;
                }
            }
            
            // Handle specific sections for settings page
            if (pageName === 'settings' && urlParams.has('section')) {
                const section = urlParams.get('section');
                
                // Switch to the specified settings section
                if (typeof Settings !== 'undefined' && Settings.showSection) {
                    setTimeout(() => {
                        Settings.showSection(section);
                    }, 100);
                }
            }
        }
    }
}
