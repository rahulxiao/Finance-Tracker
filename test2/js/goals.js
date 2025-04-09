/**
 * Goals module
 * Handles all financial goal-related functionality
 */

const Goals = {
    /**
     * Initialize the Goals module
     */
    initialize: function() {
        this.setupEventListeners();
        this.refresh();
    },
    
    /**
     * Set up goal-specific event listeners
     */
    setupEventListeners: function() {
        // Add goal button
        const addGoalBtn = document.getElementById('add-goal-btn');
        if (addGoalBtn) {
            addGoalBtn.addEventListener('click', () => {
                this.showAddGoalModal();
            });
        }
        
        // Create first goal button on goals page
        const createFirstGoalBtn = document.getElementById('create-first-goal-page');
        if (createFirstGoalBtn) {
            createFirstGoalBtn.addEventListener('click', () => {
                this.showAddGoalModal();
            });
        }
        
        // Goal form submission
        const goalForm = document.getElementById('goal-form');
        if (goalForm) {
            goalForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveGoal();
            });
        }
        
        // Goals filter
        const goalsFilter = document.getElementById('goals-filter');
        if (goalsFilter) {
            goalsFilter.addEventListener('change', () => {
                this.applyFilters();
            });
        }
    },
    
    /**
     * Refresh the goals view
     */
    refresh: function() {
        this.applyFilters();
    },
    
    /**
     * Apply filters to the goals list
     */
    applyFilters: function() {
        const goals = Storage.getGoals();
        const filterSelect = document.getElementById('goals-filter');
        
        let filteredGoals = [...goals];
        
        // Apply filter
        if (filterSelect && filterSelect.value !== 'all') {
            const filterValue = filterSelect.value;
            
            filteredGoals = filteredGoals.filter(goal => {
                const isCompleted = Utils.isGoalComplete(
                    parseFloat(goal.currentAmount), 
                    parseFloat(goal.targetAmount)
                );
                
                if (filterValue === 'completed') {
                    return isCompleted;
                } else if (filterValue === 'in-progress') {
                    return !isCompleted;
                }
                
                return true;
            });
        }
        
        // Sort goals by target date
        filteredGoals.sort((a, b) => {
            // Sort completed goals to the end
            const aComplete = Utils.isGoalComplete(parseFloat(a.currentAmount), parseFloat(a.targetAmount));
            const bComplete = Utils.isGoalComplete(parseFloat(b.currentAmount), parseFloat(b.targetAmount));
            
            if (aComplete && !bComplete) return 1;
            if (!aComplete && bComplete) return -1;
            
            // Sort by target date
            return new Date(a.targetDate) - new Date(b.targetDate);
        });
        
        // Render the goals
        this.renderGoals(filteredGoals);
    },
    
    /**
     * Render the goals list
     * @param {Array} goals - Array of goals to display
     */
    renderGoals: function(goals) {
        const goalsList = document.getElementById('goals-list');
        const goalsEmptyState = document.getElementById('goals-page-empty-state');
        
        if (!goalsList) return;
        
        // Clear the container
        goalsList.innerHTML = '';
        
        if (goals.length === 0) {
            // Show empty state
            if (goalsEmptyState) goalsEmptyState.style.display = 'flex';
            return;
        }
        
        // Hide empty state
        if (goalsEmptyState) goalsEmptyState.style.display = 'none';
        
        // Create goal cards
        goals.forEach(goal => {
            const currentAmount = parseFloat(goal.currentAmount);
            const targetAmount = parseFloat(goal.targetAmount);
            const progress = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
            const isComplete = Utils.isGoalComplete(currentAmount, targetAmount);
            
            // Calculate monthly amount needed to reach the goal
            const monthlyAmount = Utils.calculateMonthlyAmountForGoal(
                targetAmount,
                currentAmount,
                goal.targetDate
            );
            
            // Create goal card
            const goalCard = document.createElement('div');
            goalCard.className = 'goal-card';
            
            goalCard.innerHTML = `
                <div class="goal-card-header">
                    <div class="goal-info">
                        <h3 class="goal-card-name">${goal.name}</h3>
                        <div class="goal-card-type">${goal.type}</div>
                    </div>
                    <div class="goal-status-badge ${isComplete ? 'completed' : 'in-progress'}">
                        ${isComplete ? 'Completed' : 'In Progress'}
                    </div>
                </div>
                <div class="goal-target-date">
                    Target Date: ${Utils.formatDate(goal.targetDate)}
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
                ${!isComplete ? `
                <div class="goal-monthly-amount">
                    <span>Monthly Contribution Needed:</span>
                    <span>${Utils.formatCurrency(monthlyAmount)}</span>
                </div>
                ` : ''}
                ${goal.notes ? `
                <div class="goal-notes">
                    <p>${goal.notes}</p>
                </div>
                ` : ''}
                <div class="goal-actions">
                    <button class="btn btn-secondary update-progress" data-id="${goal.id}">
                        Update Progress
                    </button>
                    <div class="goal-management">
                        <button class="btn-icon-only edit" data-id="${goal.id}">
                            <i data-feather="edit-2"></i>
                        </button>
                        <button class="btn-icon-only delete" data-id="${goal.id}">
                            <i data-feather="trash-2"></i>
                        </button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            const updateProgressBtn = goalCard.querySelector('.update-progress');
            updateProgressBtn.addEventListener('click', () => {
                this.updateGoalProgress(goal.id);
            });
            
            const editButton = goalCard.querySelector('.edit');
            editButton.addEventListener('click', () => {
                this.editGoal(goal.id);
            });
            
            const deleteButton = goalCard.querySelector('.delete');
            deleteButton.addEventListener('click', () => {
                this.deleteGoal(goal.id);
            });
            
            goalsList.appendChild(goalCard);
        });
        
        // Initialize Feather icons
        feather.replace();
    },
    
    /**
     * Show the add goal modal
     */
    showAddGoalModal: function() {
        // Reset form
        const form = document.getElementById('goal-form');
        if (form) form.reset();
        
        // Clear hidden ID field
        const idField = document.getElementById('goal-id');
        if (idField) idField.value = '';
        
        // Set default date to 6 months from now
        const today = new Date();
        const targetDate = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
        
        const dateField = document.getElementById('goal-target-date');
        if (dateField) dateField.value = targetDate.toISOString().split('T')[0];
        
        // Update modal title
        const modalTitle = document.getElementById('goal-modal-title');
        if (modalTitle) modalTitle.textContent = 'Add Financial Goal';
        
        // Show the modal
        Utils.showModal('add-goal-modal');
    },
    
    /**
     * Edit a goal
     * @param {string} id - Goal ID
     */
    editGoal: function(id) {
        const goals = Storage.getGoals();
        const goal = goals.find(g => g.id === id);
        
        if (!goal) {
            Utils.showNotification('Goal not found', 'error');
            return;
        }
        
        // Set form values
        const form = document.getElementById('goal-form');
        const idField = document.getElementById('goal-id');
        const nameField = document.getElementById('goal-name');
        const typeField = document.getElementById('goal-type');
        const targetAmountField = document.getElementById('goal-target-amount');
        const currentAmountField = document.getElementById('goal-current-amount');
        const targetDateField = document.getElementById('goal-target-date');
        const notesField = document.getElementById('goal-notes');
        
        if (idField) idField.value = goal.id;
        if (nameField) nameField.value = goal.name;
        if (typeField) typeField.value = goal.type;
        if (targetAmountField) targetAmountField.value = goal.targetAmount;
        if (currentAmountField) currentAmountField.value = goal.currentAmount;
        if (targetDateField) targetDateField.value = goal.targetDate;
        if (notesField) notesField.value = goal.notes || '';
        
        // Update modal title
        const modalTitle = document.getElementById('goal-modal-title');
        if (modalTitle) modalTitle.textContent = 'Edit Financial Goal';
        
        // Show the modal
        Utils.showModal('add-goal-modal');
    },
    
    /**
     * Update goal progress
     * @param {string} id - Goal ID
     */
    updateGoalProgress: function(id) {
        const goals = Storage.getGoals();
        const goal = goals.find(g => g.id === id);
        
        if (!goal) {
            Utils.showNotification('Goal not found', 'error');
            return;
        }
        
        // Show prompt for new current amount
        const currentAmount = parseFloat(goal.currentAmount);
        const targetAmount = parseFloat(goal.targetAmount);
        
        const newAmount = prompt(
            `Update progress for "${goal.name}"\n\nCurrent amount: ${Utils.formatCurrency(currentAmount)}\nTarget amount: ${Utils.formatCurrency(targetAmount)}\n\nEnter new current amount:`,
            currentAmount
        );
        
        if (newAmount === null) return; // User cancelled
        
        const parsedAmount = parseFloat(newAmount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            Utils.showNotification('Please enter a valid amount', 'error');
            return;
        }
        
        // Update the goal
        goal.currentAmount = parsedAmount;
        goal.updatedAt = new Date().toISOString();
        
        Storage.saveGoal(goal);
        
        // Check if the goal is now complete
        if (Utils.isGoalComplete(parsedAmount, targetAmount)) {
            Utils.showNotification(`Congratulations! Your goal "${goal.name}" is now complete!`, 'success');
        } else {
            Utils.showNotification('Goal progress updated successfully', 'success');
        }
        
        this.refresh();
        
        // Refresh dashboard if it's visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
    },
    
    /**
     * Delete a goal
     * @param {string} id - Goal ID
     */
    deleteGoal: function(id) {
        Utils.showConfirmation(
            'Are you sure you want to delete this goal? This action cannot be undone.',
            () => {
                Storage.deleteGoal(id);
                Utils.showNotification('Goal deleted successfully', 'success');
                this.refresh();
                
                // Refresh dashboard if it's visible
                if (document.getElementById('dashboard-page').classList.contains('active')) {
                    Dashboard.refresh();
                }
            },
            'Delete Goal'
        );
    },
    
    /**
     * Save a goal (new or edited)
     */
    saveGoal: function() {
        const idField = document.getElementById('goal-id');
        const nameField = document.getElementById('goal-name');
        const typeField = document.getElementById('goal-type');
        const targetAmountField = document.getElementById('goal-target-amount');
        const currentAmountField = document.getElementById('goal-current-amount');
        const targetDateField = document.getElementById('goal-target-date');
        const notesField = document.getElementById('goal-notes');
        
        // Validate fields
        if (!nameField.value || !typeField.value || !targetAmountField.value || !targetDateField.value) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        const targetAmount = parseFloat(targetAmountField.value);
        if (isNaN(targetAmount) || targetAmount <= 0) {
            Utils.showNotification('Please enter a valid target amount', 'error');
            return;
        }
        
        const currentAmount = parseFloat(currentAmountField.value || 0);
        if (isNaN(currentAmount) || currentAmount < 0) {
            Utils.showNotification('Please enter a valid current amount', 'error');
            return;
        }
        
        const targetDate = new Date(targetDateField.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (targetDate < today) {
            Utils.showNotification('Target date cannot be in the past', 'error');
            return;
        }
        
        const isEditing = idField.value !== '';
        
        // Create goal object
        const goal = {
            id: isEditing ? idField.value : Utils.generateId(),
            name: nameField.value,
            type: typeField.value,
            targetAmount: targetAmount,
            currentAmount: currentAmount,
            targetDate: targetDateField.value,
            notes: notesField.value,
            createdAt: isEditing ? undefined : new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Save the goal
        Storage.saveGoal(goal);
        
        // Show success message
        Utils.showNotification(
            isEditing ? 'Goal updated successfully' : 'Goal added successfully',
            'success'
        );
        
        // Hide the modal
        Utils.hideModal('add-goal-modal');
        
        // Refresh the goals
        this.refresh();
        
        // Refresh dashboard if it's visible
        if (document.getElementById('dashboard-page').classList.contains('active')) {
            Dashboard.refresh();
        }
    }
};
