/**
 * Bills module
 * Handles all bill-related functionality
 */

const Bills = {
    /**
     * Initialize the Bills module
     */
    initialize: function() {
        this.setupEventListeners();
        this.refresh();
    },
    
    /**
     * Set up bill-specific event listeners
     */
    setupEventListeners: function() {
        // Add bill button
        const addBillBtn = document.getElementById('add-bill-btn');
        if (addBillBtn) {
            addBillBtn.addEventListener('click', () => {
                this.showAddBillModal();
            });
        }
        
        // Create first bill button on bills page
        const createFirstBillBtn = document.getElementById('create-first-bill-page');
        if (createFirstBillBtn) {
            createFirstBillBtn.addEventListener('click', () => {
                this.showAddBillModal();
            });
        }
        
        // Bill form submission
        const billForm = document.getElementById('bill-form');
        if (billForm) {
            billForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveBill();
            });
        }
        
        // Bills time filter
        const billsTimeFilter = document.getElementById('bills-time-filter');
        if (billsTimeFilter) {
            billsTimeFilter.addEventListener('change', () => {
                this.refresh();
            });
        }
        
        // Calendar navigation
        const prevMonthBtn = document.getElementById('prev-month');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.navigateCalendar(-1);
            });
        }
        
        const nextMonthBtn = document.getElementById('next-month');
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.navigateCalendar(1);
            });
        }
    },
    
    /**
     * Current calendar month and year
     */
    currentCalendarDate: new Date(),
    
    /**
     * Navigate the calendar
     * @param {number} monthDelta - Number of months to move (+1 for next, -1 for previous)
     */
    navigateCalendar: function(monthDelta) {
        this.currentCalendarDate = new Date(
            this.currentCalendarDate.getFullYear(),
            this.currentCalendarDate.getMonth() + monthDelta,
            1
        );
        
        this.updateCalendar();
    },
    
    /**
     * Refresh the bills view
     */
    refresh: function() {
        this.loadCategories();
        this.updateBillsSummary();
        this.updateBillsList();
        this.updateCalendar();
    },
    
    /**
     * Load expense categories for bill dropdown
     */
    loadCategories: function() {
        const categories = Storage.getCategories();
        const expenseCategories = categories.filter(c => c.type === 'expense');
        
        const billCategorySelect = document.getElementById('bill-category');
        if (!billCategorySelect) return;
        
        // Save selected value
        const selectedValue = billCategorySelect.value;
        
        // Clear existing options except the first one
        while (billCategorySelect.options.length > 1) {
            billCategorySelect.remove(1);
        }
        
        // Add category options
        expenseCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            billCategorySelect.appendChild(option);
        });
        
        // Restore selected value if it exists
        if (selectedValue && billCategorySelect.querySelector(`option[value="${selectedValue}"]`)) {
            billCategorySelect.value = selectedValue;
        }
    },
    
    /**
     * Update the bills summary section
     */
    updateBillsSummary: function() {
        const bills = Storage.getBills();
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Due soon (within 3 days)
        const dueSoonBills = bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            const daysLeft = Utils.getDaysLeft(dueDate);
            return !bill.paid && daysLeft >= 0 && daysLeft <= 3;
        });
        
        // Due this month
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const thisMonthBills = bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return !bill.paid && dueDate >= firstDayOfMonth && dueDate <= lastDayOfMonth;
        });
        
        // Overdue bills
        const overdueBills = bills.filter(bill => {
            const dueDate = new Date(bill.dueDate);
            return !bill.paid && dueDate < today;
        });
        
        // Calculate totals
        const dueSoonTotal = dueSoonBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const thisMonthTotal = thisMonthBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        const overdueTotal = overdueBills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
        
        // Update UI
        document.getElementById('due-soon-bills-count').textContent = dueSoonBills.length;
        document.getElementById('due-soon-bills-amount').textContent = Utils.formatCurrency(dueSoonTotal);
        
        document.getElementById('this-month-bills-count').textContent = thisMonthBills.length;
        document.getElementById('this-month-bills-amount').textContent = Utils.formatCurrency(thisMonthTotal);
        
        document.getElementById('overdue-bills-count').textContent = overdueBills.length;
        document.getElementById('overdue-bills-amount').textContent = Utils.formatCurrency(overdueTotal);
    },
    
    /**
     * Update the bills list
     */
    updateBillsList: function() {
        const bills = Storage.getBills();
        const categories = Storage.getCategories();
        
        const billsList = document.getElementById('bills-list');
        const billsEmptyState = document.getElementById('bills-page-empty-state');
        
        if (!billsList) return;
        
        // Clear the container
        billsList.innerHTML = '';
        
        if (bills.length === 0) {
            // Show empty state
            if (billsEmptyState) billsEmptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        if (billsEmptyState) billsEmptyState.style.display = 'none';
        
        // Get filter value
        const timeFilter = document.getElementById('bills-time-filter');
        const filterValue = timeFilter ? timeFilter.value : 'upcoming';
        
        // Filter bills based on selection
        let filteredBills = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const firstDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lastDayOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        
        switch (filterValue) {
            case 'upcoming':
                // Bills due in the next 30 days
                filteredBills = bills.filter(bill => {
                    const dueDate = new Date(bill.dueDate);
                    const daysLeft = Utils.getDaysLeft(dueDate);
                    return !bill.paid && daysLeft >= -7 && daysLeft <= 30; // Include up to 7 days overdue
                });
                break;
            case 'this-month':
                // Bills due this month
                filteredBills = bills.filter(bill => {
                    const dueDate = new Date(bill.dueDate);
                    return dueDate >= firstDayOfMonth && dueDate <= lastDayOfMonth;
                });
                break;
            case 'next-month':
                // Bills due next month
                filteredBills = bills.filter(bill => {
                    const dueDate = new Date(bill.dueDate);
                    return dueDate >= firstDayOfNextMonth && dueDate <= lastDayOfNextMonth;
                });
                break;
            case 'all':
            default:
                // All bills
                filteredBills = [...bills];
                break;
        }
        
        // Sort by due date (soonest first)
        filteredBills.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        // Create bill items
        filteredBills.forEach(bill => {
            const category = categories.find(c => c.id === bill.categoryId) || { name: 'Uncategorized' };
            const dueDate = new Date(bill.dueDate);
            const status = Utils.getBillStatus(dueDate, bill.paid);
            const daysLeft = Utils.getDaysLeft(dueDate);
            
            let daysLeftText = '';
            if (bill.paid) {
                daysLeftText = 'Paid';
            } else if (daysLeft < 0) {
                daysLeftText = `${Math.abs(daysLeft)} days overdue`;
            } else if (daysLeft === 0) {
                daysLeftText = 'Due today';
            } else if (daysLeft === 1) {
                daysLeftText = 'Due tomorrow';
            } else {
                daysLeftText = `Due in ${daysLeft} days`;
            }
            
            const billItem = document.createElement('div');
            billItem.className = 'bill-item';
            
            billItem.innerHTML = `
                <div class="bill-info">
                    <div class="bill-name">${bill.name}</div>
                    <div class="bill-date">${Utils.formatDate(bill.dueDate)} (${daysLeftText})</div>
                    <div class="bill-category">${category.name}</div>
                </div>
                <div class="bill-amount">${Utils.formatCurrency(bill.amount)}</div>
                <div class="bill-status ${status}">${status.replace('-', ' ')}</div>
                <div class="bill-actions">
                    ${!bill.paid ? `
                    <button class="btn btn-small mark-paid" data-id="${bill.id}">
                        Mark as Paid
                    </button>
                    ` : ''}
                    <button class="btn-icon-only edit" data-id="${bill.id}">
                        <i data-feather="edit-2"></i>
                    </button>
                    <button class="btn-icon-only delete" data-id="${bill.id}">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const markPaidBtn = billItem.querySelector('.mark-paid');
            if (markPaidBtn) {
                markPaidBtn.addEventListener('click', () => {
                    this.markBillAsPaid(bill.id);
                });
            }
            
            const editButton = billItem.querySelector('.edit');
            editButton.addEventListener('click', () => {
                this.editBill(bill.id);
            });
            
            const deleteButton = billItem.querySelector('.delete');
            deleteButton.addEventListener('click', () => {
                this.deleteBill(bill.id);
            });
            
            billsList.appendChild(billItem);
        });
        
        // Initialize Feather icons
        feather.replace();
    },
    
    /**
     * Update the calendar view
     */
    updateCalendar: function() {
        const calendarContainer = document.getElementById('bills-calendar');
        const calendarMonth = document.getElementById('calendar-month');
        
        if (!calendarContainer || !calendarMonth) return;
        
        const bills = Storage.getBills();
        
        // Get current month and year from the stored date
        const currentMonth = this.currentCalendarDate.getMonth();
        const currentYear = this.currentCalendarDate.getFullYear();
        
        // Update calendar month header
        calendarMonth.textContent = `${Utils.getMonthName(currentMonth)} ${currentYear}`;
        
        // Clear the calendar
        calendarContainer.innerHTML = '';
        
        // Create day headers (Sun-Sat)
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
            const dayHeader = document.createElement('div');
            dayHeader.className = 'calendar-day-header';
            dayHeader.textContent = day;
            calendarContainer.appendChild(dayHeader);
        });
        
        // Get first day of month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Get days in month
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        // Get days in previous month
        const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
        
        // Create days from previous month
        for (let i = 0; i < startingDayOfWeek; i++) {
            const dayNum = daysInPrevMonth - startingDayOfWeek + i + 1;
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.innerHTML = `<span>${dayNum}</span>`;
            calendarContainer.appendChild(dayElement);
        }
        
        // Create days for current month
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(currentYear, currentMonth, i);
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            // Check if this day is today
            if (date.getTime() === today.getTime()) {
                dayElement.classList.add('today');
            }
            
            // Check if this day has bills
            const dayBills = bills.filter(bill => {
                const billDate = new Date(bill.dueDate);
                return billDate.getDate() === i && 
                       billDate.getMonth() === currentMonth && 
                       billDate.getFullYear() === currentYear;
            });
            
            // Mark days with bills
            if (dayBills.length > 0) {
                dayElement.classList.add('has-bills');
                
                // Create bill indicators
                let billsHTML = '';
                dayBills.forEach(bill => {
                    const status = Utils.getBillStatus(new Date(bill.dueDate), bill.paid);
                    billsHTML += `
                        <div class="calendar-bill ${status}" title="${bill.name}: ${Utils.formatCurrency(bill.amount)}">
                            ${bill.name.substring(0, 10)}${bill.name.length > 10 ? '...' : ''}
                        </div>
                    `;
                });
                
                dayElement.innerHTML = `
                    <span>${i}</span>
                    <div class="calendar-bills">
                        ${billsHTML}
                    </div>
                `;
            } else {
                dayElement.innerHTML = `<span>${i}</span>`;
            }
            
            calendarContainer.appendChild(dayElement);
        }
        
        // Fill in remaining days from next month
        const totalDaysDisplayed = startingDayOfWeek + daysInMonth;
        const remainingDays = 42 - totalDaysDisplayed; // 6 rows of 7 days = 42
        
        for (let i = 1; i <= remainingDays; i++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day other-month';
            dayElement.innerHTML = `<span>${i}</span>`;
            calendarContainer.appendChild(dayElement);
        }
    },
    
    /**
     * Show the add bill modal
     */
    showAddBillModal: function() {
        // Reset form
        const form = document.getElementById('bill-form');
        if (form) form.reset();
        
        // Clear hidden ID field
        const idField = document.getElementById('bill-id');
        if (idField) idField.value = '';
        
        // Set default due date to 7 days from now
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        
        const dueDateField = document.getElementById('bill-due-date');
        if (dueDateField) dueDateField.value = dueDate.toISOString().split('T')[0];
        
        // Update modal title
        const modalTitle = document.getElementById('bill-modal-title');
        if (modalTitle) modalTitle.textContent = 'Add Bill';
        
        // Load categories
        this.loadCategories();
        
        // Show the modal
        Utils.showModal('add-bill-modal');
    },
    
    /**
     * Edit a bill
     * @param {string} id - Bill ID
     */
    editBill: function(id) {
        const bills = Storage.getBills();
        const bill = bills.find(b => b.id === id);
        
        if (!bill) {
            Utils.showNotification('Bill not found', 'error');
            return;
        }
        
        // Set form values
        const form = document.getElementById('bill-form');
        const idField = document.getElementById('bill-id');
        const nameField = document.getElementById('bill-name');
        const amountField = document.getElementById('bill-amount');
        const dueDateField = document.getElementById('bill-due-date');
        const categoryField = document.getElementById('bill-category');
        const repeatField = document.getElementById('bill-repeat');
        const reminderField = document.getElementById('bill-reminder');
        
        if (idField) idField.value = bill.id;
        if (nameField) nameField.value = bill.name;
        if (amountField) amountField.value = bill.amount;
        if (dueDateField) dueDateField.value = bill.dueDate;
        if (repeatField) repeatField.value = bill.repeat || 'never';
        if (reminderField) reminderField.value = bill.reminder || 'none';
        
        // Load categories first
        this.loadCategories();
        
        // Set category
        if (categoryField) categoryField.value = bill.categoryId;
        
        // Update modal title
        const modalTitle = document.getElementById('bill-modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Bill';
        
        // Show the modal
        Utils.showModal('add-bill-modal');
    },
    
    /**
     * Mark a bill as paid
     * @param {string} id - Bill ID
     */
    markBillAsPaid: function(id) {
        const bills = Storage.getBills();
        const bill = bills.find(b => b.id === id);
        
        if (!bill) {
            Utils.showNotification('Bill not found', 'error');
            return;
        }
        
        // Ask if the user wants to add a transaction for this bill
        Utils.showConfirmation(
            `Would you like to record a transaction for this bill payment (${Utils.formatCurrency(bill.amount)} for ${bill.name})?`,
            () => {
                // Set up transaction data
                const transaction = {
                    id: Utils.generateId(),
                    type: 'expense',
                    amount: bill.amount,
                    categoryId: bill.categoryId,
                    description: `Bill Payment: ${bill.name}`,
                    date: new Date().toISOString().split('T')[0],
                    notes: `Automatic transaction for bill "${bill.name}"`,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                
                // Save transaction
                Storage.saveTransaction(transaction);
                
                // Mark bill as paid
                this.completeBillPayment(bill);
                
                Utils.showNotification('Bill marked as paid and transaction recorded', 'success');
            },
            'Record Transaction',
            () => {
                // Just mark as paid without creating a transaction
                this.completeBillPayment(bill);
                Utils.showNotification('Bill marked as paid', 'success');
            }
        );
    },
    
    /**
     * Complete bill payment process
     * @param {Object} bill - Bill object
     */
    completeBillPayment: function(bill) {
        // Mark the bill as paid
        bill.paid = true;
        bill.paidDate = new Date().toISOString();
        bill.updatedAt = new Date().toISOString();
        
        // If bill is recurring, create the next bill
        if (bill.repeat && bill.repeat !== 'never') {
            const nextBill = { ...bill };
            
            // Generate new ID for next bill
            nextBill.id = Utils.generateId();
            
            // Calculate next due date
            const currentDueDate = new Date(bill.dueDate);
            let nextDueDate;
            
            switch (bill.repeat) {
                case 'monthly':
                    nextDueDate = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() + 1, currentDueDate.getDate());
                    break;
                case 'quarterly':
                    nextDueDate = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() + 3, currentDueDate.getDate());
                    break;
                case 'annually':
                    nextDueDate = new Date(currentDueDate.getFullYear() + 1, currentDueDate.getMonth(), currentDueDate.getDate());
                    break;
                default:
                    nextDueDate = new Date(currentDueDate.getFullYear(), currentDueDate.getMonth() + 1, currentDueDate.getDate());
            }
            
            // Set the new due date
            nextBill.dueDate = nextDueDate.toISOString().split('T')[0];
            
            // Reset paid status
            nextBill.paid = false;
            nextBill.paidDate = null;
            
            // Save the next bill
            Storage.saveBill(nextBill);
        }
        
        // Save the updated bill
        Storage.saveBill(bill);
        
        // Refresh the view
        this.refresh();
        
        // Refresh dashboard if it's visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
    },
    
    /**
     * Delete a bill
     * @param {string} id - Bill ID
     */
    deleteBill: function(id) {
        Utils.showConfirmation(
            'Are you sure you want to delete this bill? This action cannot be undone.',
            () => {
                Storage.deleteBill(id);
                Utils.showNotification('Bill deleted successfully', 'success');
                this.refresh();
                
                // Refresh dashboard if it's visible
                if (document.getElementById('dashboard-page').classList.contains('active')) {
                    Dashboard.refresh();
                }
            },
            'Delete Bill'
        );
    },
    
    /**
     * Save a bill (new or edited)
     */
    saveBill: function() {
        const idField = document.getElementById('bill-id');
        const nameField = document.getElementById('bill-name');
        const amountField = document.getElementById('bill-amount');
        const dueDateField = document.getElementById('bill-due-date');
        const categoryField = document.getElementById('bill-category');
        const repeatField = document.getElementById('bill-repeat');
        const reminderField = document.getElementById('bill-reminder');
        
        // Validate fields
        if (!nameField.value || !amountField.value || !dueDateField.value || !categoryField.value) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const amount = parseFloat(amountField.value);
        if (isNaN(amount) || amount <= 0) {
            Utils.showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        const isEditing = idField.value !== '';
        
        // Create bill object
        const bill = {
            id: isEditing ? idField.value : Utils.generateId(),
            name: nameField.value,
            amount: amount,
            dueDate: dueDateField.value,
            categoryId: categoryField.value,
            repeat: repeatField.value,
            reminder: reminderField.value,
            paid: false,
            createdAt: isEditing ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // If editing, preserve paid status
        if (isEditing) {
            const bills = Storage.getBills();
            const existingBill = bills.find(b => b.id === bill.id);
            if (existingBill) {
                bill.paid = existingBill.paid;
                bill.paidDate = existingBill.paidDate;
            }
        }
        
        // Save the bill
        Storage.saveBill(bill);
        
        // Show success message
        Utils.showNotification(
            isEditing ? 'Bill updated successfully' : 'Bill added successfully',
            'success'
        );
        
        // Hide the modal
        Utils.hideModal('add-bill-modal');
        
        // Refresh the bills
        this.refresh();
        
        // Refresh dashboard if it's visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
    }
};
