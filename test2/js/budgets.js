/**
 * Budgets module
 * Handles all budget-related functionality
 */

const Budgets = {
    /**
     * Initialize the Budgets module
     */
    initialize: function() {
        this.setupEventListeners();
        this.refresh();
    },
    
    /**
     * Set up budget-specific event listeners
     */
    setupEventListeners: function() {
        // Add budget button
        const addBudgetCategoryBtn = document.getElementById('add-budget-category');
        if (addBudgetCategoryBtn) {
            addBudgetCategoryBtn.addEventListener('click', () => {
                this.showAddBudgetModal();
            });
        }
        
        // Create first budget button on budgets page
        const createFirstBudgetCategoryBtn = document.getElementById('create-first-budget-category');
        if (createFirstBudgetCategoryBtn) {
            createFirstBudgetCategoryBtn.addEventListener('click', () => {
                this.showAddBudgetModal();
            });
        }
        
        // Budget form submission
        const budgetForm = document.getElementById('budget-form');
        if (budgetForm) {
            budgetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBudget();
            });
        }
        
        // Budget month filter
        const budgetMonthFilter = document.getElementById('budget-month-filter');
        if (budgetMonthFilter) {
            budgetMonthFilter.addEventListener('change', () => {
                this.refresh();
            });
        }
    },
    
    /**
     * Refresh the budgets view
     */
    refresh: function() {
        this.loadCategories();
        this.updateBudgetSummary();
        this.updateBudgetCategories();
        this.updateBudgetChart();
    },
    
    /**
     * Load expense categories for budget dropdown
     */
    loadCategories: function() {
        const categories = Storage.getCategories();
        const expenseCategories = categories.filter(c => c.type === 'expense');
        
        const budgetCategorySelect = document.getElementById('budget-category');
        if (!budgetCategorySelect) return;
        
        // Save selected value
        const selectedValue = budgetCategorySelect.value;
        
        // Clear existing options except the first one
        while (budgetCategorySelect.options.length > 1) {
            budgetCategorySelect.remove(1);
        }
        
        // Add category options
        expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            budgetCategorySelect.appendChild(option);
        });
        
        // Restore selected value if it exists
        if (selectedValue && budgetCategorySelect.querySelector(`option[value="${selectedValue}"]`)) {
            budgetCategorySelect.value = selectedValue;
        }
    },
    
    /**
     * Update the budget summary section
     */
    updateBudgetSummary: function() {
        const budgets = Storage.getBudgets();
        const transactions = Storage.getTransactions();
        
        // Get the selected month period
        const monthFilter = document.getElementById('budget-month-filter');
        const period = monthFilter ? monthFilter.value : 'current';
        
        // Determine date range
        const today = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'previous':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'next':
                startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                break;
            case 'current':
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
        }
        
        // Calculate total budget amount and amount spent
        let totalBudget = 0;
        let totalSpent = 0;
        
        budgets.forEach(budget => {
            totalBudget += parseFloat(budget.amount);
            
            // Calculate amount spent in this category for the current period
            const categorySpent = transactions
                .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                })
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            totalSpent += categorySpent;
        });
        
        const totalRemaining = Math.max(0, totalBudget - totalSpent);
        
        // Update UI
        document.getElementById('total-budget-amount').textContent = Utils.formatCurrency(totalBudget);
        document.getElementById('spent-budget-amount').textContent = Utils.formatCurrency(totalSpent);
        document.getElementById('remaining-budget-amount').textContent = Utils.formatCurrency(totalRemaining);
    },
    
    /**
     * Update the budget categories section
     */
    updateBudgetCategories: function() {
        const budgets = Storage.getBudgets();
        const transactions = Storage.getTransactions();
        const categories = Storage.getCategories();
        
        const budgetCategoriesContainer = document.getElementById('budget-categories');
        const budgetsEmptyState = document.getElementById('budgets-empty-state');
        
        if (!budgetCategoriesContainer) return;
        
        // Clear the container
        budgetCategoriesContainer.innerHTML = '';
        
        if (budgets.length === 0) {
            // Show empty state
            if (budgetsEmptyState) budgetsEmptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        if (budgetsEmptyState) budgetsEmptyState.style.display = 'none';
        
        // Get the selected month period
        const monthFilter = document.getElementById('budget-month-filter');
        const period = monthFilter ? monthFilter.value : 'current';
        
        // Determine date range
        const today = new Date();
        let startDate, endDate, monthName;
        
        switch (period) {
            case 'previous':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                monthName = Utils.getMonthName(startDate.getMonth());
                break;
            case 'next':
                startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                monthName = Utils.getMonthName(startDate.getMonth());
                break;
            case 'current':
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                monthName = Utils.getMonthName(startDate.getMonth());
                break;
        }
        
        // Create budget category cards
        budgets.forEach(budget => {
            const category = categories.find(c => c.id === budget.categoryId);
            if (!category) return;
            
            // Calculate amount spent in this category for the current period
            const spent = transactions
                .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                })
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            const budgetAmount = parseFloat(budget.amount);
            const remaining = Utils.calculateBudgetRemaining(budgetAmount, spent);
            const progress = Utils.calculateBudgetProgress(budgetAmount, spent);
            const status = Utils.getBudgetStatus(progress);
            
            // Create budget category card
            const budgetCategoryCard = document.createElement('div');
            budgetCategoryCard.className = 'budget-category-card';
            budgetCategoryCard.innerHTML = `
                <div class="budget-category-header">
                    <div class="budget-category-name">${category.name}</div>
                    <div class="budget-category-amount">${Utils.formatCurrency(budgetAmount)}</div>
                </div>
                <div class="progress-bar-outer">
                    <div class="progress-bar-inner ${status}" style="width: ${progress}%"></div>
                </div>
                <div class="budget-category-details">
                    <div class="spent">Spent: ${Utils.formatCurrency(spent)}</div>
                    <div class="remaining">Remaining: ${Utils.formatCurrency(remaining)}</div>
                </div>
                <div class="budget-category-actions">
                    <button class="btn-icon-only edit" data-id="${budget.id}">
                        <i data-feather="edit-2"></i>
                    </button>
                    <button class="btn-icon-only delete" data-id="${budget.id}">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            `;
            
            // Add edit and delete event listeners
            const editButton = budgetCategoryCard.querySelector('.edit');
            editButton.addEventListener('click', () => {
                this.editBudget(budget.id);
            });
            
            const deleteButton = budgetCategoryCard.querySelector('.delete');
            deleteButton.addEventListener('click', () => {
                this.deleteBudget(budget.id);
            });
            
            budgetCategoriesContainer.appendChild(budgetCategoryCard);
        });
        
        // Initialize Feather icons
        feather.replace();
    },
    
    /**
     * Update the budget chart
     */
    updateBudgetChart: function() {
        const budgets = Storage.getBudgets();
        const transactions = Storage.getTransactions();
        const categories = Storage.getCategories();
        
        // Get the selected month period
        const monthFilter = document.getElementById('budget-month-filter');
        const period = monthFilter ? monthFilter.value : 'current';
        
        // Determine date range
        const today = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'previous':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'next':
                startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
                break;
            case 'current':
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
        }
        
        // Prepare data for chart
        const labels = [];
        const budgetData = [];
        const spentData = [];
        const backgroundColors = [];
        
        budgets.forEach(budget => {
            const category = categories.find(c => c.id === budget.categoryId);
            if (!category) return;
            
            labels.push(category.name);
            budgetData.push(parseFloat(budget.amount));
            
            // Calculate amount spent in this category for the current period
            const spent = transactions
                .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
                .filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= startDate && transactionDate <= endDate;
                })
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            spentData.push(spent);
            backgroundColors.push(category.color);
        });
        
        // Create the chart
        const ctx = document.getElementById('budget-chart');
        
        // Destroy existing chart if it exists
        if (this.budgetChart) {
            this.budgetChart.destroy();
        }
        
        if (budgets.length === 0) {
            return;
        }
        
        this.budgetChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Budget',
                        data: budgetData,
                        backgroundColor: backgroundColors.map(color => `${color}40`),
                        borderColor: backgroundColors,
                        borderWidth: 1
                    },
                    {
                        label: 'Spent',
                        data: spentData,
                        backgroundColor: backgroundColors.map(color => `${color}80`),
                        borderColor: backgroundColors,
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return Utils.formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += Utils.formatCurrency(context.raw);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Show the add budget modal
     */
    showAddBudgetModal: function() {
        // Reset form
        const form = document.getElementById('budget-form');
        if (form) form.reset();
        
        // Clear hidden ID field
        const idField = document.getElementById('budget-id');
        if (idField) idField.value = '';
        
        // Update modal title
        const modalTitle = document.getElementById('budget-modal-title');
        if (modalTitle) modalTitle.textContent = 'Add Budget Category';
        
        // Load categories
        this.loadCategories();
        
        // Show the modal
        Utils.showModal('add-budget-modal');
    },
    
    /**
     * Edit a budget
     * @param {string} id - Budget ID
     */
    editBudget: function(id) {
        const budgets = Storage.getBudgets();
        const budget = budgets.find(b => b.id === id);
        
        if (!budget) {
            Utils.showNotification('Budget not found', 'error');
            return;
        }
        
        // Set form values
        const form = document.getElementById('budget-form');
        const idField = document.getElementById('budget-id');
        const categoryField = document.getElementById('budget-category');
        const amountField = document.getElementById('budget-amount');
        
        if (idField) idField.value = budget.id;
        if (categoryField) {
            // Ensure the category options are loaded first
            this.loadCategories();
            categoryField.value = budget.categoryId;
        }
        if (amountField) amountField.value = budget.amount;
        
        // Update modal title
        const modalTitle = document.getElementById('budget-modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Budget Category';
        
        // Show the modal
        Utils.showModal('add-budget-modal');
    },
    
    /**
     * Delete a budget
     * @param {string} id - Budget ID
     */
    deleteBudget: function(id) {
        Utils.showConfirmation(
            'Are you sure you want to delete this budget? This action cannot be undone.',
            () => {
                Storage.deleteBudget(id);
                Utils.showNotification('Budget deleted successfully', 'success');
                this.refresh();
                
                // Refresh dashboard if it's visible
                if (document.getElementById('dashboard-page').classList.contains('active')) {
                    Dashboard.refresh();
                }
            },
            'Delete Budget'
        );
    },
    
    /**
     * Save a budget (new or edited)
     */
    saveBudget: function() {
        const idField = document.getElementById('budget-id');
        const categoryField = document.getElementById('budget-category');
        const amountField = document.getElementById('budget-amount');
        
        // Validate fields
        if (!categoryField.value || !amountField.value) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const amount = parseFloat(amountField.value);
        if (isNaN(amount) || amount <= 0) {
            Utils.showNotification('Please enter a valid budget amount', 'error');
            return;
        }
        
        const isEditing = idField.value !== '';
        
        // Check if category already has a budget (for new budgets)
        if (!isEditing) {
            const budgets = Storage.getBudgets();
            const existingBudget = budgets.find(b => b.categoryId === categoryField.value);
            
            if (existingBudget) {
                Utils.showNotification('This category already has a budget', 'error');
                return;
            }
        }
        
        // Create budget object
        const budget = {
            id: isEditing ? idField.value : Utils.generateId(),
            categoryId: categoryField.value,
            amount: amount,
            createdAt: isEditing ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save the budget
        Storage.saveBudget(budget);
        
        // Show success message
        Utils.showNotification(
            isEditing ? 'Budget updated successfully' : 'Budget added successfully',
            'success'
        );
        
        // Hide the modal
        Utils.hideModal('add-budget-modal');
        
        // Refresh the budgets
        this.refresh();
        
        // Refresh dashboard if it's visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
    }
};
