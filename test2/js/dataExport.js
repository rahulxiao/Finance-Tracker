/**
 * DataExport module
 * Handles importing and exporting financial data
 */

const DataExport = {
    /**
     * Initialize the DataExport module
     */
    initialize: function() {
        this.setupEventListeners();
    },
    
    /**
     * Set up data export-specific event listeners
     */
    setupEventListeners: function() {
        // Set up any additional event listeners needed
    },
    
    /**
     * Export data as JSON
     */
    exportJSON: function() {
        // Get all data
        const data = Storage.exportData();
        
        // Format the date for the filename
        const date = new Date();
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        
        // Create filename
        const filename = `financeflow_export_${dateString}.json`;
        
        // Download the file
        Utils.downloadFile(data, filename, 'json');
        
        // Show success notification
        Utils.showNotification('Data exported successfully', 'success');
    },
    
    /**
     * Export data as CSV
     */
    exportCSV: function() {
        // Get all data
        const data = Storage.exportData();
        
        // Format the date for the filename
        const date = new Date();
        const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
        
        // Create a zip folder of CSV files
        this.generateCSVFiles(data, dateString);
    },
    
    /**
     * Generate CSV files for different data types
     * @param {Object} data - Data to export
     * @param {string} dateString - Date string for filenames
     */
    generateCSVFiles: function(data, dateString) {
        // Generate transactions CSV
        const transactionsCSV = this.generateTransactionsCSV(data.transactions, data.categories);
        const transactionsFilename = `financeflow_transactions_${dateString}.csv`;
        
        // Download transactions CSV
        Utils.downloadFile(transactionsCSV, transactionsFilename, 'csv');
        
        // Show success notification
        Utils.showNotification('Transactions exported as CSV', 'success');
        
        // Note: In a full implementation, we would generate CSVs for all data types
        // and bundle them in a zip file. For simplicity, we're just exporting transactions.
    },
    
    /**
     * Generate CSV for transactions
     * @param {Array} transactions - Transactions data
     * @param {Array} categories - Categories data
     * @returns {string} CSV content
     */
    generateTransactionsCSV: function(transactions, categories) {
        if (!transactions || transactions.length === 0) {
            return 'No transactions to export';
        }
        
        // Create CSV header
        const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Notes'];
        let csv = headers.join(',') + '\n';
        
        // Add transaction rows
        transactions.forEach(transaction => {
            const category = categories.find(c => c.id === transaction.categoryId) || { name: 'Unknown' };
            
            // Format the fields
            const date = transaction.date;
            const type = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);
            const categoryName = this.escapeCSVField(category.name);
            const description = this.escapeCSVField(transaction.description);
            const amount = transaction.amount.toString();
            const notes = transaction.notes ? this.escapeCSVField(transaction.notes) : '';
            
            // Add row to CSV
            csv += `${date},${type},${categoryName},${description},${amount},${notes}\n`;
        });
        
        return csv;
    },
    
    /**
     * Escape a field for CSV export
     * @param {string} field - Field to escape
     * @returns {string} Escaped field
     */
    escapeCSVField: function(field) {
        // If the field contains commas, quotes, or newlines, wrap it in quotes
        if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            // Replace double quotes with two double quotes
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    },
    
    /**
     * Import data from a file
     */
    importData: function() {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        
        // Set up the file input change event
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) {
                document.body.removeChild(fileInput);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const importedData = JSON.parse(event.target.result);
                    this.validateAndImportData(importedData);
                } catch (error) {
                    Utils.showNotification('Error parsing import file. Please ensure it is a valid JSON file.', 'error');
                }
                
                // Clean up
                document.body.removeChild(fileInput);
            };
            
            reader.onerror = () => {
                Utils.showNotification('Error reading file', 'error');
                document.body.removeChild(fileInput);
            };
            
            reader.readAsText(file);
        });
        
        // Trigger the file selection dialog
        fileInput.click();
    },
    
    /**
     * Validate and import data
     * @param {Object} data - Data to import
     */
    validateAndImportData: function(data) {
        // Basic validation to ensure the data contains expected properties
        const requiredProperties = ['transactions', 'categories', 'budgets', 'bills', 'goals', 'settings'];
        const missingProperties = requiredProperties.filter(prop => !data.hasOwnProperty(prop));
        
        if (missingProperties.length > 0) {
            Utils.showNotification(`Import file is missing required data: ${missingProperties.join(', ')}`, 'error');
            return;
        }
        
        // Confirm import
        Utils.showConfirmation(
            'Importing this data will replace all your current financial data. This action cannot be undone. Are you sure you want to continue?',
            () => {
                this.performDataImport(data);
            },
            'Import Data'
        );
    },
    
    /**
     * Perform data import after confirmation
     * @param {Object} data - Data to import
     */
    performDataImport: function(data) {
        try {
            // Import the data
            Storage.importData(data);
            
            // Show success message
            Utils.showNotification('Data imported successfully', 'success');
            
            // Refresh all pages
            Settings.refresh();
            
            if (document.getElementById('dashboard-page').classList.contains('active')) {
                Dashboard.refresh();
            } else {
                // Navigate to dashboard
                const dashboardLink = document.querySelector('.sidebar-menu li[data-page="dashboard"]');
                if (dashboardLink) {
                    dashboardLink.click();
                }
            }
        } catch (error) {
            Utils.showNotification('Error importing data: ' + error.message, 'error');
        }
    }
};
