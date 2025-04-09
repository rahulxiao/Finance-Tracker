/**
 * Transactions module
 * Handles all transaction-related functionality
 */

const Transactions = {
    /**
     * Initialize the Transactions module
     */
    initialize: function() {
        this.setupEventListeners();
        this.loadCategories();
        this.refresh();
    },
    
    /**
     * Set up transaction-specific event listeners
     */
    setupEventListeners: function() {
        // Add transaction button on transactions page
        const addTransactionBtn = document.getElementById('add-transaction-btn');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                this.showAddTransactionModal();
            });
        }
        
        // Add transaction from empty state
        const addTransactionEmpty = document.getElementById('add-transaction-empty');
        if (addTransactionEmpty) {
            addTransactionEmpty.addEventListener('click', () => {
                this.showAddTransactionModal();
            });
        }
        
        // Transaction form submission
        const transactionForm = document.getElementById('transaction-form');
        if (transactionForm) {
            transactionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveTransaction();
            });
        }
        
        // Transaction type change (to update categories)
        const transactionType = document.getElementById('transaction-type');
        if (transactionType) {
            transactionType.addEventListener('change', () => {
                this.updateCategoryOptions(transactionType.value);
            });
        }
        
        // Search and filter transactions
        const transactionSearch = document.getElementById('transaction-search');
        if (transactionSearch) {
            transactionSearch.addEventListener('input', Utils.debounce(() => {
                this.applyFilters();
            }, 300));
        }
        
        const transactionTypeFilter = document.getElementById('transaction-type-filter');
        if (transactionTypeFilter) {
            transactionTypeFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        const transactionCategoryFilter = document.getElementById('transaction-category-filter');
        if (transactionCategoryFilter) {
            transactionCategoryFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
        
        const transactionDateFilter = document.getElementById('transaction-date-filter');
        if (transactionDateFilter) {
            transactionDateFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    },
    
    /**
     * Refresh the transactions list and summary
     */
    refresh: function() {
        this.loadCategories();
        this.applyFilters();
        this.updateTransactionsSummary();
    },
    
    /**
     * Load categories for dropdowns
     */
    loadCategories: function() {
        const categories = Storage.getCategories();
        
        // Populate category filter dropdown
        const categoryFilter = document.getElementById('transaction-category-filter');
        if (categoryFilter) {
            // Save selected value
            const selectedValue = categoryFilter.value;
            
            // Clear existing options but keep the first one
            while (categoryFilter.options.length > 1) {
                categoryFilter.remove(1);
            }
            
            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categoryFilter.appendChild(option);
            });
            
            // Restore selected value if it exists
            if (selectedValue && categoryFilter.querySelector(`option[value="${selectedValue}"]`)) {
                categoryFilter.value = selectedValue;
            }
        }
        
        // Initialize transaction category dropdown for the form
        this.updateCategoryOptions();
    },
    
    /**
     * Update category options based on transaction type
     * @param {string} type - Transaction type (income, expense, transfer)
     */
    updateCategoryOptions: function(type = '') {
        const categories = Storage.getCategories();
        const categorySelect = document.getElementById('transaction-category');
        
        if (!categorySelect) return;
        
        // Save selected value
        const selectedValue = categorySelect.value;
        
        // Clear existing options but keep the first one
        while (categorySelect.options.length > 1) {
            categorySelect.remove(1);
        }
        
        // Filter categories based on transaction type
        let filteredCategories = categories;
        if (type === 'income') {
            filteredCategories = categories.filter(c => c.type === 'income');
        } else if (type === 'expense') {
            filteredCategories = categories.filter(c => c.type === 'expense');
        }
        
        // Add category options
        filteredCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        // Restore selected value if it exists and is valid for the current type
        if (selectedValue && categorySelect.querySelector(`option[value="${selectedValue}"]`)) {
            categorySelect.value = selectedValue;
        } else {
            categorySelect.selectedIndex = 0;
        }
    },
    
    /**
     * Apply filters to the transactions list
     */
    applyFilters: function() {
        const transactions = Storage.getTransactions();
        const searchInput = document.getElementById('transaction-search');
        const typeFilter = document.getElementById('transaction-type-filter');
        const categoryFilter = document.getElementById('transaction-category-filter');
        const dateFilter = document.getElementById('transaction-date-filter');
        
        let filteredTransactions = [...transactions];
        
        // Apply search filter
        if (searchInput && searchInput.value.trim() !== '') {
            const searchTerm = searchInput.value.trim().toLowerCase();
            filteredTransactions = filteredTransactions.filter(transaction => 
                transaction.description.toLowerCase().includes(searchTerm) ||
                (transaction.notes && transaction.notes.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply type filter
        if (typeFilter && typeFilter.value !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => 
                transaction.type === typeFilter.value
            );
        }
        
        // Apply category filter
        if (categoryFilter && categoryFilter.value !== 'all') {
            filteredTransactions = filteredTransactions.filter(transaction => 
                transaction.categoryId === categoryFilter.value
            );
        }
        
        // Apply date filter
        if (dateFilter && dateFilter.value !== 'all') {
            const dateRange = Utils.getDateRangeForPeriod(dateFilter.value);
            
            filteredTransactions = filteredTransactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
            });
        }
        
        // Sort by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Update the table
        this.renderTransactionsTable(filteredTransactions);
        
        // Update summary based on filtered transactions
        this.updateTransactionsSummary(filteredTransactions);
    },
    
    /**
     * Render the transactions table
     * @param {Array} transactions - Array of transactions to display
     */
    renderTransactionsTable: function(transactions) {
        const tableBody = document.getElementById('transactions-table-body');
        const emptyState = document.getElementById('transactions-table-empty-state');
        
        if (!tableBody) return;
        
        // Clear the table
        tableBody.innerHTML = '';
        
        // Show empty state if no transactions
        if (transactions.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        if (emptyState) emptyState.style.display = 'none';
        
        const categories = Storage.getCategories();
        
        // Create table rows
        transactions.forEach(transaction => {
            const category = categories.find(c => c.id === transaction.categoryId) || { name: 'Unknown', color: '#ccc' };
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${Utils.formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>
                    <span class="category-tag" style="background-color: ${category.color}20; color: ${category.color}">
                        ${category.name}
                    </span>
                </td>
                <td>${transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}</td>
                <td class="amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${Utils.formatCurrency(transaction.amount)}
                </td>
                <td class="action-cell">
                    <div class="row-actions">
                        <button class="btn-icon-only edit" data-id="${transaction.id}">
                            <i data-feather="edit-2"></i>
                        </button>
                        <button class="btn-icon-only delete" data-id="${transaction.id}">
                            <i data-feather="trash-2"></i>
                        </button>
                    </div>
                </td>
            `;
            
            // Add event listeners for edit and delete buttons
            const editButton = row.querySelector('.edit');
            editButton.addEventListener('click', () => {
                this.editTransaction(transaction.id);
            });
            
            const deleteButton = row.querySelector('.delete');
            deleteButton.addEventListener('click', () => {
                this.deleteTransaction(transaction.id);
            });
            
            tableBody.appendChild(row);
        });
        
        // Initialize Feather icons for the new elements
        feather.replace();
    },
    
    /**
     * Update the transactions summary section
     * @param {Array} transactions - Array of transactions (optional, uses filtered transactions)
     */
    updateTransactionsSummary: function(transactions) {
        // If no transactions are provided, use the current filter
        if (!transactions) {
            const allTransactions = Storage.getTransactions();
            transactions = allTransactions;
            
            // Apply the current filters
            const typeFilter = document.getElementById('transaction-type-filter');
            const categoryFilter = document.getElementById('transaction-category-filter');
            const dateFilter = document.getElementById('transaction-date-filter');
            
            // Apply type filter
            if (typeFilter && typeFilter.value !== 'all') {
                transactions = transactions.filter(t => t.type === typeFilter.value);
            }
            
            // Apply category filter
            if (categoryFilter && categoryFilter.value !== 'all') {
                transactions = transactions.filter(t => t.categoryId === categoryFilter.value);
            }
            
            // Apply date filter
            if (dateFilter && dateFilter.value !== 'all') {
                const dateRange = Utils.getDateRangeForPeriod(dateFilter.value);
                
                transactions = transactions.filter(t => {
                    const transactionDate = new Date(t.date);
                    return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
                });
            }
        }
        
        // Calculate income and expenses
        let income = 0;
        let expenses = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                income += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                expenses += parseFloat(transaction.amount);
            }
        });
        
        const net = income - expenses;
        
        // Update summary elements
        const incomeElement = document.getElementById('transactions-income');
        const expensesElement = document.getElementById('transactions-expenses');
        const netElement = document.getElementById('transactions-net');
        
        if (incomeElement) incomeElement.textContent = Utils.formatCurrency(income);
        if (expensesElement) expensesElement.textContent = Utils.formatCurrency(expenses);
        if (netElement) {
            netElement.textContent = Utils.formatCurrency(net);
            netElement.classList.remove('positive', 'negative');
            netElement.classList.add(net >= 0 ? 'positive' : 'negative');
        }
    },
    
    /**
     * Show the add transaction modal
     */
    showAddTransactionModal: function() {
        // Reset form
        const form = document.getElementById('transaction-form');
        if (form) form.reset();
        
        // Clear hidden ID field
        const idField = document.getElementById('transaction-id');
        if (idField) idField.value = '';
        
        // Set default date to today
        const dateField = document.getElementById('transaction-date');
        if (dateField) dateField.value = Utils.getCurrentDateISO();
        
        // Update modal title
        const modalTitle = document.getElementById('transaction-modal-title');
        if (modalTitle) modalTitle.textContent = 'Add Transaction';
        
        // Reset category dropdown
        this.updateCategoryOptions();
        
        // Show the modal
        Utils.showModal('add-transaction-modal');
    },
    
    /**
     * Edit a transaction
     * @param {string} id - Transaction ID
     */
    editTransaction: function(id) {
        const transactions = Storage.getTransactions();
        const transaction = transactions.find(t => t.id === id);
        
        if (!transaction) {
            Utils.showNotification('Transaction not found', 'error');
            return;
        }
        
        // Set form values
        const form = document.getElementById('transaction-form');
        const idField = document.getElementById('transaction-id');
        const typeField = document.getElementById('transaction-type');
        const dateField = document.getElementById('transaction-date');
        const amountField = document.getElementById('transaction-amount');
        const descriptionField = document.getElementById('transaction-description');
        const notesField = document.getElementById('transaction-notes');
        
        if (idField) idField.value = transaction.id;
        if (typeField) typeField.value = transaction.type;
        if (dateField) dateField.value = transaction.date;
        if (amountField) amountField.value = transaction.amount;
        if (descriptionField) descriptionField.value = transaction.description;
        if (notesField) notesField.value = transaction.notes || '';
        
        // Update categories based on type
        this.updateCategoryOptions(transaction.type);
        
        // Set selected category
        const categoryField = document.getElementById('transaction-category');
        if (categoryField) categoryField.value = transaction.categoryId;
        
        // Update modal title
        const modalTitle = document.getElementById('transaction-modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Transaction';
        
        // Show the modal
        Utils.showModal('add-transaction-modal');
    },
    
    /**
     * Delete a transaction
     * @param {string} id - Transaction ID
     */
    deleteTransaction: function(id) {
        Utils.showConfirmation(
            'Are you sure you want to delete this transaction? This action cannot be undone.',
            () => {
                Storage.deleteTransaction(id);
                Utils.showNotification('Transaction deleted successfully', 'success');
                this.refresh();
                
                // Refresh dashboard if it's visible
                if (document.getElementById('dashboard-page').classList.contains('active')) {
                    Dashboard.refresh();
                }
                
                // Refresh budgets if they're visible
                if (document.getElementById('budgets-page').classList.contains('active')) {
                    Budgets.refresh();
                }
                
                // Refresh reports if they're visible
                if (document.getElementById('reports-page').classList.contains('active')) {
                    Reports.refresh();
                }
            },
            'Delete Transaction'
        );
    },
    
    /**
     * Save a transaction (new or edited)
     */
    saveTransaction: function() {
        const idField = document.getElementById('transaction-id');
        const typeField = document.getElementById('transaction-type');
        const dateField = document.getElementById('transaction-date');
        const amountField = document.getElementById('transaction-amount');
        const categoryField = document.getElementById('transaction-category');
        const descriptionField = document.getElementById('transaction-description');
        const notesField = document.getElementById('transaction-notes');
        
        // Validate fields
        if (!typeField.value || !dateField.value || !amountField.value || 
            !categoryField.value || !descriptionField.value) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const isEditing = idField.value !== '';
        
        // Create transaction object
        const transaction = {
            id: isEditing ? idField.value : Utils.generateId(),
            type: typeField.value,
            date: dateField.value,
            amount: parseFloat(amountField.value),
            categoryId: categoryField.value,
            description: descriptionField.value,
            notes: notesField.value,
            createdAt: isEditing ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save the transaction
        Storage.saveTransaction(transaction);
        
        // Show success message
        Utils.showNotification(
            isEditing ? 'Transaction updated successfully' : 'Transaction added successfully',
            'success'
        );
        
        // Hide the modal
        Utils.hideModal('add-transaction-modal');
        
        // Refresh the transactions list
        this.refresh();
        
        // Refresh dashboard if it's visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
        
        // Refresh budgets if they're visible
        if (document.getElementById('budgets-page').classList.contains('active')) {
            Budgets.refresh();
        }
        
        // Refresh reports if they're visible
        if (document.getElementById('reports-page').classList.contains('active')) {
            Reports.refresh();
        }
    }
};
