/**
 * Reports module
 * Handles all financial reporting and visualization functionality
 */

const Reports = {
    /**
     * Initialize the Reports module
     */
    initialize: function() {
        this.setupEventListeners();
        this.refresh();
    },
    
    /**
     * Set up report-specific event listeners
     */
    setupEventListeners: function() {
        // Report type selection
        const reportType = document.getElementById('report-type');
        if (reportType) {
            reportType.addEventListener('change', () => {
                this.refresh();
            });
        }
        
        // Time period selection
        const timePeriod = document.getElementById('report-time-period');
        if (timePeriod) {
            timePeriod.addEventListener('change', () => {
                this.refresh();
            });
        }
    },
    
    /**
     * Currently displayed chart instance
     */
    currentChart: null,
    
    /**
     * Refresh the reports view
     */
    refresh: function() {
        const reportType = document.getElementById('report-type');
        const reportTypeValue = reportType ? reportType.value : 'income-vs-expenses';
        
        // Update report title
        this.updateReportTitle(reportTypeValue);
        
        // Generate the appropriate report
        switch (reportTypeValue) {
            case 'income-vs-expenses':
                this.generateIncomeVsExpensesReport();
                break;
            case 'spending-by-category':
                this.generateSpendingByCategoryReport();
                break;
            case 'net-worth-trend':
                this.generateNetWorthTrendReport();
                break;
            case 'savings-rate':
                this.generateSavingsRateReport();
                break;
            default:
                this.generateIncomeVsExpensesReport();
        }
    },
    
    /**
     * Update the report title
     * @param {string} reportType - The type of report
     */
    updateReportTitle: function(reportType) {
        const reportTitle = document.getElementById('report-title');
        if (!reportTitle) return;
        
        switch (reportType) {
            case 'income-vs-expenses':
                reportTitle.textContent = 'Income vs Expenses';
                break;
            case 'spending-by-category':
                reportTitle.textContent = 'Spending by Category';
                break;
            case 'net-worth-trend':
                reportTitle.textContent = 'Net Worth Trend';
                break;
            case 'savings-rate':
                reportTitle.textContent = 'Savings Rate';
                break;
            default:
                reportTitle.textContent = 'Financial Report';
        }
        
        // Update report period
        this.updateReportPeriod();
    },
    
    /**
     * Update the report period display
     */
    updateReportPeriod: function() {
        const timePeriod = document.getElementById('report-time-period');
        const periodDisplay = document.getElementById('report-period');
        
        if (!timePeriod || !periodDisplay) return;
        
        const today = new Date();
        let periodText = '';
        
        switch (timePeriod.value) {
            case 'this-month':
                periodText = Utils.getMonthName(today.getMonth()) + ' ' + today.getFullYear();
                break;
            case 'last-month':
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                periodText = Utils.getMonthName(lastMonth.getMonth()) + ' ' + lastMonth.getFullYear();
                break;
            case 'last-3-months':
                const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                periodText = Utils.getMonthName(threeMonthsAgo.getMonth()) + ' - ' + Utils.getMonthName(today.getMonth()) + ' ' + today.getFullYear();
                break;
            case 'last-6-months':
                const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
                periodText = Utils.getMonthName(sixMonthsAgo.getMonth()) + ' - ' + Utils.getMonthName(today.getMonth()) + ' ' + today.getFullYear();
                break;
            case 'this-year':
                periodText = today.getFullYear();
                break;
            case 'last-year':
                periodText = today.getFullYear() - 1;
                break;
            case 'all-time':
                periodText = 'All Time';
                break;
            default:
                periodText = 'Custom Period';
        }
        
        periodDisplay.textContent = periodText;
    },
    
    /**
     * Get transactions for the selected time period
     * @returns {Array} Filtered transactions
     */
    getTransactionsForPeriod: function() {
        const transactions = Storage.getTransactions();
        const timePeriod = document.getElementById('report-time-period');
        
        if (!timePeriod) return transactions;
        
        const dateRange = Utils.getDateRangeForPeriod(timePeriod.value);
        
        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= dateRange.startDate && transactionDate <= dateRange.endDate;
        });
    },
    
    /**
     * Generate income vs expenses report
     */
    generateIncomeVsExpensesReport: function() {
        const transactions = this.getTransactionsForPeriod();
        
        // If no transactions, show empty state
        if (transactions.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Group transactions by month
        const monthlyData = this.groupTransactionsByMonth(transactions);
        
        // Prepare data for chart
        const labels = [];
        const incomeData = [];
        const expenseData = [];
        
        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            
            if (yearA !== yearB) {
                return yearA - yearB;
            }
            return monthA - monthB;
        });
        
        // Populate chart data
        sortedMonths.forEach(month => {
            const [year, monthIndex] = month.split('-').map(Number);
            
            // Format month label (e.g., "Jan 2023")
            const monthName = Utils.getMonthName(monthIndex - 1, true);
            labels.push(`${monthName} ${year}`);
            
            // Get income and expense totals
            incomeData.push(monthlyData[month].income);
            expenseData.push(monthlyData[month].expenses);
        });
        
        // Create the chart
        this.createBarChart(labels, [
            {
                label: 'Income',
                data: incomeData,
                backgroundColor: 'rgba(46, 204, 113, 0.7)'
            },
            {
                label: 'Expenses',
                data: expenseData,
                backgroundColor: 'rgba(231, 76, 60, 0.7)'
            }
        ]);
        
        // Generate summary
        this.generateIncomeExpensesSummary(transactions);
        
        // Generate insights
        this.generateIncomeExpensesInsights(sortedMonths, monthlyData);
    },
    
    /**
     * Generate spending by category report
     */
    generateSpendingByCategoryReport: function() {
        const transactions = this.getTransactionsForPeriod();
        const categories = Storage.getCategories();
        
        // Filter out expense transactions
        const expenses = transactions.filter(t => t.type === 'expense');
        
        // If no expenses, show empty state
        if (expenses.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Group expenses by category
        const categoryTotals = {};
        const categoryColors = {};
        
        expenses.forEach(expense => {
            const categoryId = expense.categoryId;
            const category = categories.find(c => c.id === categoryId);
            
            if (!category) return;
            
            if (!categoryTotals[categoryId]) {
                categoryTotals[categoryId] = 0;
                categoryColors[categoryId] = category.color;
            }
            
            categoryTotals[categoryId] += parseFloat(expense.amount);
        });
        
        // Prepare data for chart
        const labels = [];
        const data = [];
        const backgroundColors = [];
        
        // Get total spending
        const totalSpending = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        
        // Sort categories by spending amount (highest first)
        const sortedCategories = Object.entries(categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Only show top 10 categories
        
        sortedCategories.forEach(([categoryId, amount]) => {
            const category = categories.find(c => c.id === categoryId);
            if (!category) return;
            
            labels.push(category.name);
            data.push(amount);
            backgroundColors.push(category.color);
        });
        
        // Create the pie chart
        this.createPieChart(labels, data, backgroundColors);
        
        // Generate summary
        this.generateCategorySpendingSummary(sortedCategories, categories, totalSpending);
        
        // Generate insights
        this.generateCategorySpendingInsights(sortedCategories, categories, totalSpending);
    },
    
    /**
     * Generate net worth trend report
     */
    generateNetWorthTrendReport: function() {
        const transactions = Storage.getTransactions();
        const timePeriod = document.getElementById('report-time-period');
        
        if (!timePeriod) return;
        
        // Determine date range
        const dateRange = Utils.getDateRangeForPeriod(timePeriod.value);
        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;
        
        // If no transactions, show empty state
        if (transactions.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Calculate net worth at the start of each month in the range
        const netWorthData = {};
        
        // Sort transactions by date
        const sortedTransactions = [...transactions].sort((a, b) => 
            new Date(a.date) - new Date(b.date)
        );
        
        // Get the earliest transaction date
        let currentDate = new Date(Math.max(
            startDate.getTime(),
            new Date(sortedTransactions[0].date).getTime()
        ));
        
        // Ensure we start at the beginning of a month
        currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        
        // Generate monthly data points until end date
        while (currentDate <= endDate) {
            const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
            
            // Calculate net worth as of this date
            let assets = 0;
            let liabilities = 0;
            
            sortedTransactions.forEach(transaction => {
                const transactionDate = new Date(transaction.date);
                if (transactionDate <= currentDate) {
                    if (transaction.type === 'income') {
                        assets += parseFloat(transaction.amount);
                    } else if (transaction.type === 'expense') {
                        liabilities += parseFloat(transaction.amount);
                    }
                }
            });
            
            const netWorth = assets - liabilities;
            netWorthData[monthKey] = { netWorth, assets, liabilities };
            
            // Move to next month
            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        }
        
        // Prepare data for chart
        const labels = [];
        const netWorthValues = [];
        const assetsValues = [];
        const liabilitiesValues = [];
        
        // Sort months chronologically
        const sortedMonths = Object.keys(netWorthData).sort((a, b) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            
            if (yearA !== yearB) {
                return yearA - yearB;
            }
            return monthA - monthB;
        });
        
        sortedMonths.forEach(month => {
            const [year, monthIndex] = month.split('-').map(Number);
            const monthName = Utils.getMonthName(monthIndex - 1, true);
            
            labels.push(`${monthName} ${year}`);
            netWorthValues.push(netWorthData[month].netWorth);
            assetsValues.push(netWorthData[month].assets);
            liabilitiesValues.push(netWorthData[month].liabilities);
        });
        
        // Create the line chart
        this.createLineChart(labels, [
            {
                label: 'Net Worth',
                data: netWorthValues,
                borderColor: 'rgba(46, 204, 113, 1)',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                tension: 0.1,
                fill: true
            },
            {
                label: 'Assets',
                data: assetsValues,
                borderColor: 'rgba(52, 152, 219, 1)',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.1,
                fill: true,
                hidden: true
            },
            {
                label: 'Liabilities',
                data: liabilitiesValues,
                borderColor: 'rgba(231, 76, 60, 1)',
                backgroundColor: 'rgba(231, 76, 60, 0.1)',
                tension: 0.1,
                fill: true,
                hidden: true
            }
        ]);
        
        // Generate summary
        this.generateNetWorthSummary(sortedMonths, netWorthData);
        
        // Generate insights
        this.generateNetWorthInsights(sortedMonths, netWorthData);
    },
    
    /**
     * Generate savings rate report
     */
    generateSavingsRateReport: function() {
        const transactions = this.getTransactionsForPeriod();
        
        // If no transactions, show empty state
        if (transactions.length === 0) {
            this.showEmptyState();
            return;
        }
        
        // Group transactions by month
        const monthlyData = this.groupTransactionsByMonth(transactions);
        
        // Calculate monthly savings rates
        const savingsRates = {};
        
        for (const month in monthlyData) {
            const { income, expenses } = monthlyData[month];
            const savingsRate = Utils.calculateSavingsRate(income, expenses);
            savingsRates[month] = savingsRate;
        }
        
        // Prepare data for chart
        const labels = [];
        const savingsRateData = [];
        
        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            const [yearA, monthA] = a.split('-').map(Number);
            const [yearB, monthB] = b.split('-').map(Number);
            
            if (yearA !== yearB) {
                return yearA - yearB;
            }
            return monthA - monthB;
        });
        
        sortedMonths.forEach(month => {
            const [year, monthIndex] = month.split('-').map(Number);
            const monthName = Utils.getMonthName(monthIndex - 1, true);
            
            labels.push(`${monthName} ${year}`);
            savingsRateData.push(savingsRates[month]);
        });
        
        // Create the bar chart
        this.createBarChart(labels, [
            {
                label: 'Savings Rate (%)',
                data: savingsRateData,
                backgroundColor: 'rgba(52, 152, 219, 0.7)'
            }
        ]);
        
        // Generate summary
        this.generateSavingsRateSummary(sortedMonths, monthlyData, savingsRates);
        
        // Generate insights
        this.generateSavingsRateInsights(sortedMonths, monthlyData, savingsRates);
    },
    
    /**
     * Create a bar chart
     * @param {Array} labels - Chart labels
     * @param {Array} datasets - Chart datasets
     */
    createBarChart: function(labels, datasets) {
        const ctx = document.getElementById('report-chart');
        
        // Destroy existing chart if it exists
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        
        // Create new chart
        this.currentChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
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
                                
                                if (context.dataset.label === 'Savings Rate (%)') {
                                    label += context.raw + '%';
                                } else {
                                    label += Utils.formatCurrency(context.raw);
                                }
                                
                                return label;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create a pie chart
     * @param {Array} labels - Chart labels
     * @param {Array} data - Chart data
     * @param {Array} backgroundColors - Chart background colors
     */
    createPieChart: function(labels, data, backgroundColors) {
        const ctx = document.getElementById('report-chart');
        
        // Destroy existing chart if it exists
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        
        // Create new chart
        this.currentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                
                                return `${label}: ${Utils.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Create a line chart
     * @param {Array} labels - Chart labels
     * @param {Array} datasets - Chart datasets
     */
    createLineChart: function(labels, datasets) {
        const ctx = document.getElementById('report-chart');
        
        // Destroy existing chart if it exists
        if (this.currentChart) {
            this.currentChart.destroy();
        }
        
        // Create new chart
        this.currentChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
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
     * Group transactions by month
     * @param {Array} transactions - Transactions to group
     * @returns {Object} Grouped transactions
     */
    groupTransactionsByMonth: function(transactions) {
        const monthlyData = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const year = date.getFullYear();
            const month = date.getMonth() + 1; // JavaScript months are 0-indexed
            const monthKey = `${year}-${month}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    income: 0,
                    expenses: 0
                };
            }
            
            if (transaction.type === 'income') {
                monthlyData[monthKey].income += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                monthlyData[monthKey].expenses += parseFloat(transaction.amount);
            }
        });
        
        return monthlyData;
    },
    
    /**
     * Generate income vs expenses summary
     * @param {Array} transactions - Transactions for the period
     */
    generateIncomeExpensesSummary: function(transactions) {
        const summaryContainer = document.getElementById('report-summary');
        if (!summaryContainer) return;
        
        // Calculate totals
        let totalIncome = 0;
        let totalExpenses = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                totalExpenses += parseFloat(transaction.amount);
            }
        });
        
        const netSavings = totalIncome - totalExpenses;
        const savingsRate = Utils.calculateSavingsRate(totalIncome, totalExpenses);
        
        // Create summary items
        summaryContainer.innerHTML = `
            <div class="report-summary-item">
                <div class="report-summary-value">${Utils.formatCurrency(totalIncome)}</div>
                <div class="report-summary-label">Total Income</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value">${Utils.formatCurrency(totalExpenses)}</div>
                <div class="report-summary-label">Total Expenses</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value ${netSavings >= 0 ? 'text-success' : 'text-danger'}">
                    ${Utils.formatCurrency(netSavings)}
                </div>
                <div class="report-summary-label">Net Savings</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value ${savingsRate >= 0 ? 'text-success' : 'text-danger'}">
                    ${savingsRate}%
                </div>
                <div class="report-summary-label">Savings Rate</div>
            </div>
        `;
    },
    
    /**
     * Generate category spending summary
     * @param {Array} sortedCategories - Categories sorted by spending
     * @param {Array} categories - All categories
     * @param {number} totalSpending - Total spending amount
     */
    generateCategorySpendingSummary: function(sortedCategories, categories, totalSpending) {
        const summaryContainer = document.getElementById('report-summary');
        if (!summaryContainer) return;
        
        // Get top spending category
        const [topCategoryId, topAmount] = sortedCategories[0] || [null, 0];
        const topCategory = categories.find(c => c.id === topCategoryId) || { name: 'None' };
        
        // Calculate average monthly spending
        const timePeriod = document.getElementById('report-time-period');
        let monthCount = 1;
        
        if (timePeriod) {
            switch(timePeriod.value) {
                case 'last-3-months':
                    monthCount = 3;
                    break;
                case 'last-6-months':
                    monthCount = 6;
                    break;
                case 'this-year':
                    monthCount = new Date().getMonth() + 1;
                    break;
                case 'last-year':
                    monthCount = 12;
                    break;
                default:
                    monthCount = 1;
            }
        }
        
        const averageMonthlySpending = totalSpending / monthCount;
        
        // Create summary items
        summaryContainer.innerHTML = `
            <div class="report-summary-item">
                <div class="report-summary-value">${Utils.formatCurrency(totalSpending)}</div>
                <div class="report-summary-label">Total Spending</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value">${Utils.formatCurrency(averageMonthlySpending)}</div>
                <div class="report-summary-label">Average Monthly</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value">${topCategory.name}</div>
                <div class="report-summary-label">Top Category</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value">${Utils.formatCurrency(topAmount || 0)}</div>
                <div class="report-summary-label">${topCategory.name} Spending</div>
            </div>
        `;
    },
    
    /**
     * Generate net worth summary
     * @param {Array} sortedMonths - Months sorted chronologically
     * @param {Object} netWorthData - Net worth data by month
     */
    generateNetWorthSummary: function(sortedMonths, netWorthData) {
        const summaryContainer = document.getElementById('report-summary');
        if (!summaryContainer || sortedMonths.length === 0) return;
        
        // Get current and initial net worth
        const currentMonthKey = sortedMonths[sortedMonths.length - 1];
        const initialMonthKey = sortedMonths[0];
        
        const currentNetWorth = netWorthData[currentMonthKey].netWorth;
        const initialNetWorth = netWorthData[initialMonthKey].netWorth;
        
        // Calculate change
        const netWorthChange = currentNetWorth - initialNetWorth;
        const percentChange = initialNetWorth !== 0 ? 
            ((netWorthChange / Math.abs(initialNetWorth)) * 100).toFixed(1) : 0;
        
        // Calculate average monthly change
        const monthCount = sortedMonths.length - 1;
        const averageMonthlyChange = monthCount > 0 ? netWorthChange / monthCount : 0;
        
        // Create summary items
        summaryContainer.innerHTML = `
            <div class="report-summary-item">
                <div class="report-summary-value">${Utils.formatCurrency(currentNetWorth)}</div>
                <div class="report-summary-label">Current Net Worth</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value ${netWorthChange >= 0 ? 'text-success' : 'text-danger'}">
                    ${netWorthChange >= 0 ? '+' : ''}${Utils.formatCurrency(netWorthChange)}
                </div>
                <div class="report-summary-label">Total Change</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value ${percentChange >= 0 ? 'text-success' : 'text-danger'}">
                    ${percentChange >= 0 ? '+' : ''}${percentChange}%
                </div>
                <div class="report-summary-label">Percent Change</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value ${averageMonthlyChange >= 0 ? 'text-success' : 'text-danger'}">
                    ${averageMonthlyChange >= 0 ? '+' : ''}${Utils.formatCurrency(averageMonthlyChange)}
                </div>
                <div class="report-summary-label">Avg. Monthly Change</div>
            </div>
        `;
    },
    
    /**
     * Generate savings rate summary
     * @param {Array} sortedMonths - Months sorted chronologically
     * @param {Object} monthlyData - Monthly transaction data
     * @param {Object} savingsRates - Savings rates by month
     */
    generateSavingsRateSummary: function(sortedMonths, monthlyData, savingsRates) {
        const summaryContainer = document.getElementById('report-summary');
        if (!summaryContainer || sortedMonths.length === 0) return;
        
        // Calculate average savings rate
        let totalSavingsRate = 0;
        sortedMonths.forEach(month => {
            totalSavingsRate += savingsRates[month];
        });
        
        const averageSavingsRate = Math.round(totalSavingsRate / sortedMonths.length);
        
        // Find highest and lowest savings rates
        let highestRate = -Infinity;
        let lowestRate = Infinity;
        let highestMonth = '';
        let lowestMonth = '';
        
        sortedMonths.forEach(month => {
            const rate = savingsRates[month];
            
            if (rate > highestRate) {
                highestRate = rate;
                highestMonth = month;
            }
            
            if (rate < lowestRate) {
                lowestRate = rate;
                lowestMonth = month;
            }
        });
        
        // Format month names
        const formatMonth = (monthKey) => {
            if (!monthKey) return 'N/A';
            const [year, monthIndex] = monthKey.split('-').map(Number);
            return `${Utils.getMonthName(monthIndex - 1, false)} ${year}`;
        };
        
        // Create summary items
        summaryContainer.innerHTML = `
            <div class="report-summary-item">
                <div class="report-summary-value ${averageSavingsRate >= 0 ? 'text-success' : 'text-danger'}">
                    ${averageSavingsRate}%
                </div>
                <div class="report-summary-label">Average Savings Rate</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value text-success">${highestRate}%</div>
                <div class="report-summary-label">Highest Rate</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value">${formatMonth(highestMonth)}</div>
                <div class="report-summary-label">Best Month</div>
            </div>
            <div class="report-summary-item">
                <div class="report-summary-value ${lowestRate >= 0 ? 'text-success' : 'text-danger'}">
                    ${lowestRate}%
                </div>
                <div class="report-summary-label">Lowest Rate</div>
            </div>
        `;
    },
    
    /**
     * Generate income vs expenses insights
     * @param {Array} sortedMonths - Months sorted chronologically
     * @param {Object} monthlyData - Monthly income and expense data
     */
    generateIncomeExpensesInsights: function(sortedMonths, monthlyData) {
        const insightsContainer = document.getElementById('report-insights-list');
        if (!insightsContainer || sortedMonths.length === 0) return;
        
        // Clear existing insights
        insightsContainer.innerHTML = '';
        
        // Calculate trends
        const incomeData = sortedMonths.map(month => monthlyData[month].income);
        const expenseData = sortedMonths.map(month => monthlyData[month].expenses);
        
        // Check if income is trending up or down
        const incomeTrend = this.calculateTrend(incomeData);
        
        // Check if expenses are trending up or down
        const expenseTrend = this.calculateTrend(expenseData);
        
        // Check if there are any months with negative savings
        const monthsWithNegativeSavings = sortedMonths.filter(month => 
            monthlyData[month].income < monthlyData[month].expenses
        );
        
        // Find months with highest and lowest savings
        let highestSavingsMonth = '';
        let highestSavings = -Infinity;
        let lowestSavingsMonth = '';
        let lowestSavings = Infinity;
        
        sortedMonths.forEach(month => {
            const savings = monthlyData[month].income - monthlyData[month].expenses;
            
            if (savings > highestSavings) {
                highestSavings = savings;
                highestSavingsMonth = month;
            }
            
            if (savings < lowestSavings) {
                lowestSavings = savings;
                lowestSavingsMonth = month;
            }
        });
        
        // Format month names
        const formatMonth = (monthKey) => {
            const [year, monthIndex] = monthKey.split('-').map(Number);
            return `${Utils.getMonthName(monthIndex - 1, false)} ${year}`;
        };
        
        // Generate insights
        if (monthsWithNegativeSavings.length > 0) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item negative';
            insightItem.innerHTML = `
                <p>You spent more than you earned in ${monthsWithNegativeSavings.length} month(s).
                ${monthsWithNegativeSavings.length === 1 ? 
                    `The month with negative savings was ${formatMonth(monthsWithNegativeSavings[0])}.` :
                    `The most recent month with negative savings was ${formatMonth(monthsWithNegativeSavings[monthsWithNegativeSavings.length - 1])}.`
                }</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        if (incomeTrend !== 0) {
            const insightItem = document.createElement('div');
            insightItem.className = `insight-item ${incomeTrend > 0 ? 'positive' : 'negative'}`;
            insightItem.innerHTML = `
                <p>Your income is ${incomeTrend > 0 ? 'increasing' : 'decreasing'} over time. 
                ${incomeTrend > 0 ? 
                    'Keep up the good work in growing your income!' : 
                    'You may want to focus on increasing your income sources.'
                }</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        if (expenseTrend !== 0) {
            const insightItem = document.createElement('div');
            insightItem.className = `insight-item ${expenseTrend < 0 ? 'positive' : 'negative'}`;
            insightItem.innerHTML = `
                <p>Your expenses are ${expenseTrend > 0 ? 'increasing' : 'decreasing'} over time.
                ${expenseTrend < 0 ? 
                    'Great job on reducing your expenses!' : 
                    'Consider reviewing your budget to identify areas where you can cut back.'
                }</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        if (highestSavingsMonth) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item positive';
            insightItem.innerHTML = `
                <p>Your best saving month was ${formatMonth(highestSavingsMonth)} with ${Utils.formatCurrency(highestSavings)} saved.
                Review what went well during this month to replicate your success.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        if (lowestSavingsMonth && lowestSavings < 0) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item negative';
            insightItem.innerHTML = `
                <p>Your most challenging month was ${formatMonth(lowestSavingsMonth)} with a deficit of ${Utils.formatCurrency(Math.abs(lowestSavings))}.
                Consider building an emergency fund to help cover future shortfalls.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // If no insights were generated, add a generic one
        if (insightsContainer.children.length === 0) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item neutral';
            insightItem.innerHTML = `
                <p>Continue tracking your income and expenses to generate personalized insights over time.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
    },
    
    /**
     * Generate category spending insights
     * @param {Array} sortedCategories - Categories sorted by spending
     * @param {Array} categories - All categories
     * @param {number} totalSpending - Total spending amount
     */
    generateCategorySpendingInsights: function(sortedCategories, categories, totalSpending) {
        const insightsContainer = document.getElementById('report-insights-list');
        if (!insightsContainer || sortedCategories.length === 0) return;
        
        // Clear existing insights
        insightsContainer.innerHTML = '';
        
        // Get top 3 spending categories
        const top3Categories = sortedCategories.slice(0, 3);
        
        // Calculate percentage of total spending for top categories
        const top3Total = top3Categories.reduce((sum, [_, amount]) => sum + amount, 0);
        const top3Percentage = Math.round((top3Total / totalSpending) * 100);
        
        // Generate insights
        if (top3Categories.length > 0) {
            const topCategoryNames = top3Categories.map(([categoryId, _]) => {
                const category = categories.find(c => c.id === categoryId);
                return category ? category.name : 'Unknown';
            });
            
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item neutral';
            insightItem.innerHTML = `
                <p>Your top ${top3Categories.length} spending categories (${topCategoryNames.join(', ')}) 
                account for ${top3Percentage}% of your total expenses.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // Check if spending is concentrated in one category
        if (top3Categories.length > 0 && top3Categories[0][1] > totalSpending * 0.5) {
            const [topCategoryId, topAmount] = top3Categories[0];
            const topCategory = categories.find(c => c.id === topCategoryId);
            const topPercentage = Math.round((topAmount / totalSpending) * 100);
            
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item negative';
            insightItem.innerHTML = `
                <p>Over half (${topPercentage}%) of your spending is in the ${topCategory ? topCategory.name : 'Unknown'} category.
                Consider reviewing this area to identify potential savings.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // Check if there are categories with very low spending
        const lowSpendingCategories = sortedCategories
            .filter(([_, amount]) => amount < totalSpending * 0.01) // Less than 1% of total
            .slice(0, 3); // Get top 3 lowest
        
        if (lowSpendingCategories.length > 0) {
            const lowCategoryNames = lowSpendingCategories.map(([categoryId, _]) => {
                const category = categories.find(c => c.id === categoryId);
                return category ? category.name : 'Unknown';
            });
            
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item neutral';
            insightItem.innerHTML = `
                <p>You spent very little in ${lowCategoryNames.join(', ')}. This could indicate good
                budgeting or potential areas that you're neglecting.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // If no insights were generated, add a generic one
        if (insightsContainer.children.length === 0) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item neutral';
            insightItem.innerHTML = `
                <p>Continue tracking your expenses by category to generate more detailed insights.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
    },
    
    /**
     * Generate net worth insights
     * @param {Array} sortedMonths - Months sorted chronologically
     * @param {Object} netWorthData - Net worth data by month
     */
    generateNetWorthInsights: function(sortedMonths, netWorthData) {
        const insightsContainer = document.getElementById('report-insights-list');
        if (!insightsContainer || sortedMonths.length <= 1) return;
        
        // Clear existing insights
        insightsContainer.innerHTML = '';
        
        // Calculate net worth trend
        const netWorthValues = sortedMonths.map(month => netWorthData[month].netWorth);
        const netWorthTrend = this.calculateTrend(netWorthValues);
        
        // Get initial and current net worth
        const initialNetWorth = netWorthData[sortedMonths[0]].netWorth;
        const currentNetWorth = netWorthData[sortedMonths[sortedMonths.length - 1]].netWorth;
        const netWorthChange = currentNetWorth - initialNetWorth;
        
        // Calculate monthly growth rate
        const monthCount = sortedMonths.length - 1;
        let monthlyGrowthRate = 0;
        
        if (monthCount > 0 && initialNetWorth !== 0) {
            // Use compound growth rate formula: (ending/beginning)^(1/periods) - 1
            monthlyGrowthRate = Math.pow(Math.abs(currentNetWorth / initialNetWorth), 1 / monthCount) - 1;
            monthlyGrowthRate = Math.round(monthlyGrowthRate * 100);
        }
        
        // Format month names
        const formatMonth = (monthKey) => {
            const [year, monthIndex] = monthKey.split('-').map(Number);
            return `${Utils.getMonthName(monthIndex - 1, false)} ${year}`;
        };
        
        // Generate insights
        // Net worth trend insight
        if (netWorthTrend !== 0) {
            const insightItem = document.createElement('div');
            insightItem.className = `insight-item ${netWorthTrend > 0 ? 'positive' : 'negative'}`;
            insightItem.innerHTML = `
                <p>Your net worth is ${netWorthTrend > 0 ? 'growing' : 'declining'} over time.
                ${netWorthTrend > 0 ? 
                    'Keep up the good work in building your wealth!' : 
                    'Consider focusing on reducing expenses or increasing income to reverse this trend.'
                }</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // Monthly growth rate insight
        if (monthlyGrowthRate !== 0 && !isNaN(monthlyGrowthRate)) {
            const insightItem = document.createElement('div');
            const isPositiveGrowth = monthlyGrowthRate > 0;
            insightItem.className = `insight-item ${isPositiveGrowth ? 'positive' : 'negative'}`;
            
            // Different messages based on the growth rate
            let message = '';
            if (isPositiveGrowth) {
                if (monthlyGrowthRate > 10) {
                    message = 'This is exceptional growth! Consider increasing your investments to take advantage of this momentum.';
                } else {
                    message = 'This is solid growth. Continue your current financial practices.';
                }
            } else {
                if (monthlyGrowthRate < -10) {
                    message = 'This is a significant decline. You may want to review your finances and make adjustments.';
                } else {
                    message = 'This is a moderate decline. Consider small adjustments to reverse the trend.';
                }
            }
            
            insightItem.innerHTML = `
                <p>Your net worth is ${isPositiveGrowth ? 'growing' : 'declining'} at an average rate of 
                ${Math.abs(monthlyGrowthRate)}% per month. ${message}</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // Find any months with significant changes
        let significantChanges = [];
        
        for (let i = 1; i < sortedMonths.length; i++) {
            const prevMonth = sortedMonths[i-1];
            const currentMonth = sortedMonths[i];
            
            const prevNetWorth = netWorthData[prevMonth].netWorth;
            const currentNetWorth = netWorthData[currentMonth].netWorth;
            
            // Calculate percentage change
            let percentageChange = 0;
            if (prevNetWorth !== 0) {
                percentageChange = ((currentNetWorth - prevNetWorth) / Math.abs(prevNetWorth)) * 100;
            }
            
            // If change is more than 20% (positive or negative), consider it significant
            if (Math.abs(percentageChange) > 20) {
                significantChanges.push({
                    month: currentMonth,
                    change: percentageChange,
                    amount: currentNetWorth - prevNetWorth
                });
            }
        }
        
        // Show insight for significant changes
        if (significantChanges.length > 0) {
            // Sort by absolute magnitude of change
            significantChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
            
            const topChange = significantChanges[0];
            const isPositiveChange = topChange.change > 0;
            
            const insightItem = document.createElement('div');
            insightItem.className = `insight-item ${isPositiveChange ? 'positive' : 'negative'}`;
            insightItem.innerHTML = `
                <p>Your net worth ${isPositiveChange ? 'increased' : 'decreased'} significantly in ${formatMonth(topChange.month)} 
                (${isPositiveChange ? '+' : ''}${Math.round(topChange.change)}%, ${Utils.formatCurrency(Math.abs(topChange.amount))}).
                ${isPositiveChange ? 
                    'What went well that month? Try to replicate those actions.' : 
                    'What happened that month? Understanding the cause can help prevent future declines.'
                }</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // If no insights were generated, add a generic one
        if (insightsContainer.children.length === 0) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item neutral';
            insightItem.innerHTML = `
                <p>Continue tracking your net worth over time to generate more detailed insights.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
    },
    
    /**
     * Generate savings rate insights
     * @param {Array} sortedMonths - Months sorted chronologically
     * @param {Object} monthlyData - Monthly income and expense data
     * @param {Object} savingsRates - Savings rates by month
     */
    generateSavingsRateInsights: function(sortedMonths, monthlyData, savingsRates) {
        const insightsContainer = document.getElementById('report-insights-list');
        if (!insightsContainer || sortedMonths.length === 0) return;
        
        // Clear existing insights
        insightsContainer.innerHTML = '';
        
        // Calculate savings rate trend
        const rateValues = sortedMonths.map(month => savingsRates[month]);
        const rateTrend = this.calculateTrend(rateValues);
        
        // Calculate average savings rate
        const totalRate = rateValues.reduce((sum, rate) => sum + rate, 0);
        const averageRate = Math.round(totalRate / rateValues.length);
        
        // Format month names
        const formatMonth = (monthKey) => {
            const [year, monthIndex] = monthKey.split('-').map(Number);
            return `${Utils.getMonthName(monthIndex - 1, false)} ${year}`;
        };
        
        // Generate insights
        // Savings rate trend insight
        if (rateTrend !== 0) {
            const insightItem = document.createElement('div');
            insightItem.className = `insight-item ${rateTrend > 0 ? 'positive' : 'negative'}`;
            insightItem.innerHTML = `
                <p>Your savings rate is ${rateTrend > 0 ? 'improving' : 'declining'} over time.
                ${rateTrend > 0 ? 
                    'You\'re becoming more efficient at saving money!' : 
                    'Consider reviewing your budget to find ways to increase your savings rate.'
                }</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // Average savings rate insight
        if (averageRate !== 0) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item neutral';
            
            let message = '';
            if (averageRate < 0) {
                message = 'A negative savings rate means you\'re spending more than you earn. Focus on reducing expenses or increasing income.';
            } else if (averageRate < 10) {
                message = 'Financial experts recommend aiming for at least 15-20% savings rate for long-term financial health.';
            } else if (averageRate < 20) {
                message = 'This is a solid savings rate. Consider increasing it slightly for faster progress towards financial goals.';
            } else if (averageRate < 30) {
                message = 'This is an excellent savings rate that puts you ahead of most people!';
            } else {
                message = 'This is an exceptional savings rate! You\'re on the fast track to financial independence.';
            }
            
            insightItem.innerHTML = `
                <p>Your average savings rate is ${averageRate}%. ${message}</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
        
        // Find months with negative savings rates
        const negativeMonths = sortedMonths.filter(month => savingsRates[month] < 0);
        
        if (negativeMonths.length > 0) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item negative';
            
            if (negativeMonths.length === 1) {
                insightItem.innerHTML = `
                    <p>You had a negative savings rate in ${formatMonth(negativeMonths[0])}.
                    This means you spent more than you earned that month.</p>
                `;
            } else {
                insightItem.innerHTML = `
                    <p>You had negative savings rates in ${negativeMonths.length} months.
                    Your most recent negative month was ${formatMonth(negativeMonths[negativeMonths.length - 1])}.</p>
                `;
            }
            
            insightsContainer.appendChild(insightItem);
        }
        
        // If no insights were generated, add a generic one
        if (insightsContainer.children.length === 0) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item neutral';
            insightItem.innerHTML = `
                <p>Continue tracking your income and expenses to generate more insights about your savings rate.</p>
            `;
            insightsContainer.appendChild(insightItem);
        }
    },
    
    /**
     * Calculate the trend in an array of values
     * @param {Array} values - Array of numeric values
     * @returns {number} Trend (1 for upward, -1 for downward, 0 for no clear trend)
     */
    calculateTrend: function(values) {
        if (values.length < 3) return 0; // Need at least 3 points for a trend
        
        // Use simple linear regression to calculate trend
        const n = values.length;
        
        // X values are just the indices (0, 1, 2, ...)
        const xValues = Array.from({ length: n }, (_, i) => i);
        
        // Calculate means
        const sumX = xValues.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const meanX = sumX / n;
        const meanY = sumY / n;
        
        // Calculate slope
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < n; i++) {
            numerator += (xValues[i] - meanX) * (values[i] - meanY);
            denominator += Math.pow(xValues[i] - meanX, 2);
        }
        
        if (denominator === 0) return 0;
        
        const slope = numerator / denominator;
        
        // Determine trend based on slope
        if (Math.abs(slope) < 0.01 * meanY) return 0; // No significant trend
        return slope > 0 ? 1 : -1;
    },
    
    /**
     * Show empty state when there's no data
     */
    showEmptyState: function() {
        const chartContainer = document.getElementById('report-chart');
        const summaryContainer = document.getElementById('report-summary');
        const insightsContainer = document.getElementById('report-insights-list');
        const reportsEmptyState = document.getElementById('reports-empty-state');
        
        // Destroy existing chart if it exists
        if (this.currentChart) {
            this.currentChart.destroy();
            this.currentChart = null;
        }
        
        // Clear containers
        if (summaryContainer) summaryContainer.innerHTML = '';
        if (insightsContainer) insightsContainer.innerHTML = '';
        
        // Show empty state
        if (reportsEmptyState) reportsEmptyState.style.display = 'flex';
    }
};
