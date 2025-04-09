/**
 * Settings module
 * Handles user settings and preferences
 */

const Settings = {
    /**
     * Initialize the Settings module
     */
    initialize: function() {
        this.setupEventListeners();
        this.loadCurrentSettings();
        this.loadCategories();
    },
    
    /**
     * Set up settings-specific event listeners
     */
    setupEventListeners: function() {
        // Profile settings form
        const profileSettingsForm = document.getElementById('profile-settings-form');
        if (profileSettingsForm) {
            profileSettingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveProfileSettings();
            });
        }
        
        // Add category button
        const addCategoryBtn = document.getElementById('add-category');
        if (addCategoryBtn) {
            addCategoryBtn.addEventListener('click', () => {
                this.showAddCategoryModal();
            });
        }
        
        // Category form submission
        const categoryForm = document.getElementById('category-form');
        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveCategory();
            });
        }
        
        // Export buttons
        const exportJsonBtn = document.getElementById('export-json');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                DataExport.exportJSON();
            });
        }
        
        const exportCsvBtn = document.getElementById('export-csv');
        if (exportCsvBtn) {
            exportCsvBtn.addEventListener('click', () => {
                DataExport.exportCSV();
            });
        }
        
        // Import button
        const importDataBtn = document.getElementById('import-data');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                DataExport.importData();
            });
        }
        
        // Reset data button
        const resetDataBtn = document.getElementById('reset-data');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => {
                this.confirmResetData();
            });
        }
    },
    
    /**
     * Refresh the settings view
     */
    refresh: function() {
        this.loadCurrentSettings();
        this.loadCategories();
    },
    
    /**
     * Load current user settings
     */
    loadCurrentSettings: function() {
        const settings = Storage.getSettings();
        
        // Set currency select
        const currencySelect = document.getElementById('currency');
        if (currencySelect && settings.currency) {
            currencySelect.value = settings.currency;
        }
        
        // Set date format select
        const dateFormatSelect = document.getElementById('date-format');
        if (dateFormatSelect && settings.dateFormat) {
            dateFormatSelect.value = settings.dateFormat;
        }
    },
    
    /**
     * Load categories for the settings page
     */
    loadCategories: function() {
        const categories = Storage.getCategories();
        
        // Separate categories by type
        const incomeCategories = categories.filter(c => c.type === 'income');
        const expenseCategories = categories.filter(c => c.type === 'expense');
        
        // Populate income categories list
        const incomeCategoriesList = document.getElementById('income-categories');
        if (incomeCategoriesList) {
            incomeCategoriesList.innerHTML = '';
            
            if (incomeCategories.length === 0) {
                incomeCategoriesList.innerHTML = '<li class="no-categories">No income categories</li>';
            } else {
                incomeCategories.forEach(category => {
                    const categoryItem = document.createElement('li');
                    categoryItem.className = 'category-item';
                    
                    categoryItem.innerHTML = `
                        <div class="category-label">
                            <span class="category-color" style="background-color: ${category.color}"></span>
                            <span>${category.name}</span>
                        </div>
                        <div class="category-actions">
                            <button class="btn-icon-only edit" data-id="${category.id}">
                                <i data-feather="edit-2"></i>
                            </button>
                            <button class="btn-icon-only delete" data-id="${category.id}">
                                <i data-feather="trash-2"></i>
                            </button>
                        </div>
                    `;
                    
                    // Add event listeners for edit and delete buttons
                    const editButton = categoryItem.querySelector('.edit');
                    editButton.addEventListener('click', () => {
                        this.editCategory(category.id);
                    });
                    
                    const deleteButton = categoryItem.querySelector('.delete');
                    deleteButton.addEventListener('click', () => {
                        this.deleteCategory(category.id);
                    });
                    
                    incomeCategoriesList.appendChild(categoryItem);
                });
            }
        }
        
        // Populate expense categories list
        const expenseCategoriesList = document.getElementById('expense-categories');
        if (expenseCategoriesList) {
            expenseCategoriesList.innerHTML = '';
            
            if (expenseCategories.length === 0) {
                expenseCategoriesList.innerHTML = '<li class="no-categories">No expense categories</li>';
            } else {
                expenseCategories.forEach(category => {
                    const categoryItem = document.createElement('li');
                    categoryItem.className = 'category-item';
                    
                    categoryItem.innerHTML = `
                        <div class="category-label">
                            <span class="category-color" style="background-color: ${category.color}"></span>
                            <span>${category.name}</span>
                        </div>
                        <div class="category-actions">
                            <button class="btn-icon-only edit" data-id="${category.id}">
                                <i data-feather="edit-2"></i>
                            </button>
                            <button class="btn-icon-only delete" data-id="${category.id}">
                                <i data-feather="trash-2"></i>
                            </button>
                        </div>
                    `;
                    
                    // Add event listeners for edit and delete buttons
                    const editButton = categoryItem.querySelector('.edit');
                    editButton.addEventListener('click', () => {
                        this.editCategory(category.id);
                    });
                    
                    const deleteButton = categoryItem.querySelector('.delete');
                    deleteButton.addEventListener('click', () => {
                        this.deleteCategory(category.id);
                    });
                    
                    expenseCategoriesList.appendChild(categoryItem);
                });
            }
        }
        
        // Initialize Feather icons for the new elements
        feather.replace();
    },
    
    /**
     * Save profile settings
     */
    saveProfileSettings: function() {
        const currencySelect = document.getElementById('currency');
        const dateFormatSelect = document.getElementById('date-format');
        
        if (!currencySelect || !dateFormatSelect) {
            Utils.showNotification('Error saving settings', 'error');
            return;
        }
        
        // Get current settings
        const currentSettings = Storage.getSettings();
        
        // Update settings
        const newSettings = {
            ...currentSettings,
            currency: currencySelect.value,
            dateFormat: dateFormatSelect.value
        };
        
        // Save settings
        Storage.saveSettings(newSettings);
        
        // Show success message
        Utils.showNotification('Settings saved successfully', 'success');
        
        // Refresh any displayed currency or date formats
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
        
        if (document.getElementById('transactions-page').classList.contains('active')) {
            Transactions.refresh();
        }
        
        if (document.getElementById('budgets-page').classList.contains('active')) {
            Budgets.refresh();
        }
        
        if (document.getElementById('goals-page').classList.contains('active')) {
            Goals.refresh();
        }
        
        if (document.getElementById('bills-page').classList.contains('active')) {
            Bills.refresh();
        }
        
        if (document.getElementById('reports-page').classList.contains('active')) {
            Reports.refresh();
        }
    },
    
    /**
     * Show the add category modal
     */
    showAddCategoryModal: function() {
        // Reset form
        const form = document.getElementById('category-form');
        if (form) form.reset();
        
        // Clear hidden ID field
        const idField = document.getElementById('category-id');
        if (idField) idField.value = '';
        
        // Set default color
        const colorField = document.getElementById('category-color');
        if (colorField) colorField.value = Utils.getRandomColor();
        
        // Update modal title
        const modalTitle = document.getElementById('category-modal-title');
        if (modalTitle) modalTitle.textContent = 'Add Category';
        
        // Show the modal
        Utils.showModal('add-category-modal');
    },
    
    /**
     * Edit a category
     * @param {string} id - Category ID
     */
    editCategory: function(id) {
        const categories = Storage.getCategories();
        const category = categories.find(c => c.id === id);
        
        if (!category) {
            Utils.showNotification('Category not found', 'error');
            return;
        }
        
        // Set form values
        const form = document.getElementById('category-form');
        const idField = document.getElementById('category-id');
        const nameField = document.getElementById('category-name');
        const typeField = document.getElementById('category-type');
        const colorField = document.getElementById('category-color');
        
        if (idField) idField.value = category.id;
        if (nameField) nameField.value = category.name;
        if (typeField) typeField.value = category.type;
        if (colorField) colorField.value = category.color;
        
        // Update modal title
        const modalTitle = document.getElementById('category-modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Category';
        
        // Show the modal
        Utils.showModal('add-category-modal');
    },
    
    /**
     * Delete a category
     * @param {string} id - Category ID
     */
    deleteCategory: function(id) {
        // Check if category is used in transactions
        const transactions = Storage.getTransactions();
        const transactionsUsingCategory = transactions.filter(t => t.categoryId === id);
        
        // Check if category is used in budgets
        const budgets = Storage.getBudgets();
        const budgetsUsingCategory = budgets.filter(b => b.categoryId === id);
        
        // Check if category is used in bills
        const bills = Storage.getBills();
        const billsUsingCategory = bills.filter(b => b.categoryId === id);
        
        // If category is in use, show warning
        if (transactionsUsingCategory.length > 0 || budgetsUsingCategory.length > 0 || billsUsingCategory.length > 0) {
            const usageCount = transactionsUsingCategory.length + budgetsUsingCategory.length + billsUsingCategory.length;
            
            Utils.showConfirmation(
                `This category is used in ${usageCount} items (transactions, budgets, or bills). Deleting it will remove the category from these items. Are you sure you want to continue?`,
                () => {
                    this.performCategoryDeletion(id);
                },
                'Delete Category'
            );
        } else {
            // If not in use, just confirm deletion
            Utils.showConfirmation(
                'Are you sure you want to delete this category?',
                () => {
                    this.performCategoryDeletion(id);
                },
                'Delete Category'
            );
        }
    },
    
    /**
     * Perform category deletion after confirmation
     * @param {string} id - Category ID
     */
    performCategoryDeletion: function(id) {
        const categories = Storage.getCategories();
        const category = categories.find(c => c.id === id);
        
        if (!category) {
            Utils.showNotification('Category not found', 'error');
            return;
        }
        
        // Get default category of the same type to reassign items
        const defaultCategoryId = category.type === 'income' ? 'income-other' : 'expense-other';
        
        // Update transactions
        const transactions = Storage.getTransactions();
        transactions.forEach(transaction => {
            if (transaction.categoryId === id) {
                transaction.categoryId = defaultCategoryId;
                Storage.saveTransaction(transaction);
            }
        });
        
        // Update budgets
        const budgets = Storage.getBudgets();
        budgets.forEach(budget => {
            if (budget.categoryId === id) {
                budget.categoryId = defaultCategoryId;
                Storage.saveBudget(budget);
            }
        });
        
        // Update bills
        const bills = Storage.getBills();
        bills.forEach(bill => {
            if (bill.categoryId === id) {
                bill.categoryId = defaultCategoryId;
                Storage.saveBill(bill);
            }
        });
        
        // Delete the category
        Storage.deleteCategory(id);
        
        // Show success message
        Utils.showNotification('Category deleted successfully', 'success');
        
        // Refresh categories list
        this.loadCategories();
        
        // Refresh other pages if visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
        
        if (document.getElementById('transactions-page').classList.contains('active')) {
            Transactions.refresh();
        }
        
        if (document.getElementById('budgets-page').classList.contains('active')) {
            Budgets.refresh();
        }
        
        if (document.getElementById('bills-page').classList.contains('active')) {
            Bills.refresh();
        }
    },
    
    /**
     * Save a category (new or edited)
     */
    saveCategory: function() {
        const idField = document.getElementById('category-id');
        const nameField = document.getElementById('category-name');
        const typeField = document.getElementById('category-type');
        const colorField = document.getElementById('category-color');
        
        // Validate fields
        if (!nameField.value || !typeField.value) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const isEditing = idField.value !== '';
        const categoryId = isEditing ? idField.value : `${typeField.value}-${nameField.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Utils.generateId().substring(0, 6)}`;
        
        // Create category object
        const category = {
            id: categoryId,
            name: nameField.value,
            type: typeField.value,
            color: colorField.value || Utils.getRandomColor()
        };
        
        // Save the category
        Storage.saveCategory(category);
        
        // Show success message
        Utils.showNotification(
            isEditing ? 'Category updated successfully' : 'Category added successfully',
            'success'
        );
        
        // Hide the modal
        Utils.hideModal('add-category-modal');
        
        // Refresh the categories list
        this.loadCategories();
        
        // Refresh other pages if visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
        
        if (document.getElementById('transactions-page').classList.contains('active')) {
            Transactions.refresh();
        }
        
        if (document.getElementById('budgets-page').classList.contains('active')) {
            Budgets.refresh();
        }
        
        if (document.getElementById('bills-page').classList.contains('active')) {
            Bills.refresh();
        }
    },
    
    /**
     * Confirm reset data action
     */
    confirmResetData: function() {
        Utils.showConfirmation(
            'This will permanently delete all your financial data including transactions, budgets, bills, and goals. This action cannot be undone. Are you sure you want to continue?',
            () => {
                this.resetData();
            },
            'Reset All Data'
        );
    },
    
    /**
     * Reset all application data
     */
    resetData: function() {
        // Clear all data
        Storage.clearAll();
        
        // Re-initialize with default data
        Storage.initialize();
        
        // Show success message
        Utils.showNotification('All data has been reset', 'success');
        
        // Refresh all pages
        this.refresh();
        
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        } else {
            // Navigate to dashboard
            const dashboardLink = document.querySelector('.sidebar-menu li[data-page="dashboard"]');
            if (dashboardLink) {
                dashboardLink.click();
            }
        }
    },
    
    /**
     * Get current settings
     * @returns {Object} Current settings
     */
    getSettings: function() {
        return Storage.getSettings();
    }
};
