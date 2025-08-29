// Import Firebase modules
import { db, collection, addDoc, Timestamp } from './firebase-config.js';

// Ratings storage object
let ratings = {
    menu_ease: 0,
    menu_clarity: 0,
    menu_speed: 0,
    food_quality: 0,
    ambience: 0,
    pricing: 0,
    service: 0
};

// Initialize star ratings when DOM loads
document.addEventListener('DOMContentLoaded', function() {
    initializeStarRatings();
    setupFormSubmission();
});

function initializeStarRatings() {
    const starRatings = document.querySelectorAll('.star-rating');
    
    starRatings.forEach(rating => {
        const stars = rating.querySelectorAll('i');
        const ratingName = rating.dataset.rating;
        
        stars.forEach((star, index) => {
            // Click event for rating selection
            star.addEventListener('click', () => {
                const value = index + 1;
                ratings[ratingName] = value;
                updateStarDisplay(rating, value);
                
                // Add haptic feedback on mobile
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
            });
            
            // Hover effect for better UX
            star.addEventListener('mouseenter', () => {
                highlightStars(rating, index + 1);
            });
        });
        
        // Reset to actual rating when mouse leaves
        rating.addEventListener('mouseleave', () => {
            updateStarDisplay(rating, ratings[ratingName]);
        });
    });
}

function highlightStars(ratingElement, count) {
    const stars = ratingElement.querySelectorAll('i');
    stars.forEach((star, index) => {
        if (index < count) {
            star.className = 'fas fa-star';
            star.style.color = '#f39c12';
            star.style.transform = 'scale(1.1)';
        } else {
            star.className = 'far fa-star';
            star.style.color = '#ddd';
            star.style.transform = 'scale(1)';
        }
    });
}

function updateStarDisplay(ratingElement, count) {
    const stars = ratingElement.querySelectorAll('i');
    stars.forEach((star, index) => {
        if (index < count) {
            star.className = 'fas fa-star active';
            star.style.color = '#f39c12';
            star.style.transform = 'scale(1)';
        } else {
            star.className = 'far fa-star';
            star.style.color = '#ddd';
            star.style.transform = 'scale(1)';
        }
    });
}

function setupFormSubmission() {
    const form = document.getElementById('feedbackForm');
    const submitBtn = form.querySelector('.submit-btn');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Validate that at least some ratings are provided
        const hasRatings = Object.values(ratings).some(rating => rating > 0);
        if (!hasRatings) {
            showAlert('Please provide at least one rating before submitting.', 'warning');
            return;
        }
        
        // Disable submit button and show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
        document.getElementById('loadingSpinner').classList.remove('hidden');
        
        try {
            await submitFeedback();
            showThankYou();
        } catch (error) {
            console.error('Error submitting feedback:', error);
            showAlert('There was an error submitting your feedback. Please try again.', 'error');
            
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Feedback';
            document.getElementById('loadingSpinner').classList.add('hidden');
        }
    });
}

async function submitFeedback() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    
    // Validate phone number if provided
    if (customerPhone && !isValidPhone(customerPhone)) {
        throw new Error('Please enter a valid mobile number');
    }
    
    const feedbackData = {
        timestamp: Timestamp.now(),
        date: new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }),
        time: new Date().toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }),
        ratings: {
            menuExperience: {
                ease: ratings.menu_ease,
                clarity: ratings.menu_clarity,
                speed: ratings.menu_speed
            },
            restaurantExperience: {
                foodQuality: ratings.food_quality,
                ambience: ratings.ambience,
                pricing: ratings.pricing,
                service: ratings.service
            }
        },
        customerInfo: {
            name: customerName || 'Anonymous',
            phone: customerPhone || 'Not provided'
        },
        overallScores: {
            menuAverage: calculateAverage([ratings.menu_ease, ratings.menu_clarity, ratings.menu_speed]),
            restaurantAverage: calculateAverage([ratings.food_quality, ratings.ambience, ratings.pricing, ratings.service])
        },
        deviceInfo: {
            userAgent: navigator.userAgent,
            timestamp: Date.now()
        }
    };
    
    // Add to Firestore collection 'restaurant_feedback'
    await addDoc(collection(db, 'restaurant_feedback'), feedbackData);
}

function calculateAverage(scores) {
    const validScores = scores.filter(score => score > 0);
    if (validScores.length === 0) return 0;
    return parseFloat((validScores.reduce((sum, score) => sum + score, 0) / validScores.length).toFixed(1));
}

function isValidPhone(phone) {
    // Indian mobile number validation (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

function showAlert(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button class="alert-close">&times;</button>
    `;
    
    // Add to page
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
    
    // Close button functionality
    alert.querySelector('.alert-close').addEventListener('click', () => {
        alert.remove();
    });
}

function showThankYou() {
    document.getElementById('loadingSpinner').classList.add('hidden');
    document.querySelector('.feedback-form').classList.add('hidden');
    document.getElementById('thankYouMessage').classList.remove('hidden');
    
    // Confetti effect (simple)
    createConfetti();
    
    // Auto redirect or reset after 5 seconds
    setTimeout(() => {
        if (confirm('Would you like to submit another feedback?')) {
            location.reload();
        }
    }, 5000);
}

function createConfetti() {
    // Simple confetti effect
    const colors = ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
    const confettiContainer = document.createElement('div');
    confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
    `;
    
    document.body.appendChild(confettiContainer);
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.cssText = `
            position: absolute;
            width: 8px;
            height: 8px;
            background: ${colors[Math.floor(Math.random() * colors.length)]};
            left: ${Math.random() * 100}%;
            animation: confetti-fall 3s linear forwards;
            opacity: 0;
        `;
        confettiContainer.appendChild(confetti);
        
        setTimeout(() => {
            confetti.style.opacity = '1';
        }, Math.random() * 1000);
    }
    
    // Remove confetti after animation
    setTimeout(() => {
        confettiContainer.remove();
    }, 3000);
}

// Add confetti animation CSS
const confettiStyle = document.createElement('style');
confettiStyle.textContent = `
    @keyframes confetti-fall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
    
    .alert {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
        animation: slideIn 0.3s ease;
    }
    
    .alert-error {
        background: #e74c3c;
    }
    
    .alert-warning {
        background: #f39c12;
    }
    
    .alert-info {
        background: #3498db;
    }
    
    .alert-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(confettiStyle);
