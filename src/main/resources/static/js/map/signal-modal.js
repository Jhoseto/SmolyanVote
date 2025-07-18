// ===== SIGNAL MODAL JAVASCRIPT =====

// Global variable to store current signal
let currentModalSignal = null;

// ===== MODAL OPENING FUNCTION =====
function openSignalModal(signalData) {
    // Handle both signal object and signal ID
    const signal = typeof signalData === 'object' ? signalData : findSignalById(signalData);

    if (!signal) {
        console.error('Signal not found:', signalData);
        return;
    }

    currentModalSignal = signal;
    populateModalContent(signal);
    showModal();
}

// ===== FIND SIGNAL BY ID =====
function findSignalById(signalId) {
    // Try to find signal in currentSignals array from main app
    if (typeof currentSignals !== 'undefined') {
        return currentSignals.find(s => s.id == signalId);
    }

    // If currentSignals is not available, try to find in SAMPLE_SIGNALS
    if (typeof SAMPLE_SIGNALS !== 'undefined') {
        return SAMPLE_SIGNALS.find(s => s.id == signalId);
    }

    return null;
}

// ===== POPULATE MODAL CONTENT =====
function populateModalContent(signal) {
    const category = SIGNAL_CATEGORIES[signal.category];
    const urgency = URGENCY_LEVELS[signal.urgency];

    // Update header badges
    updateCategoryBadge(category);
    updateUrgencyBadge(signal.urgency, urgency);

    // Update signal title and meta info
    document.getElementById('modalSignalTitle').textContent = signal.title;
    document.getElementById('modalSignalId').textContent = `#${signal.id.toString().padStart(4, '0')}`;
    document.getElementById('modalSignalDate').textContent = formatDate(signal.createdAt);

    // Update description
    document.getElementById('modalSignalDescription').textContent = signal.description;

    // Update full date
    document.getElementById('modalFullDate').textContent = formatFullDate(signal.createdAt);
}

// ===== UPDATE CATEGORY BADGE =====
function updateCategoryBadge(category) {
    const categoryBadge = document.getElementById('modalCategoryBadge');
    const categoryIcon = document.getElementById('modalCategoryIcon');
    const categoryName = document.getElementById('modalCategoryName');

    categoryIcon.className = `bi ${category.icon}`;
    categoryName.textContent = category.name;

    // Add some visual styling based on category
    categoryBadge.style.background = `rgba(255, 255, 255, 0.2)`;
    categoryBadge.style.borderColor = 'rgba(255, 255, 255, 0.3)';
}

// ===== UPDATE URGENCY BADGE =====
function updateUrgencyBadge(urgencyLevel, urgency) {
    const urgencyBadge = document.getElementById('modalUrgencyBadge');
    const urgencyIcon = document.getElementById('modalUrgencyIcon');
    const urgencyName = document.getElementById('modalUrgencyName');

    urgencyIcon.className = `bi ${urgency.icon}`;
    urgencyName.textContent = urgency.name;

    // Remove existing urgency classes
    urgencyBadge.classList.remove('urgency-high', 'urgency-medium', 'urgency-low');

    // Add current urgency class
    urgencyBadge.classList.add(`urgency-${urgencyLevel}`);
}

// ===== SHOW MODAL =====
function showModal() {
    const modal = document.getElementById('signalModal');

    // Add modal to page if not already present
    if (!modal) {
        console.error('Signal modal element not found in DOM');
        return;
    }

    modal.style.display = 'flex';

    // Trigger animation after a small delay
    setTimeout(() => {
        modal.classList.add('active');
    }, 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey);
}

// ===== CLOSE MODAL =====
function closeSignalModal() {
    const modal = document.getElementById('signalModal');

    if (!modal) return;

    modal.classList.remove('active');

    // Hide modal after animation completes
    setTimeout(() => {
        modal.style.display = 'none';
    }, 400);

    // Restore body scroll
    document.body.style.overflow = '';

    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);

    // Clear current signal
    currentModalSignal = null;
}

// ===== HANDLE ESCAPE KEY =====
function handleEscapeKey(event) {
    if (event.key === 'Escape') {
        closeSignalModal();
    }
}

// ===== CENTER MAP ON SIGNAL =====
function centerMapOnSignal() {
    if (!currentModalSignal) {
        console.error('No current signal to center on');
        return;
    }

    // Check if map is available (from main app)
    if (typeof map !== 'undefined' && map) {
        // Use maximum zoom (18) and center perfectly
        map.setView(currentModalSignal.coordinates, 18, {
            animate: true,
            duration: 1.0
        });

        // Close modal after a short delay to see the animation
        setTimeout(() => {
            closeSignalModal();
        }, 800);

        // Show notification if function is available
        if (typeof showNotification === 'function') {
            showNotification('Картата е центрирана към сигнала', 'success');
        }
    } else {
        console.error('Map object not available');
    }
}

// ===== DATE FORMATTING FUNCTIONS =====
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatFullDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== MODAL INITIALIZATION =====
function initializeSignalModal() {
    // Add modal HTML to page if not present
    if (!document.getElementById('signalModal')) {
        // This would be handled by including the HTML fragment
        console.warn('Signal modal HTML not found. Make sure to include signal-modal.html');
    }

    // Add click listener to modal overlay for closing
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeSignalModal);
    }

    // Add click listener to close button
    const closeBtn = document.querySelector('.modal-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSignalModal);
    }

    console.log('Signal modal initialized');
}

// ===== AUTO-INITIALIZE WHEN DOM IS READY =====
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSignalModal);
} else {
    initializeSignalModal();
}

// ===== MAKE FUNCTIONS GLOBALLY AVAILABLE =====
window.openSignalModal = openSignalModal;
window.closeSignalModal = closeSignalModal;
window.centerMapOnSignal = centerMapOnSignal;