/**
 * Utility functions for the Finance Management Application
 */

const Utils = {
    /**
     * Format a number as currency
     * @param {number} amount - The amount to format
     * @param {string} currencyCode - The currency code (default: USD)
     * @returns {string} Formatted currency string
     */
    formatCurrency: function(amount, currencyCode = 'USD') {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        
        // Get settings safely, in case Settings isn't loaded yet
        let currency = 'USD';
        if (typeof Settings !== 'undefined') {
            const settings = Settings.getSettings();
            currency = settings && settings.currency ? settings.currency : 'USD';
        }
        
        currencyCode = currencyCode || currency;
        
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },
    
    /**
     * Format a date according to user preferences
     * @param {Date|string} date - The date to format
     * @returns {string} Formatted date string
     */
    formatDate: function(date) {
        if (!date) return '';
        
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) return 'Invalid date';
        
        // Get format safely, in case Settings isn't loaded yet
        let format = 'MM/DD/YYYY';
        if (typeof Settings !== 'undefined') {
            const settings = Settings.getSettings();
            format = settings && settings.dateFormat ? settings.dateFormat : 'MM/DD/YYYY';
        }
        
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        const year = dateObj.getFullYear();
        
        switch (format) {
            case 'DD/MM/YYYY':
                return `${day}/${month}/${year}`;
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'MM/DD/YYYY':
            default:
                return `${month}/${day}/${year}`;
        }
    },
    
    /**
     * Parse a date string into a Date object
     * @param {string} dateString - The date string to parse
     * @returns {Date} Date object
     */
    parseDate: function(dateString) {
        if (!dateString) return null;
        return new Date(dateString);
    },
    
    /**
     * Format a percentage
     * @param {number} value - The value to format as percentage
     * @param {number} decimals - Number of decimal places (default: 0)
     * @returns {string} Formatted percentage
     */
    formatPercentage: function(value, decimals = 0) {
        return value.toFixed(decimals) + '%';
    },
    
    /**
     * Generate a unique ID
     * @returns {string} Unique ID
     */
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    /**
     * Get current date as ISO string (YYYY-MM-DD)
     * @returns {string} Current date in YYYY-MM-DD format
     */
    getCurrentDateISO: function() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    },
    
    /**
     * Calculate the difference between two dates in days
     * @param {Date|string} date1 - First date
     * @param {Date|string} date2 - Second date
     * @returns {number} Difference in days
     */
    daysBetween: function(date1, date2) {
        const d1 = date1 instanceof Date ? date1 : new Date(date1);
        const d2 = date2 instanceof Date ? date2 : new Date(date2);
        
        // Get time difference in milliseconds
        const timeDiff = Math.abs(d2.getTime() - d1.getTime());
        
        // Convert to days
        return Math.ceil(timeDiff / (1000 * 3600 * 24));
    },
    
    /**
     * Check if a date is in the past
     * @param {Date|string} date - The date to check
     * @returns {boolean} True if the date is in the past
     */
    isDateInPast: function(date) {
        const checkDate = date instanceof Date ? date : new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return checkDate < today;
    },
    
    /**
     * Get the first day of the month for a given date
     * @param {Date|string} date - The date
     * @returns {Date} First day of the month
     */
    getFirstDayOfMonth: function(date) {
        const d = date instanceof Date ? date : new Date(date);
        return new Date(d.getFullYear(), d.getMonth(), 1);
    },
    
    /**
     * Get the last day of the month for a given date
     * @param {Date|string} date - The date
     * @returns {Date} Last day of the month
     */
    getLastDayOfMonth: function(date) {
        const d = date instanceof Date ? date : new Date(date);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0);
    },
    
    /**
     * Get the name of a month
     * @param {number} monthIndex - Month index (0-11)
     * @param {boolean} short - Whether to return short form (default: false)
     * @returns {string} Month name
     */
    getMonthName: function(monthIndex, short = false) {
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        if (short) {
            return months[monthIndex].substr(0, 3);
        }
        
        return months[monthIndex];
    },
    
    /**
     * Get month and year string for a date
     * @param {Date} date - The date
     * @returns {string} Month and year (e.g., "January 2023")
     */
    getMonthYearString: function(date) {
        const d = date instanceof Date ? date : new Date(date);
        const monthName = this.getMonthName(d.getMonth());
        return `${monthName} ${d.getFullYear()}`;
    },
    
    /**
     * Show a notification message
     * @param {string} message - The message to display
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds (default: 3000)
     */
    showNotification: function(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        let iconName;
        switch (type) {
            case 'success':
                iconName = 'check-circle';
                break;
            case 'error':
                iconName = 'alert-circle';
                break;
            case 'warning':
                iconName = 'alert-triangle';
                break;
            case 'info':
            default:
                iconName = 'info';
                break;
        }
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i data-feather="${iconName}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close">
                <i data-feather="x"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // Initialize Feather icons for the notification
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
        
        // Add click event for close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            container.removeChild(notification);
        });
        
        // Auto-remove notification after duration
        setTimeout(() => {
            if (notification.parentNode === container) {
                container.removeChild(notification);
            }
        }, duration);
    },
    
    /**
     * Show modal
     * @param {string} modalId - The ID of the modal to show
     */
    showModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
        }
    },
    
    /**
     * Hide modal
     * @param {string} modalId - The ID of the modal to hide
     */
    hideModal: function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Re-enable scrolling
        }
    },
    
    /**
     * Show confirmation modal
     * @param {string} message - The confirmation message
     * @param {Function} onConfirm - Callback function to execute on confirmation
     * @param {string} title - Modal title (default: "Confirm Action")
     */
    showConfirmation: function(message, onConfirm, title = 'Confirm Action') {
        const modal = document.getElementById('confirmation-modal');
        
        // If confirmation modal doesn't exist, create a simple confirm
        if (!modal) {
            if (confirm(`${title}\n\n${message}`)) {
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
            }
            return;
        }
        
        const titleEl = document.getElementById('confirmation-title');
        const messageEl = document.getElementById('confirmation-message');
        const confirmBtn = document.getElementById('confirm-action');
        
        if (!titleEl || !messageEl || !confirmBtn) {
            // Fallback to simple confirm if elements are missing
            if (confirm(`${title}\n\n${message}`)) {
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
            }
            return;
        }
        
        titleEl.textContent = title;
        messageEl.textContent = message;
        
        // Remove previous event listeners
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        
        // Add new event listener
        newConfirmBtn.addEventListener('click', () => {
            this.hideModal('confirmation-modal');
            if (typeof onConfirm === 'function') {
                onConfirm();
            }
        });
        
        this.showModal('confirmation-modal');
    },
    
    /**
     * Debounce function to limit how often a function can be called
     * @param {Function} func - The function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce: function(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    },
    
    /**
     * Get start and end date for a given time period
     * @param {string} period - Time period (current-month, last-month, etc.)
     * @returns {Object} Object with start and end dates
     */
    getDateRangeForPeriod: function(period) {
        const today = new Date();
        let startDate, endDate;
        
        switch (period) {
            case 'current-month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'last-month':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                break;
            case 'last-3-months':
                startDate = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                endDate = today;
                break;
            case 'last-6-months':
                startDate = new Date(today.getFullYear(), today.getMonth() - 6, 1);
                endDate = today;
                break;
            case 'year-to-date':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = today;
                break;
            case 'last-year':
                startDate = new Date(today.getFullYear() - 1, 0, 1);
                endDate = new Date(today.getFullYear() - 1, 11, 31);
                break;
            case 'all':
            default:
                startDate = new Date(1970, 0, 1);
                endDate = new Date(2100, 0, 1);
                break;
        }
        
        return { startDate, endDate };
    },

    /**
     * Get random color
     * @returns {string} Random hex color
     */
    getRandomColor: function() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    },
    
    /**
     * Calculate amount remaining in budget
     * @param {number} budgetAmount - The budget amount
     * @param {number} spentAmount - The amount spent
     * @returns {number} Amount remaining
     */
    calculateBudgetRemaining: function(budgetAmount, spentAmount) {
        return Math.max(0, budgetAmount - spentAmount);
    },
    
    /**
     * Calculate budget progress percentage
     * @param {number} budgetAmount - The budget amount
     * @param {number} spentAmount - The amount spent
     * @returns {number} Progress percentage (0-100)
     */
    calculateBudgetProgress: function(budgetAmount, spentAmount) {
        if (budgetAmount <= 0) return 0;
        return Math.min(100, Math.round((spentAmount / budgetAmount) * 100));
    },
    
    /**
     * Determine budget status based on progress
     * @param {number} progress - Progress percentage
     * @returns {string} Status (normal, warning, danger)
     */
    getBudgetStatus: function(progress) {
        if (progress >= 100) return 'danger';
        if (progress >= 75) return 'warning';
        return 'normal';
    },
    
    /**
     * Sort an array of objects by a specific property
     * @param {Array} array - The array to sort
     * @param {string} property - The property to sort by
     * @param {boolean} ascending - Sort order (default: true)
     * @returns {Array} Sorted array
     */
    sortArrayByProperty: function(array, property, ascending = true) {
        return [...array].sort((a, b) => {
            if (a[property] < b[property]) return ascending ? -1 : 1;
            if (a[property] > b[property]) return ascending ? 1 : -1;
            return 0;
        });
    },
    
    /**
     * Get days left before a due date
     * @param {Date|string} dueDate - Due date
     * @returns {number} Number of days left
     */
    getDaysLeft: function(dueDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const due = dueDate instanceof Date ? dueDate : new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        
        const diffTime = due.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    
    /**
     * Get bill status based on due date
     * @param {Date|string} dueDate - Due date
     * @param {boolean} isPaid - Whether the bill is paid
     * @returns {string} Status (paid, overdue, due-soon, upcoming)
     */
    getBillStatus: function(dueDate, isPaid) {
        if (isPaid) return 'paid';
        
        const daysLeft = this.getDaysLeft(dueDate);
        
        if (daysLeft < 0) return 'overdue';
        if (daysLeft <= 3) return 'due-soon';
        return 'upcoming';
    },
    
    /**
     * Check if dark mode is enabled
     * @returns {boolean} Whether dark mode is enabled
     */
    isDarkMode: function() {
        return document.body.classList.contains('dark-theme');
    },
    
    /**
     * Enable dark mode
     */
    enableDarkMode: function() {
        document.body.classList.add('dark-theme');
        localStorage.setItem('darkMode', 'enabled');
        
        // Update toggle switch if it exists
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.checked = true;
        }
    },
    
    /**
     * Disable dark mode
     */
    disableDarkMode: function() {
        document.body.classList.remove('dark-theme');
        localStorage.setItem('darkMode', 'disabled');
        
        // Update toggle switch if it exists
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.checked = false;
        }
    },
    
    /**
     * Toggle dark mode
     * @param {boolean} forceDark - Force dark mode state, or toggle if not provided
     */
    toggleDarkMode: function(forceDark) {
        if (typeof forceDark === 'boolean') {
            if (forceDark) {
                this.enableDarkMode();
            } else {
                this.disableDarkMode();
            }
        } else {
            if (this.isDarkMode()) {
                this.disableDarkMode();
            } else {
                this.enableDarkMode();
            }
        }
    },
    
    /**
     * Initialize dark mode based on user preference
     */
    initDarkMode: function() {
        // Check for saved dark mode preference
        const savedDarkMode = localStorage.getItem('darkMode');
        
        // Check for system preference if no saved preference
        const prefersDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedDarkMode === 'enabled' || (savedDarkMode === null && prefersDarkMode)) {
            this.enableDarkMode();
        } else {
            this.disableDarkMode();
        }
        
        // Add event listener to toggle switch if it exists
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        if (darkModeToggle) {
            darkModeToggle.checked = this.isDarkMode();
            darkModeToggle.addEventListener('change', () => {
                this.toggleDarkMode(darkModeToggle.checked);
            });
        }
        
        // Listen for system color scheme changes
        const colorSchemeMedia = window.matchMedia('(prefers-color-scheme: dark)');
        if (colorSchemeMedia.addEventListener) {
            colorSchemeMedia.addEventListener('change', (e) => {
                // Only update if user hasn't explicitly set a preference
                if (localStorage.getItem('darkMode') === null) {
                    this.toggleDarkMode(e.matches);
                }
            });
        }
    },
    
    /**
     * Calculate savings rate
     * @param {number} income - Total income
     * @param {number} expenses - Total expenses
     * @returns {number} Savings rate percentage
     */
    calculateSavingsRate: function(income, expenses) {
        if (income <= 0) return 0;
        const savings = income - expenses;
        return Math.round((savings / income) * 100);
    },
    
    /**
     * Check if a financial goal is complete
     * @param {number} currentAmount - Current amount saved
     * @param {number} targetAmount - Target amount
     * @returns {boolean} Whether the goal is complete
     */
    isGoalComplete: function(currentAmount, targetAmount) {
        return currentAmount >= targetAmount;
    },
    
    /**
     * Get month difference between two dates
     * @param {Date|string} startDate - Start date
     * @param {Date|string} endDate - End date
     * @returns {number} Number of months
     */
    getMonthsDifference: function(startDate, endDate) {
        const start = startDate instanceof Date ? startDate : new Date(startDate);
        const end = endDate instanceof Date ? endDate : new Date(endDate);
        
        return (end.getFullYear() - start.getFullYear()) * 12 + 
               (end.getMonth() - start.getMonth());
    },
    
    /**
     * Calculate monthly amount needed to reach a goal
     * @param {number} targetAmount - Target amount
     * @param {number} currentAmount - Current amount
     * @param {Date|string} targetDate - Target date
     * @returns {number} Monthly amount needed
     */
    calculateMonthlyAmountForGoal: function(targetAmount, currentAmount, targetDate) {
        const today = new Date();
        const target = targetDate instanceof Date ? targetDate : new Date(targetDate);
        
        const monthsLeft = Math.max(1, this.getMonthsDifference(today, target));
        const amountNeeded = targetAmount - currentAmount;
        
        return Math.max(0, amountNeeded / monthsLeft);
    },
    
    /**
     * Group array items by a property
     * @param {Array} array - Array to group
     * @param {string} property - Property to group by
     * @returns {Object} Grouped object
     */
    groupBy: function(array, property) {
        return array.reduce((grouped, item) => {
            const key = item[property];
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(item);
            return grouped;
        }, {});
    },
    
    /**
     * Sum values in an array
     * @param {Array} array - Array of numbers
     * @returns {number} Sum of values
     */
    sumArray: function(array) {
        return array.reduce((sum, value) => sum + value, 0);
    },
    
    /**
     * Format a number with thousands separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber: function(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    /**
     * Download data as a file
     * @param {Object|string} data - Data to download
     * @param {string} filename - File name
     * @param {string} type - File type (json, csv, etc.)
     */
    downloadFile: function(data, filename, type = 'json') {
        let content;
        let mimeType;
        
        switch (type.toLowerCase()) {
            case 'json':
                content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
                mimeType = 'application/json';
                break;
            case 'csv':
                content = data;
                mimeType = 'text/csv';
                break;
            default:
                content = data;
                mimeType = 'text/plain';
        }
        
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }
};
