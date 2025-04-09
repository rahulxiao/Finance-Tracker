/**
 * Features module
 * Handles the features page functionality and connections to the main dashboard
 */

const Features = {
    /**
     * Initialize the Features module
     */
    initialize: function() {
        console.log('Features module initialized');
        
        // Set up any specific event listeners for the features page
        this.setupEventListeners();
        
        // Initialize data if needed
        this.loadDashboardData();
    },
    
    /**
     * Set up event listeners for feature-specific functionality
     */
    setupEventListeners: function() {
        // Setup event listeners for feature cards
        const featureCards = document.querySelectorAll('.feature-card');
        featureCards.forEach(card => {
            card.addEventListener('click', function() {
                const url = this.getAttribute('data-url') || this.getAttribute('onclick').toString().match(/'([^']+)'/)[1];
                Features.navigateToFeature(url);
            });
        });
    },
    
    /**
     * Navigate to a specific feature page
     * @param {string} featureName - Name of the feature to navigate to
     */
    navigateToFeature: function(featureName) {
        window.location.href = featureName;
    },
    
    /**
     * Load dashboard data to sync with features
     */
    loadDashboardData: function() {
        // This will ensure feature pages have access to the same data as the dashboard
        const transactions = Storage.getTransactions();
        const categories = Storage.getCategories();
        const budgets = Storage.getBudgets();
        const bills = Storage.getBills();
        const goals = Storage.getGoals();
        
        console.log('Data loaded for features:', {
            transactions: transactions.length,
            categories: categories.length,
            budgets: budgets.length,
            bills: bills.length,
            goals: goals.length
        });
    },
    
    /**
     * Initialize feature-specific page
     * @param {string} featureType - Type of feature page ('income', 'expense', 'budget', 'bill')
     */
    initializeFeaturePage: function(featureType) {
        // Setup UI and data for specific feature pages
        switch(featureType) {
            case 'income':
                this.setupIncomeFeature();
                break;
            case 'expense':
                this.setupExpenseFeature();
                break;
            case 'budget':
                this.setupBudgetFeature();
                break;
            case 'bill':
                this.setupBillFeature();
                break;
            default:
                console.log('Unknown feature type:', featureType);
        }
    },
    
    /**
     * Setup the income recording feature
     */
    setupIncomeFeature: function() {
        // Get income categories
        const categories = Storage.getCategories();
        const incomeCategories = categories.filter(c => c.type === 'income');
        
        // Add functionality to the Add Income button
        const addIncomeBtn = document.querySelector('.action-card .btn-primary');
        if (addIncomeBtn) {
            addIncomeBtn.disabled = false;
            addIncomeBtn.addEventListener('click', function() {
                window.location.href = 'index.html?page=transactions&action=add&type=income';
            });
        }
        
        // Setup income sources display
        const incomeSourcesList = document.querySelector('.income-sources-list');
        if (incomeSourcesList) {
            // Clear placeholder items
            incomeSourcesList.innerHTML = '';
            
            // Add real categories
            incomeCategories.forEach(category => {
                const sourceItem = document.createElement('div');
                sourceItem.className = 'source-item';
                sourceItem.innerHTML = `
                    <div class="source-icon" style="background-color: ${category.color}">
                        <i data-feather="dollar-sign"></i>
                    </div>
                    <div class="source-details">
                        <div class="source-name">${category.name}</div>
                        <div class="source-description">Income from ${category.name.toLowerCase()}</div>
                    </div>
                `;
                incomeSourcesList.appendChild(sourceItem);
            });
            
            // Re-initialize feather icons
            feather.replace();
        }
        
        // Enable the Manage Sources button
        const manageSourcesBtn = document.querySelector('.action-card .btn-secondary');
        if (manageSourcesBtn) {
            manageSourcesBtn.disabled = false;
            manageSourcesBtn.addEventListener('click', function() {
                window.location.href = 'index.html?page=settings';
            });
        }
    },
    
    /**
     * Setup the expense categories feature
     */
    setupExpenseFeature: function() {
        // Get expense categories
        const categories = Storage.getCategories();
        const expenseCategories = categories.filter(c => c.type === 'expense');
        
        // Add functionality to the Create Category button
        const addCategoryBtn = document.querySelector('.action-card .btn-primary');
        if (addCategoryBtn) {
            addCategoryBtn.disabled = false;
            addCategoryBtn.addEventListener('click', function() {
                window.location.href = 'index.html?page=settings&action=add_category';
            });
        }
        
        // Enable the Manage Categories button
        const manageCategoriesBtn = document.querySelector('.action-card .btn-secondary');
        if (manageCategoriesBtn) {
            manageCategoriesBtn.disabled = false;
            manageCategoriesBtn.addEventListener('click', function() {
                window.location.href = 'index.html?page=settings';
            });
        }
        
        // Update category list with real data if needed
        const categoriesList = document.querySelector('.categories-list');
        if (categoriesList && categoriesList.children.length > expenseCategories.length) {
            // If we have more placeholder categories than real ones, we can update
            // This is optional since the existing design already shows categories nicely
        }
    },
    
    /**
     * Setup the budget goals feature
     */
    setupBudgetFeature: function() {
        // Get budgets and expense categories
        const budgets = Storage.getBudgets();
        const categories = Storage.getCategories();
        const expenseCategories = categories.filter(c => c.type === 'expense');
        
        // Add functionality to the Create Budget button
        const createBudgetBtn = document.querySelector('.action-card .btn-primary');
        if (createBudgetBtn) {
            createBudgetBtn.disabled = false;
            createBudgetBtn.addEventListener('click', function() {
                window.location.href = 'index.html?page=budgets&action=add';
            });
        }
        
        // Enable the Category Budgets button
        const categoryBudgetsBtn = document.querySelector('.action-card .btn-secondary');
        if (categoryBudgetsBtn) {
            categoryBudgetsBtn.disabled = false;
            categoryBudgetsBtn.addEventListener('click', function() {
                window.location.href = 'index.html?page=budgets';
            });
        }
        
        // Update budget progress with real data if available
        if (budgets.length > 0) {
            const progressItems = document.querySelectorAll('.budget-progress-item');
            
            // Update overall budget
            if (progressItems.length > 0) {
                // Calculate total budget and spending
                const totalBudget = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
                const transactions = Storage.getTransactions();
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                
                // Filter transactions for current month and expenses only
                const monthlyExpenses = transactions.filter(t => {
                    const date = new Date(t.date);
                    return t.type === 'expense' && 
                           date.getMonth() === currentMonth && 
                           date.getFullYear() === currentYear;
                });
                
                const totalSpent = monthlyExpenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                const percentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;
                
                // Update overall budget display
                progressItems[0].querySelector('.progress-stats').textContent = `$${totalSpent.toFixed(2)} / $${totalBudget.toFixed(2)}`;
                progressItems[0].querySelector('.progress-bar').style.width = `${percentage}%`;
                progressItems[0].querySelector('.progress-info').textContent = `${percentage}% spent`;
            }
            
            // Update individual category budgets if available
            for (let i = 1; i < Math.min(progressItems.length, 4); i++) {
                if (i <= budgets.length) {
                    const budget = budgets[i-1];
                    const category = categories.find(c => c.id === budget.categoryId);
                    
                    if (category) {
                        // Get transactions for this category
                        const transactions = Storage.getTransactions();
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        
                        // Filter transactions for current month and this category
                        const categoryTransactions = transactions.filter(t => {
                            const date = new Date(t.date);
                            return t.categoryId === budget.categoryId && 
                                   date.getMonth() === currentMonth && 
                                   date.getFullYear() === currentYear;
                        });
                        
                        const spent = categoryTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
                        const percentage = Math.min(100, Math.round((spent / parseFloat(budget.amount)) * 100));
                        
                        // Update the progress item
                        progressItems[i].querySelector('.progress-title').textContent = category.name;
                        progressItems[i].querySelector('.progress-stats').textContent = `$${spent.toFixed(2)} / $${parseFloat(budget.amount).toFixed(2)}`;
                        progressItems[i].querySelector('.progress-bar').style.width = `${percentage}%`;
                        progressItems[i].querySelector('.progress-info').textContent = `${percentage}% spent`;
                    }
                }
            }
        }
    },
    
    /**
     * Setup the bill reminders feature
     */
    setupBillFeature: function() {
        // Get bills data
        const bills = Storage.getBills();
        const categories = Storage.getCategories();
        
        // Add functionality to the Add Bill button
        const addBillBtn = document.querySelector('.action-card .btn-primary');
        if (addBillBtn) {
            addBillBtn.disabled = false;
            addBillBtn.addEventListener('click', function() {
                window.location.href = 'index.html?page=bills&action=add';
            });
        }
        
        // Enable the Manage Recurring Bills button
        const manageBillsBtn = document.querySelector('.action-card .btn-secondary');
        if (manageBillsBtn) {
            manageBillsBtn.disabled = false;
            manageBillsBtn.addEventListener('click', function() {
                window.location.href = 'index.html?page=bills';
            });
        }
        
        // Update calendar with bill dates
        if (bills.length > 0) {
            // Mark dates with bills
            const calendarDays = document.querySelectorAll('.calendar-days .day:not(.prev-month):not(.next-month)');
            
            // Current month and year
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            bills.forEach(bill => {
                const dueDate = new Date(bill.dueDate);
                if (dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear) {
                    const dayOfMonth = dueDate.getDate();
                    
                    // Find the corresponding day in the calendar
                    const dayElement = Array.from(calendarDays).find(day => parseInt(day.textContent) === dayOfMonth);
                    if (dayElement) {
                        dayElement.classList.add('has-bill');
                    }
                }
            });
            
            // Update bill list with real data
            const billsList = document.querySelector('.bills-list');
            if (billsList && bills.length > 0) {
                // Clear existing bills
                billsList.innerHTML = '';
                
                // Sort bills by due date
                const sortedBills = [...bills].sort((a, b) => {
                    const dateA = new Date(a.dueDate);
                    const dateB = new Date(b.dueDate);
                    return dateA - dateB;
                });
                
                // Add the next 3 upcoming bills
                const upcomingBills = sortedBills.filter(bill => {
                    const dueDate = new Date(bill.dueDate);
                    return dueDate >= today;
                }).slice(0, 3);
                
                upcomingBills.forEach(bill => {
                    const dueDate = new Date(bill.dueDate);
                    const dayOfMonth = dueDate.getDate();
                    const category = categories.find(c => c.id === bill.categoryId);
                    
                    const billItem = document.createElement('div');
                    billItem.className = 'bill-item';
                    billItem.innerHTML = `
                        <div class="bill-date">${dayOfMonth}</div>
                        <div class="bill-details">
                            <div class="bill-name">${bill.name}</div>
                            <div class="bill-amount">$${parseFloat(bill.amount).toFixed(2)}</div>
                        </div>
                        <div class="bill-status">
                            <span class="status-badge pending">Pending</span>
                        </div>
                    `;
                    
                    billsList.appendChild(billItem);
                });
            }
        }
    }
};

// Initialize the features module if on the features page
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.features-grid')) {
        Features.initialize();
    }
    
    // Check if on a specific feature page and initialize it
    if (document.location.pathname.includes('income-recording.html')) {
        Features.initializeFeaturePage('income');
    } else if (document.location.pathname.includes('expense-categories.html')) {
        Features.initializeFeaturePage('expense');
    } else if (document.location.pathname.includes('budget-goals.html')) {
        Features.initializeFeaturePage('budget');
    } else if (document.location.pathname.includes('bill-reminders.html')) {
        Features.initializeFeaturePage('bill');
    }
});