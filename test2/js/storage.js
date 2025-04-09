/**
 * Storage functions for data management
 * Uses localStorage for client-side data persistence
 */

const Storage = {
    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {any} data - Data to store
     */
    save: function(key, data) {
        try {
            const serialized = JSON.stringify(data);
            localStorage.setItem(key, serialized);
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    },
    
    /**
     * Retrieve data from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} The retrieved data or defaultValue
     */
    get: function(key, defaultValue = null) {
        try {
            const serialized = localStorage.getItem(key);
            if (serialized === null) {
                return defaultValue;
            }
            return JSON.parse(serialized);
        } catch (error) {
            console.error('Error retrieving data from localStorage:', error);
            return defaultValue;
        }
    },
    
    /**
     * Remove data from localStorage
     * @param {string} key - Storage key
     */
    remove: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing data from localStorage:', error);
        }
    },
    
    /**
     * Clear all app data from localStorage
     */
    clearAll: function() {
        try {
            // Only clear keys related to this app
            const appKeys = [
                'transactions', 
                'categories', 
                'budgets', 
                'bills', 
                'goals', 
                'settings'
            ];
            
            appKeys.forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Error clearing data from localStorage:', error);
        }
    },
    
    /**
     * Initialize storage with default data if needed
     */
    initialize: function() {
        // Check if categories exist, if not create defaults
        if (!this.get('categories')) {
            this.createDefaultCategories();
        } else {
            // Check if we need to update with new categories
            this.updateCategories();
        }
        
        // Initialize empty collections if they don't exist
        if (!this.get('transactions')) {
            this.save('transactions', []);
        }
        
        if (!this.get('budgets')) {
            this.save('budgets', []);
        }
        
        if (!this.get('bills')) {
            this.save('bills', []);
        }
        
        if (!this.get('goals')) {
            this.save('goals', []);
        }
        
        // Initialize default settings
        if (!this.get('settings')) {
            const defaultSettings = {
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY',
                theme: 'light'
            };
            
            this.save('settings', defaultSettings);
        }
    },
    
    /**
     * Create default categories
     */
    createDefaultCategories: function() {
        const defaultCategories = [
            // Income categories
            { id: 'income-salary', name: 'Salary', type: 'income', color: '#2ECC71' },
            { id: 'income-freelance', name: 'Freelance', type: 'income', color: '#27AE60' },
            { id: 'income-investments', name: 'Investments', type: 'income', color: '#16A085' },
            { id: 'income-gifts', name: 'Gifts', type: 'income', color: '#1ABC9C' },
            { id: 'income-bonus', name: 'Bonus', type: 'income', color: '#2980B9' },
            { id: 'income-other', name: 'Other Income', type: 'income', color: '#3498DB' },
            
            // Expense categories
            { id: 'expense-housing', name: 'Housing', type: 'expense', color: '#E74C3C' },
            { id: 'expense-utilities', name: 'Utilities', type: 'expense', color: '#C0392B' },
            { id: 'expense-groceries', name: 'Groceries', type: 'expense', color: '#E67E22' },
            { id: 'expense-dining', name: 'Dining Out', type: 'expense', color: '#D35400' },
            { id: 'expense-transportation', name: 'Transportation', type: 'expense', color: '#F39C12' },
            { id: 'expense-healthcare', name: 'Healthcare', type: 'expense', color: '#F1C40F' },
            { id: 'expense-entertainment', name: 'Entertainment', type: 'expense', color: '#8E44AD' },
            { id: 'expense-shopping', name: 'Shopping', type: 'expense', color: '#9B59B6' },
            { id: 'expense-personal', name: 'Personal Care', type: 'expense', color: '#3498DB' },
            { id: 'expense-education', name: 'Education', type: 'expense', color: '#2980B9' },
            { id: 'expense-insurance', name: 'Insurance', type: 'expense', color: '#1ABC9C' },
            { id: 'expense-debt', name: 'Debt Payments', type: 'expense', color: '#16A085' },
            { id: 'expense-savings', name: 'Savings', type: 'expense', color: '#2ECC71' },
            { id: 'expense-subscriptions', name: 'Subscriptions', type: 'expense', color: '#9A59B5' },
            { id: 'expense-other', name: 'Other Expenses', type: 'expense', color: '#7F8C8D' }
        ];
        
        this.save('categories', defaultCategories);
    },
    
    /**
     * Update existing categories with new ones
     * This ensures new category options are available to users
     */
    updateCategories: function() {
        const categories = this.getCategories();
        let hasUpdates = false;
        
        // Check if we need to add the income-bonus category
        if (!categories.some(cat => cat.id === 'income-bonus')) {
            categories.push({ 
                id: 'income-bonus', 
                name: 'Bonus', 
                type: 'income', 
                color: '#2980B9' 
            });
            hasUpdates = true;
        }
        
        // Check if we need to add the expense-subscriptions category
        if (!categories.some(cat => cat.id === 'expense-subscriptions')) {
            categories.push({ 
                id: 'expense-subscriptions', 
                name: 'Subscriptions', 
                type: 'expense', 
                color: '#9A59B5' 
            });
            hasUpdates = true;
        }
        
        // If we added any new categories, save the updated list
        if (hasUpdates) {
            this.save('categories', categories);
            console.log('Categories updated with new options');
        }
    },
    
    /**
     * Get all transactions
     * @returns {Array} Array of transactions
     */
    getTransactions: function() {
        return this.get('transactions', []);
    },
    
    /**
     * Add or update a transaction
     * @param {Object} transaction - Transaction object
     */
    saveTransaction: function(transaction) {
        const transactions = this.getTransactions();
        const existingIndex = transactions.findIndex(t => t.id === transaction.id);
        
        if (existingIndex >= 0) {
            transactions[existingIndex] = transaction;
        } else {
            transactions.push(transaction);
        }
        
        this.save('transactions', transactions);
    },
    
    /**
     * Delete a transaction
     * @param {string} id - Transaction ID
     */
    deleteTransaction: function(id) {
        const transactions = this.getTransactions();
        const updated = transactions.filter(t => t.id !== id);
        this.save('transactions', updated);
    },
    
    /**
     * Get all categories
     * @returns {Array} Array of categories
     */
    getCategories: function() {
        return this.get('categories', []);
    },
    
    /**
     * Add or update a category
     * @param {Object} category - Category object
     */
    saveCategory: function(category) {
        const categories = this.getCategories();
        const existingIndex = categories.findIndex(c => c.id === category.id);
        
        if (existingIndex >= 0) {
            categories[existingIndex] = category;
        } else {
            categories.push(category);
        }
        
        this.save('categories', categories);
    },
    
    /**
     * Delete a category
     * @param {string} id - Category ID
     */
    deleteCategory: function(id) {
        const categories = this.getCategories();
        const updated = categories.filter(c => c.id !== id);
        this.save('categories', updated);
    },
    
    /**
     * Get all budgets
     * @returns {Array} Array of budgets
     */
    getBudgets: function() {
        return this.get('budgets', []);
    },
    
    /**
     * Add or update a budget
     * @param {Object} budget - Budget object
     */
    saveBudget: function(budget) {
        const budgets = this.getBudgets();
        const existingIndex = budgets.findIndex(b => b.id === budget.id);
        
        if (existingIndex >= 0) {
            budgets[existingIndex] = budget;
        } else {
            budgets.push(budget);
        }
        
        this.save('budgets', budgets);
    },
    
    /**
     * Delete a budget
     * @param {string} id - Budget ID
     */
    deleteBudget: function(id) {
        const budgets = this.getBudgets();
        const updated = budgets.filter(b => b.id !== id);
        this.save('budgets', updated);
    },
    
    /**
     * Get all bills
     * @returns {Array} Array of bills
     */
    getBills: function() {
        return this.get('bills', []);
    },
    
    /**
     * Add or update a bill
     * @param {Object} bill - Bill object
     */
    saveBill: function(bill) {
        const bills = this.getBills();
        const existingIndex = bills.findIndex(b => b.id === bill.id);
        
        if (existingIndex >= 0) {
            bills[existingIndex] = bill;
        } else {
            bills.push(bill);
        }
        
        this.save('bills', bills);
    },
    
    /**
     * Delete a bill
     * @param {string} id - Bill ID
     */
    deleteBill: function(id) {
        const bills = this.getBills();
        const updated = bills.filter(b => b.id !== id);
        this.save('bills', updated);
    },
    
    /**
     * Get all goals
     * @returns {Array} Array of goals
     */
    getGoals: function() {
        return this.get('goals', []);
    },
    
    /**
     * Add or update a goal
     * @param {Object} goal - Goal object
     */
    saveGoal: function(goal) {
        const goals = this.getGoals();
        const existingIndex = goals.findIndex(g => g.id === goal.id);
        
        if (existingIndex >= 0) {
            goals[existingIndex] = goal;
        } else {
            goals.push(goal);
        }
        
        this.save('goals', goals);
    },
    
    /**
     * Delete a goal
     * @param {string} id - Goal ID
     */
    deleteGoal: function(id) {
        const goals = this.getGoals();
        const updated = goals.filter(g => g.id !== id);
        this.save('goals', updated);
    },
    
    /**
     * Get all settings
     * @returns {Object} Settings object
     */
    getSettings: function() {
        return this.get('settings', {
            currency: 'USD',
            dateFormat: 'MM/DD/YYYY',
            theme: 'light'
        });
    },
    
    /**
     * Save settings
     * @param {Object} settings - Settings object
     */
    saveSettings: function(settings) {
        this.save('settings', settings);
    },
    
    /**
     * Export all data as a JSON object
     * @returns {Object} All app data
     */
    exportData: function() {
        return {
            transactions: this.getTransactions(),
            categories: this.getCategories(),
            budgets: this.getBudgets(),
            bills: this.getBills(),
            goals: this.getGoals(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    },
    
    /**
     * Import data from a JSON object
     * @param {Object} data - Data to import
     */
    importData: function(data) {
        if (data.transactions) {
            this.save('transactions', data.transactions);
        }
        
        if (data.categories) {
            this.save('categories', data.categories);
        }
        
        if (data.budgets) {
            this.save('budgets', data.budgets);
        }
        
        if (data.bills) {
            this.save('bills', data.bills);
        }
        
        if (data.goals) {
            this.save('goals', data.goals);
        }
        
        if (data.settings) {
            this.save('settings', data.settings);
        }
    },
    
    /**
     * Check if storage is supported
     * @returns {boolean} Whether localStorage is supported
     */
    isSupported: function() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, testKey);
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }
};