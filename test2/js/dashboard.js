/**
 * Dashboard module
 * Handles the dashboard functionality and data display
 */

const Dashboard = {
    /**
     * Initialize the Dashboard module
     */
    initialize: function() {
        this.setupEventListeners();
        this.mainChartInstance = null;
        this.refresh();
    },
    
    /**
     * Set up dashboard-specific event listeners
     */
    setupEventListeners: function() {
        // Chart view selector
        const chartViewSelector = document.getElementById('chart-view-selector');
        if (chartViewSelector) {
            chartViewSelector.addEventListener('change', () => {
                this.updateMainChart(chartViewSelector.value);
            });
        }
        
        // Add transaction button
        const addTransactionBtn = document.getElementById('add-transaction');
        if (addTransactionBtn) {
            addTransactionBtn.addEventListener('click', () => {
                Transactions.showAddTransactionModal();
            });
        }
        
        // Add first transaction button
        const addFirstTransactionBtn = document.getElementById('add-first-transaction');
        if (addFirstTransactionBtn) {
            addFirstTransactionBtn.addEventListener('click', () => {
                Transactions.showAddTransactionModal();
            });
        }
        
        // Add budget button
        const addBudgetBtn = document.getElementById('add-budget');
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', () => {
                Budgets.showAddBudgetModal();
            });
        }
        
        // Create first budget button
        const createFirstBudgetBtn = document.getElementById('create-first-budget');
        if (createFirstBudgetBtn) {
            createFirstBudgetBtn.addEventListener('click', () => {
                Budgets.showAddBudgetModal();
            });
        }
        
        // Add bill button
        const addBillBtn = document.getElementById('add-bill');
        if (addBillBtn) {
            addBillBtn.addEventListener('click', () => {
                Bills.showAddBillModal();
            });
        }
        
        // Add first bill button
        const addFirstBillBtn = document.getElementById('add-first-bill');
        if (addFirstBillBtn) {
            addFirstBillBtn.addEventListener('click', () => {
                Bills.showAddBillModal();
            });
        }
        
        // Add goal button
        const addGoalBtn = document.getElementById('add-goal');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => {
                Goals.showAddGoalModal();
            });
        }
        
        // Add first goal button
        const addFirstGoalBtn = document.getElementById('add-first-goal');
        if (addFirstGoalBtn) {
            addFirstGoalBtn.addEventListener('click', () => {
                Goals.showAddGoalModal();
            });
        }
    },
    
    /**
     * Refresh all dashboard components
     */
    refresh: function() {
        this.updateStatCards();
        this.updateNetWorth();
        this.updateMainChart('income-expense');
        this.updateBudgetOverview();
        this.updateRecentTransactions();
        this.updateUpcomingBills();
        this.updateFinancialGoals();
        this.calculateFinancialHealthScore();
        this.predictSavingsTrend();
    },
    
    /**
     * Calculate and display financial health score
     * Based on savings rate, debt-to-income ratio, and budget adherence
     */
    calculateFinancialHealthScore: function() {
        const transactions = Storage.getTransactions();
        const budgets = Storage.getBudgets();
        
        // 1. Calculate savings rate (last 3 months)
        const today = new Date();
        const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
        
        const recentTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= threeMonthsAgo;
        });
        
        let totalIncome = 0;
        let totalExpenses = 0;
        
        recentTransactions.forEach(transaction => {
            if (transaction.type === 'income') {
                totalIncome += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                totalExpenses += parseFloat(transaction.amount);
            }
        });
        
        const savingsRate = totalIncome > 0 ? (totalIncome - totalExpenses) / totalIncome : 0;
        
        // 2. Check budget adherence
        let budgetAdherence = 1.0; // Default perfect adherence
        if (budgets.length > 0) {
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            const monthStart = new Date(currentYear, currentMonth, 1);
            const monthEnd = new Date(currentYear, currentMonth + 1, 0);
            
            const monthlyExpenses = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transaction.type === 'expense' &&
                       transactionDate >= monthStart &&
                       transactionDate <= monthEnd;
            });
            
            let totalOverBudget = 0;
            let totalBudgetAmount = 0;
            
            budgets.forEach(budget => {
                const budgetAmount = parseFloat(budget.amount);
                totalBudgetAmount += budgetAmount;
                
                const categoryExpenses = monthlyExpenses
                    .filter(expense => expense.category === budget.categoryId)
                    .reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                
                if (categoryExpenses > budgetAmount) {
                    totalOverBudget += (categoryExpenses - budgetAmount);
                }
            });
            
            // Calculate adherence ratio (1.0 = perfect, 0.0 = way over budget)
            budgetAdherence = totalBudgetAmount > 0 ? 
                Math.max(0, 1 - (totalOverBudget / totalBudgetAmount)) : 1.0;
        }
        
        // 3. Calculate financial health score (0-100)
        // 50% weight on savings rate, 50% on budget adherence
        const savingsRateScore = Math.min(1, Math.max(0, savingsRate * 5)); // Max score at 20% savings
        const healthScore = Math.round((savingsRateScore * 50) + (budgetAdherence * 50));
        
        // Add or update financial health gauge in the UI
        const financialHealthContainer = document.getElementById('financial-health-container');
        if (financialHealthContainer) {
            let healthLabel = 'Needs Attention';
            let healthClass = 'danger';
            
            if (healthScore >= 80) {
                healthLabel = 'Excellent';
                healthClass = 'excellent';
            } else if (healthScore >= 65) {
                healthLabel = 'Good';
                healthClass = 'good';
            } else if (healthScore >= 50) {
                healthLabel = 'Fair';
                healthClass = 'fair';
            } else if (healthScore >= 30) {
                healthLabel = 'Concerning';
                healthClass = 'warning';
            }
            
            financialHealthContainer.innerHTML = `
                <div class="financial-health-score ${healthClass}">
                    <div class="health-gauge">
                        <div class="gauge-value" style="transform: rotate(${Math.min(180, healthScore * 1.8)}deg)"></div>
                        <div class="gauge-center">
                            <div class="gauge-number">${healthScore}</div>
                        </div>
                    </div>
                    <div class="health-label">${healthLabel}</div>
                </div>
                <div class="health-insights">
                    <div class="insight">
                        <span class="insight-label">Savings Rate:</span>
                        <span class="insight-value">${Math.round(savingsRate * 100)}%</span>
                    </div>
                    <div class="insight">
                        <span class="insight-label">Budget Adherence:</span>
                        <span class="insight-value">${Math.round(budgetAdherence * 100)}%</span>
                    </div>
                </div>
            `;
            
            // Refresh Feather icons after updating DOM
            feather.replace();
        }
    },
    
    /**
     * Predict savings trend for the next 6 months
     * Based on historical income and expense patterns
     */
    predictSavingsTrend: function() {
        const transactions = Storage.getTransactions();
        const today = new Date();
        
        // Analyze the last 6 months
        const pastSixMonths = [];
        const futureSixMonths = [];
        
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            
            const monthlyTransactions = transactions.filter(transaction => {
                const transactionDate = new Date(transaction.date);
                return transactionDate >= monthDate && transactionDate <= monthEnd;
            });
            
            let monthlyIncome = 0;
            let monthlyExpense = 0;
            
            monthlyTransactions.forEach(transaction => {
                if (transaction.type === 'income') {
                    monthlyIncome += parseFloat(transaction.amount);
                } else if (transaction.type === 'expense') {
                    monthlyExpense += parseFloat(transaction.amount);
                }
            });
            
            pastSixMonths.push({
                month: monthDate.toLocaleString('default', { month: 'short' }),
                year: monthDate.getFullYear(),
                income: monthlyIncome,
                expenses: monthlyExpense,
                savings: monthlyIncome - monthlyExpense
            });
        }
        
        // Calculate average monthly income and expense growth rates
        let incomeGrowthRate = 0;
        let expenseGrowthRate = 0;
        
        if (pastSixMonths.length >= 2) {
            // Calculate average growth rate for income
            let incomeGrowthSum = 0;
            let expenseGrowthSum = 0;
            let countMonths = 0;
            
            for (let i = 1; i < pastSixMonths.length; i++) {
                if (pastSixMonths[i-1].income > 0) {
                    incomeGrowthSum += (pastSixMonths[i].income - pastSixMonths[i-1].income) / pastSixMonths[i-1].income;
                }
                
                if (pastSixMonths[i-1].expenses > 0) {
                    expenseGrowthSum += (pastSixMonths[i].expenses - pastSixMonths[i-1].expenses) / pastSixMonths[i-1].expenses;
                }
                
                countMonths++;
            }
            
            incomeGrowthRate = countMonths > 0 ? incomeGrowthSum / countMonths : 0;
            expenseGrowthRate = countMonths > 0 ? expenseGrowthSum / countMonths : 0;
        }
        
        // Apply sensible bounds to growth rates to prevent extreme projections
        incomeGrowthRate = Math.max(-0.1, Math.min(0.1, incomeGrowthRate));
        expenseGrowthRate = Math.max(-0.1, Math.min(0.1, expenseGrowthRate));
        
        // Project next 6 months
        let projectedIncome = pastSixMonths.length > 0 ? pastSixMonths[pastSixMonths.length - 1].income : 0;
        let projectedExpense = pastSixMonths.length > 0 ? pastSixMonths[pastSixMonths.length - 1].expenses : 0;
        
        for (let i = 1; i <= 6; i++) {
            const futureMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
            
            projectedIncome = projectedIncome * (1 + incomeGrowthRate);
            projectedExpense = projectedExpense * (1 + expenseGrowthRate);
            
            futureSixMonths.push({
                month: futureMonth.toLocaleString('default', { month: 'short' }),
                year: futureMonth.getFullYear(),
                income: projectedIncome,
                expenses: projectedExpense,
                savings: projectedIncome - projectedExpense
            });
        }
        
        // Update prediction in UI
        const savingsTrendContainer = document.getElementById('savings-prediction-container');
        if (savingsTrendContainer) {
            // Calculate total projected savings
            const totalProjectedSavings = futureSixMonths.reduce((sum, month) => sum + month.savings, 0);
            
            // Create HTML for the savings trend container
            let savingsTrendHTML = `
                <div class="prediction-header">
                    <h3>Savings Forecast</h3>
                    <div class="total-prediction">6-month projection: ${Utils.formatCurrency(totalProjectedSavings)}</div>
                </div>
                <div class="prediction-bars">
            `;
            
            // Add bars for each month
            futureSixMonths.forEach(month => {
                const savingsPercentage = Math.round((month.savings / month.income) * 100);
                const barHeight = Math.max(5, Math.min(100, (month.savings / (month.income * 0.5)) * 100)); // Cap at 50% of income = 100% height
                const barClass = month.savings >= 0 ? 'positive' : 'negative';
                
                savingsTrendHTML += `
                    <div class="prediction-month">
                        <div class="month-label">${month.month} '${month.year.toString().substr(-2)}</div>
                        <div class="prediction-bar-container">
                            <div class="prediction-bar ${barClass}" style="height: ${barHeight}%"></div>
                        </div>
                        <div class="prediction-amount">${Utils.formatCurrency(month.savings)}</div>
                        <div class="prediction-percent">${savingsPercentage}%</div>
                    </div>
                `;
            });
            
            savingsTrendHTML += `</div>`;
            
            savingsTrendContainer.innerHTML = savingsTrendHTML;
            
            // Refresh Feather icons
            feather.replace();
        }
    },
    
    /**
     * Update the summary statistics cards
     */
    updateStatCards: function() {
        const transactions = Storage.getTransactions();
        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        
        // Current month data
        const currentMonthTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= currentMonthStart && transactionDate <= today;
        });
        
        // Last month data
        const lastMonthTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd;
        });
        
        // Calculate totals for current month
        let currentIncome = 0, currentExpenses = 0;
        currentMonthTransactions.forEach(transaction => {
            if (transaction.type === 'income') {
                currentIncome += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                currentExpenses += parseFloat(transaction.amount);
            }
        });
        
        // Calculate totals for last month
        let lastIncome = 0, lastExpenses = 0;
        lastMonthTransactions.forEach(transaction => {
            if (transaction.type === 'income') {
                lastIncome += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                lastExpenses += parseFloat(transaction.amount);
            }
        });
        
        // Calculate savings and percentages
        const currentSavings = currentIncome - currentExpenses;
        const lastSavings = lastIncome - lastExpenses;
        
        const incomeChange = lastIncome === 0 ? 100 : Math.round((currentIncome - lastIncome) / lastIncome * 100);
        const expensesChange = lastExpenses === 0 ? 0 : Math.round((currentExpenses - lastExpenses) / lastExpenses * 100);
        const savingsPercentage = currentIncome === 0 ? 0 : Math.round((currentSavings / currentIncome) * 100);
        
        // Calculate net worth and change
        const netWorth = this.calculateTotalNetWorth();
        const lastMonthNetWorth = this.calculateNetWorthAsOf(currentMonthStart);
        const netWorthChange = netWorth - lastMonthNetWorth;
        
        // Update UI
        document.getElementById('stat-income-amount').textContent = Utils.formatCurrency(currentIncome);
        document.getElementById('stat-expenses-amount').textContent = Utils.formatCurrency(currentExpenses);
        document.getElementById('stat-savings-amount').textContent = Utils.formatCurrency(currentSavings);
        document.getElementById('stat-net-worth-amount').textContent = Utils.formatCurrency(netWorth);
        
        document.getElementById('stat-income-change').textContent = `${incomeChange}%`;
        document.getElementById('stat-expenses-change').textContent = `${expensesChange}%`;
        document.getElementById('stat-savings-percentage').textContent = `${savingsPercentage}%`;
        document.getElementById('stat-net-worth-change').textContent = Utils.formatCurrency(netWorthChange);
        
        // Update change classes for income
        const incomeChangeEl = document.getElementById('stat-income-amount').nextElementSibling;
        if (incomeChangeEl) {
            if (incomeChange >= 0) {
                incomeChangeEl.classList.add('positive');
                incomeChangeEl.classList.remove('negative');
                const icon = incomeChangeEl.querySelector('i');
                if (icon) icon.setAttribute('data-feather', 'arrow-up');
            } else {
                incomeChangeEl.classList.add('negative');
                incomeChangeEl.classList.remove('positive');
                const icon = incomeChangeEl.querySelector('i');
                if (icon) icon.setAttribute('data-feather', 'arrow-down');
            }
        }
        
        // Update change classes for expenses
        const expensesChangeEl = document.getElementById('stat-expenses-amount').nextElementSibling;
        if (expensesChangeEl) {
            if (expensesChange <= 0) {
                expensesChangeEl.classList.add('positive');
                expensesChangeEl.classList.remove('negative');
                const icon = expensesChangeEl.querySelector('i');
                if (icon) icon.setAttribute('data-feather', 'arrow-down');
            } else {
                expensesChangeEl.classList.add('negative');
                expensesChangeEl.classList.remove('positive');
                const icon = expensesChangeEl.querySelector('i');
                if (icon) icon.setAttribute('data-feather', 'arrow-up');
            }
        }
        
        // Update change classes for net worth
        const netWorthChangeEl = document.getElementById('stat-net-worth-amount').nextElementSibling;
        if (netWorthChangeEl) {
            if (netWorthChange >= 0) {
                netWorthChangeEl.classList.add('positive');
                netWorthChangeEl.classList.remove('negative');
                const icon = netWorthChangeEl.querySelector('i');
                if (icon) icon.setAttribute('data-feather', 'arrow-up');
            } else {
                netWorthChangeEl.classList.add('negative');
                netWorthChangeEl.classList.remove('positive');
                const icon = netWorthChangeEl.querySelector('i');
                if (icon) icon.setAttribute('data-feather', 'arrow-down');
            }
        }
        
        // Re-initialize Feather icons
        feather.replace();
    },
    
    /**
     * Calculate total net worth
     * @returns {number} Total net worth
     */
    calculateTotalNetWorth: function() {
        const transactions = Storage.getTransactions();
        
        let assets = 0;
        let liabilities = 0;
        
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                assets += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                liabilities += parseFloat(transaction.amount);
            }
        });
        
        return assets - liabilities;
    },
    
    /**
     * Update the net worth display
     */
    updateNetWorth: function() {
        // Get all transactions
        const transactions = Storage.getTransactions();
        
        let assets = 0;
        let liabilities = 0;
        
        // Calculate assets and liabilities from transactions
        transactions.forEach(transaction => {
            if (transaction.type === 'income') {
                assets += parseFloat(transaction.amount);
            } else if (transaction.type === 'expense') {
                liabilities += parseFloat(transaction.amount);
            }
        });
        
        const netWorth = assets - liabilities;
        
        // Determine change from previous month
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastMonthNetWorth = this.calculateNetWorthAsOf(firstDayOfMonth);
        const netWorthChange = netWorth - lastMonthNetWorth;
        
        // Update the UI
        document.getElementById('net-worth-amount').textContent = Utils.formatCurrency(netWorth);
        document.getElementById('assets-amount').textContent = Utils.formatCurrency(assets);
        document.getElementById('liabilities-amount').textContent = Utils.formatCurrency(liabilities);
        
        const changeElement = document.getElementById('net-worth-change');
        const changeValueElement = changeElement.querySelector('.change-value');
        
        if (netWorthChange >= 0) {
            changeValueElement.textContent = `+${Utils.formatCurrency(netWorthChange)}`;
            changeValueElement.classList.remove('negative');
            changeValueElement.classList.add('positive');
        } else {
            changeValueElement.textContent = Utils.formatCurrency(netWorthChange);
            changeValueElement.classList.remove('positive');
            changeValueElement.classList.add('negative');
        }
    },
    
    /**
     * Calculate net worth as of a specific date
     * @param {Date} date - The date to calculate net worth for
     * @returns {number} Net worth as of the given date
     */
    calculateNetWorthAsOf: function(date) {
        const transactions = Storage.getTransactions();
        let assets = 0;
        let liabilities = 0;
        
        // Only consider transactions before the given date
        const cutoffDate = date.getTime();
        
        transactions.forEach(transaction => {
            const transactionDate = new Date(transaction.date).getTime();
            if (transactionDate < cutoffDate) {
                if (transaction.type === 'income') {
                    assets += parseFloat(transaction.amount);
                } else if (transaction.type === 'expense') {
                    liabilities += parseFloat(transaction.amount);
                }
            }
        });
        
        return assets - liabilities;
    },
    
    /**
     * Update the main chart based on selected view
     * @param {string} viewType - Type of chart to display
     */
    updateMainChart: function(viewType) {
        // Destroy existing chart if it exists
        if (this.mainChartInstance) {
            this.mainChartInstance.destroy();
        }
        
        const ctx = document.getElementById('main-chart');
        
        switch (viewType) {
            case 'income-expense':
                this.createIncomeExpenseChart(ctx);
                break;
            case 'spending-categories':
                this.createSpendingCategoriesChart(ctx);
                break;
            case 'net-worth-trend':
                this.createNetWorthTrendChart(ctx);
                break;
            default:
                this.createIncomeExpenseChart(ctx);
        }
    },
    
    /**
     * Create income vs expense chart (last 6 months)
     * @param {HTMLCanvasElement} ctx - Canvas context for chart
     */
    createIncomeExpenseChart: function(ctx) {
        const transactions = Storage.getTransactions();
        const today = new Date();
        
        // Get data for last 6 months
        const labels = [];
        const incomeData = [];
        const expenseData = [];
        
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = monthDate.toLocaleString('default', { month: 'short' });
            const year = monthDate.getFullYear().toString().substr(-2);
            labels.push(`${monthName} '${year}`);
            
            const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            
            let monthlyIncome = 0;
            let monthlyExpense = 0;
            
            transactions.forEach(transaction => {
                const transactionDate = new Date(transaction.date);
                if (transactionDate >= monthStart && transactionDate <= monthEnd) {
                    if (transaction.type === 'income') {
                        monthlyIncome += parseFloat(transaction.amount);
                    } else if (transaction.type === 'expense') {
                        monthlyExpense += parseFloat(transaction.amount);
                    }
                }
            });
            
            incomeData.push(monthlyIncome);
            expenseData.push(monthlyExpense);
        }
        
        // Create chart
        this.mainChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income',
                        data: incomeData,
                        backgroundColor: 'rgba(46, 204, 113, 0.7)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                        borderColor: 'rgba(231, 76, 60, 1)',
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
                                return `${context.dataset.label}: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Income vs Expenses (Last 6 Months)'
                    }
                }
            }
        });
    },
    
    /**
     * Create spending by category chart
     * @param {HTMLCanvasElement} ctx - Canvas context for chart
     */
    createSpendingCategoriesChart: function(ctx) {
        const transactions = Storage.getTransactions();
        const categories = Storage.getCategories();
        const today = new Date();
        
        // Get expense transactions for current month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const expenses = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transaction.type === 'expense' && 
                  transactionDate >= monthStart && 
                  transactionDate <= monthEnd;
        });
        
        // Aggregate spending by category
        const categorySpending = {};
        expenses.forEach(expense => {
            if (!categorySpending[expense.category]) {
                categorySpending[expense.category] = 0;
            }
            categorySpending[expense.category] += parseFloat(expense.amount);
        });
        
        // Prepare chart data
        const chartData = [];
        const chartLabels = [];
        const chartColors = [];
        
        // Sort categories by spending amount (descending)
        Object.keys(categorySpending)
            .sort((a, b) => categorySpending[b] - categorySpending[a])
            .forEach(categoryId => {
                // Find category name
                const category = categories.find(cat => cat.id === categoryId);
                const categoryName = category ? category.name : 'Uncategorized';
                
                chartLabels.push(categoryName);
                chartData.push(categorySpending[categoryId]);
                
                // Generate a color based on category ID
                const hash = categoryId.split('').reduce((acc, char) => {
                    return char.charCodeAt(0) + ((acc << 5) - acc);
                }, 0);
                const h = Math.abs(hash % 360);
                chartColors.push(`hsla(${h}, 70%, 60%, 0.8)`);
            });
        
        // Create chart
        this.mainChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderColor: 'rgba(255, 255, 255, 0.8)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = Utils.formatCurrency(context.raw);
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = Math.round((context.raw / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    },
                    legend: {
                        position: 'right',
                        labels: {
                            font: {
                                size: 12
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: `Spending by Category (${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()})`
                    }
                }
            }
        });
    },
    
    /**
     * Create net worth trend chart
     * @param {HTMLCanvasElement} ctx - Canvas context for chart
     */
    createNetWorthTrendChart: function(ctx) {
        const today = new Date();
        
        // Get data for last 12 months
        const labels = [];
        const netWorthData = [];
        
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = monthDate.toLocaleString('default', { month: 'short' });
            const year = monthDate.getFullYear().toString().substr(-2);
            labels.push(`${monthName} '${year}`);
            
            // Calculate net worth at the end of the month
            const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
            const netWorth = this.calculateNetWorthAsOf(new Date(monthEnd.getTime() + 1));
            netWorthData.push(netWorth);
        }
        
        // Create chart
        this.mainChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Net Worth',
                    data: netWorthData,
                    fill: true,
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(99, 102, 241, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.2
                }]
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
                                return `Net Worth: ${Utils.formatCurrency(context.raw)}`;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: 'Net Worth Trend (Last 12 Months)'
                    }
                }
            }
        });
    },
    
    /**
     * Create a chart for the monthly summary
     * @param {number} income - Total income
     * @param {number} expenses - Total expenses
     * @param {number} savings - Total savings
     */
    createMonthlySummaryChart: function(income, expenses, savings) {
        const ctx = document.getElementById('monthly-summary-chart');
        
        // Destroy existing chart if it exists
        if (this.monthlySummaryChart) {
            this.monthlySummaryChart.destroy();
        }
        
        // Create new chart
        this.monthlySummaryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses', 'Savings'],
                datasets: [{
                    label: 'Amount',
                    data: [income, expenses, savings],
                    backgroundColor: [
                        'rgba(46, 204, 113, 0.7)', // Income
                        'rgba(231, 76, 60, 0.7)',  // Expenses
                        'rgba(52, 152, 219, 0.7)'  // Savings
                    ],
                    borderColor: [
                        'rgba(46, 204, 113, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(52, 152, 219, 1)'
                    ],
                    borderWidth: 1
                }]
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
                                return Utils.formatCurrency(context.raw);
                            }
                        }
                    }
                }
            }
        });
    },
    
    /**
     * Update the budget overview section
     */
    updateBudgetOverview: function() {
        const budgets = Storage.getBudgets();
        const transactions = Storage.getTransactions();
        const categories = Storage.getCategories();
        
        const budgetProgressContainer = document.getElementById('budget-progress-bars');
        const budgetEmptyState = document.getElementById('budget-empty-state');
        
        // Clear the container
        budgetProgressContainer.innerHTML = '';
        
        if (budgets.length === 0) {
            // Show empty state
            budgetEmptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        budgetEmptyState.style.display = 'none';
        
        // Get current month's transactions
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const monthlyTransactions = transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            return transactionDate >= startOfMonth && transactionDate <= endOfMonth;
        });
        
        // For each budget, calculate the amount spent
        budgets.forEach(budget => {
            const category = categories.find(c => c.id === budget.categoryId);
            if (!category) return;
            
            // Calculate amount spent in this category
            const spent = monthlyTransactions
                .filter(t => t.categoryId === budget.categoryId && t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
            
            const budgetAmount = parseFloat(budget.amount);
            const remaining = Utils.calculateBudgetRemaining(budgetAmount, spent);
            const progress = Utils.calculateBudgetProgress(budgetAmount, spent);
            const status = Utils.getBudgetStatus(progress);
            
            // Create budget progress bar
            const budgetProgressElement = document.createElement('div');
            budgetProgressElement.className = 'budget-progress';
            budgetProgressElement.innerHTML = `
                <div class="progress-header">
                    <span class="category-name">${category.name}</span>
                    <span class="progress-amounts">${Utils.formatCurrency(spent)} / ${Utils.formatCurrency(budgetAmount)}</span>
                </div>
                <div class="progress-bar-outer">
                    <div class="progress-bar-inner ${status}" style="width: ${progress}%"></div>
                </div>
                <div class="progress-status">
                    <span class="progress-percentage">${progress}%</span>
                    <span class="remaining">${Utils.formatCurrency(remaining)} remaining</span>
                </div>
            `;
            
            budgetProgressContainer.appendChild(budgetProgressElement);
        });
    },
    
    /**
     * Update the recent transactions section
     */
    updateRecentTransactions: function() {
        const transactions = Storage.getTransactions();
        const categories = Storage.getCategories();
        
        const transactionsList = document.getElementById('recent-transactions');
        const transactionsEmptyState = document.getElementById('transactions-empty-state');
        
        // Clear the container
        transactionsList.innerHTML = '';
        
        if (transactions.length === 0) {
            // Show empty state
            transactionsEmptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        transactionsEmptyState.style.display = 'none';
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        // Show only the 5 most recent transactions
        const recentTransactions = sortedTransactions.slice(0, 5);
        
        // Create transaction items
        recentTransactions.forEach(transaction => {
            const category = categories.find(c => c.id === transaction.categoryId);
            if (!category) return;
            
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            
            transactionItem.innerHTML = `
                <div class="transaction-info">
                    <div class="transaction-category" style="background-color: ${category.color}">
                        <i data-feather="${transaction.type === 'income' ? 'arrow-down' : 'arrow-up'}"></i>
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-description">${transaction.description}</div>
                        <div class="transaction-date">${Utils.formatDate(transaction.date)}</div>
                    </div>
                </div>
                <div class="transaction-amount ${transaction.type}">
                    ${transaction.type === 'income' ? '+' : '-'}${Utils.formatCurrency(transaction.amount)}
                </div>
            `;
            
            transactionsList.appendChild(transactionItem);
        });
        
        // Initialize Feather icons for the new elements
        feather.replace();
    },
    
    /**
     * Update the upcoming bills section
     */
    updateUpcomingBills: function() {
        const bills = Storage.getBills();
        const categories = Storage.getCategories();
        
        const billsList = document.getElementById('upcoming-bills');
        const billsEmptyState = document.getElementById('bills-empty-state');
        
        // Clear the container
        billsList.innerHTML = '';
        
        if (bills.length === 0) {
            // Show empty state
            billsEmptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        billsEmptyState.style.display = 'none';
        
        // Get today's date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter and sort upcoming bills (due within the next 30 days)
        const upcomingBills = bills
            .filter(bill => {
                const dueDate = new Date(bill.dueDate);
                const daysUntilDue = Utils.getDaysLeft(dueDate);
                return !bill.paid && (daysUntilDue >= -7 && daysUntilDue <= 30); // Include bills up to 7 days overdue
            })
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        
        // Show up to 5 upcoming bills
        const billsToShow = upcomingBills.slice(0, 5);
        
        // Create bill items
        billsToShow.forEach(bill => {
            const category = categories.find(c => c.id === bill.categoryId);
            const dueDate = new Date(bill.dueDate);
            const status = Utils.getBillStatus(dueDate, bill.paid);
            
            const billItem = document.createElement('div');
            billItem.className = 'bill-item';
            
            billItem.innerHTML = `
                <div class="bill-info">
                    <div class="bill-name">${bill.name}</div>
                    <div class="bill-date">Due: ${Utils.formatDate(bill.dueDate)}</div>
                </div>
                <div class="bill-amount">${Utils.formatCurrency(bill.amount)}</div>
                <div class="bill-status ${status}">${status.replace('-', ' ')}</div>
            `;
            
            billsList.appendChild(billItem);
        });
    },
    
    /**
     * Update the financial goals section
     */
    updateFinancialGoals: function() {
        const goals = Storage.getGoals();
        
        const goalsList = document.getElementById('financial-goals');
        const goalsEmptyState = document.getElementById('goals-empty-state');
        
        // Clear the container
        goalsList.innerHTML = '';
        
        if (goals.length === 0) {
            // Show empty state
            goalsEmptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        goalsEmptyState.style.display = 'none';
        
        // Sort goals by target date
        const sortedGoals = [...goals].sort((a, b) => {
            return new Date(a.targetDate) - new Date(b.targetDate);
        });
        
        // Show up to 3 goals
        const goalsToShow = sortedGoals.slice(0, 3);
        
        // Create goal items
        goalsToShow.forEach(goal => {
            const currentAmount = parseFloat(goal.currentAmount);
            const targetAmount = parseFloat(goal.targetAmount);
            const progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
            const isComplete = Utils.isGoalComplete(currentAmount, targetAmount);
            
            const goalItem = document.createElement('div');
            goalItem.className = 'goal-item';
            
            goalItem.innerHTML = `
                <div class="goal-header">
                    <div class="goal-name">${goal.name}</div>
                    <div class="goal-date">Target: ${Utils.formatDate(goal.targetDate)}</div>
                </div>
                <div class="goal-progress-outer">
                    <div class="goal-progress-inner" style="width: ${progress}%"></div>
                </div>
                <div class="goal-details">
                    <div class="goal-amount">
                        ${Utils.formatCurrency(currentAmount)} / ${Utils.formatCurrency(targetAmount)}
                    </div>
                    <div class="goal-percentage">${progress}%</div>
                </div>
            `;
            
            goalsList.appendChild(goalItem);
        });
    }
};
