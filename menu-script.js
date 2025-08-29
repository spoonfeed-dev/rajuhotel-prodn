import { db } from './firebase-config.js';
import { collection, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

class CustomerMenu {
    constructor() {
        this.restaurantId = 'restaurant_1';
        this.menuRef = collection(db, `restaurants/${this.restaurantId}/menu_items`);
        this.categoriesRef = collection(db, `restaurants/${this.restaurantId}/categories`);
        this.customTagsRef = collection(db, `restaurants/${this.restaurantId}/custom_tags`);
        this.menuItems = {};
        this.customCategories = [];
        this.customTags = [];
        this.defaultCategories = ['starters', 'mains (veg)', 'desserts', 'beverages'];
        this.searchTerm = '';
        this.activeFilter = 'all';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadCustomCategories();
        this.loadCustomTags();
        this.loadMenuItems();
    }

    setupEventListeners() {
        // Search Input
        const searchInput = document.getElementById('menu-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value.toLowerCase();
                this.displayMenuItems();
                this.showSearchSuggestions();
            });
        }

        // Modal Close
        const closeModal = document.querySelector('.close-modal');
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                document.getElementById('item-modal').classList.remove('active');
            });
        }

        const itemModal = document.getElementById('item-modal');
        if (itemModal) {
            itemModal.addEventListener('click', (e) => {
                if (e.target === itemModal) {
                    itemModal.classList.remove('active');
                }
            });
        }

        // Filter Buttons - Set up initial ones, more will be added dynamically
        this.setupFilterButtons();

        // Theme Toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-mode');
                const icon = themeToggle.querySelector('i');
                if (icon) {
                    icon.classList.toggle('fa-moon');
                    icon.classList.toggle('fa-sun');
                }
            });
        }

        // Setup scroll progress after DOM is loaded
        setTimeout(() => {
            this.setupScrollProgress();
        }, 100);
    }

    setupFilterButtons() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilter = btn.dataset.filter;
                this.displayMenuItems();
                this.displayRecommendations();
            });
        });
    }

    setupLazyLoading() {
        // Use a slight delay to ensure images are in DOM
        setTimeout(() => {
            const images = document.querySelectorAll('.lazy-load:not([data-observed])');
            if (images.length === 0) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        // For images that already have src, just add loaded class
                        if (img.src && !img.src.includes('placeholder')) {
                            img.classList.add('loaded');
                        }
                        // Mark as observed to prevent re-observing
                        img.setAttribute('data-observed', 'true');
                        observer.unobserve(img);
                    }
                });
            }, { rootMargin: '100px' });

            images.forEach(img => {
                observer.observe(img);
            });
        }, 100);
    }

    setupScrollProgress() {
        const progressBar = document.querySelector('.scroll-progress');
        if (!progressBar) return;

        window.addEventListener('scroll', () => {
            const winScroll = document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
            progressBar.style.width = `${scrolled}%`;
        });
    }

    loadCustomTags() {
        onSnapshot(this.customTagsRef, (snapshot) => {
            this.customTags = [];
            snapshot.forEach(doc => {
                this.customTags.push({ id: doc.id, ...doc.data() });
            });
            console.log('🏷️ Loaded custom tags for customer menu:', this.customTags);
            this.addTagFilters();
            this.displayMenuItems();
        }, (error) => {
            console.error('Error loading custom tags:', error);
        });
    }

    loadCustomCategories() {
        onSnapshot(this.categoriesRef, (snapshot) => {
            this.customCategories = [];
            snapshot.forEach(doc => {
                this.customCategories.push(doc.data().name);
            });
            console.log('📂 Loaded custom categories:', this.customCategories);
            this.displayCategories();
        }, (error) => {
            console.error('Error loading categories:', error);
        });
    }

    loadMenuItems() {
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.style.display = 'flex';
        }
        
        onSnapshot(this.menuRef, (snapshot) => {
            this.menuItems = {};
            console.log('📥 Loading menu items...');
            
            snapshot.forEach(doc => {
                const item = { id: doc.id, ...doc.data() };
                console.log('📄 Processing item:', item.name, item);
                
                // Only include available items
                if (item.available !== false) {
                    const category = item.category || 'uncategorized';
                    if (!this.menuItems[category]) {
                        this.menuItems[category] = [];
                    }
                    this.menuItems[category].push(item);
                }
            });

            console.log('🍽️ Final menu items structure:', this.menuItems);
            console.log('📊 Total categories:', Object.keys(this.menuItems).length);
            
            // Display items
            this.displayRecommendations();
            this.displayMenuItems();
            this.displayCategories();
            
            if (loadingState) {
                loadingState.style.display = 'none';
            }
        }, (error) => {
            console.error('❌ Error loading menu:', error);
            if (loadingState) {
                loadingState.style.display = 'none';
            }
            const noResults = document.getElementById('no-results');
            if (noResults) {
                noResults.style.display = 'block';
                noResults.innerHTML = '<p>Error loading menu items. Please try again later.</p>';
            }
        });
    }

    addTagFilters() {
        const filterScroll = document.getElementById('filter-scroll');
        if (!filterScroll) return;

        // Remove existing custom tag buttons to prevent duplicates
        filterScroll.querySelectorAll('.filter-btn[data-custom-tag]').forEach(btn => btn.remove());

        this.customTags.forEach(tag => {
            const btn = document.createElement('button');
            btn.classList.add('filter-btn');
            btn.dataset.filter = tag.id;
            btn.dataset.customTag = 'true';
            btn.textContent = tag.name;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.activeFilter = tag.id;
                this.displayMenuItems();
                this.displayRecommendations();
            });
            filterScroll.appendChild(btn);
        });
    }

    displayCategories() {
        const scroll = document.getElementById('category-scroll');
        if (!scroll) return;

        scroll.innerHTML = '';
        
        // Combine available categories from menu items with custom categories
        const availableCategories = new Set([
            ...Object.keys(this.menuItems),
            ...this.customCategories
        ]);
        
        const allCategories = [
            ...this.defaultCategories.filter(cat => availableCategories.has(cat)),
            ...Array.from(availableCategories).filter(cat => !this.defaultCategories.includes(cat))
        ];
        
        console.log('🏷️ Displaying categories:', allCategories);
        
        allCategories.forEach(category => {
            const btn = document.createElement('button');
            btn.classList.add('category-btn');
            btn.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const section = document.getElementById(category);
                if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start'});
                }
            });
            scroll.appendChild(btn);
        });
    }

    displayRecommendations() {
        const itemsContainer = document.getElementById('recommended-items');
        if (!itemsContainer) return;

        const recommendations = Object.values(this.menuItems).flat()
            .filter(item => this.applyFilter(item))
            .filter(item => item.recommended || item.bestSeller || item.newItem || 
                           item.isRecommended || item.isBestseller || item.isNew ||
                           (item.customTags && item.customTags.length > 0) ||
                           (item.tags && item.tags.length > 0))
            .slice(0, 5);
        
        console.log('⭐ Found recommendations:', recommendations.length);
        
        itemsContainer.innerHTML = '';
        
        recommendations.forEach(item => {
            const div = document.createElement('div');
            div.classList.add('recommended-item');
            div.innerHTML = `
                <img src="${item.imageUrl || 'https://via.placeholder.com/180x120?text=No+Image'}" alt="${item.name}" class="lazy-load">
                <div class="recommended-item-content">
                    <p>${item.name}</p>
                    ${this.generateBadgesHTML(item)}
                    <div class="item-price-list">₹${this.getItemPrice(item)}</div>
                </div>
            `;
            div.addEventListener('click', () => this.openItemModal(item));
            itemsContainer.appendChild(div);
        });

        // Setup lazy loading for recommendation images
        this.setupLazyLoading();
    }

    generateItemHTML(item) {
        const plateSizeOptions = this.generatePlateSizeOptions(item.plateSizes || item.price);
        
        return `
            <div class="menu-item-list-entry ${item.priority > 7 ? 'high-priority' : ''}" onclick="customerMenu.showItemModal('${item.id}')">
                ${item.imageUrl ? 
                    `<img src="${item.imageUrl}" alt="${item.name}" class="item-image-list lazy-load">` : 
                    '<div class="item-image-list" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center; color: #ccc;">🍽️</div>'
                }
                <div class="item-content-list">
                    <div class="item-header">
                        <h3 class="item-name-list">${item.name}</h3>
                        ${this.getVegNonVegIcon(item)}
                        ${this.generateBadgesHTML(item)}
                    </div>
                    <p class="item-description-list">${item.description || 'Delicious dish prepared with care'}</p>
                    <div class="plate-sizes">
                        ${plateSizeOptions}
                    </div>
                </div>
            </div>
        `;
    }

    showItemModal(itemId) {
        const item = this.findItemById(itemId);
        if (!item) {
            console.error('Item not found:', itemId);
            return;
        }

        const modal = document.getElementById('item-modal');
        const modalName = document.getElementById('modal-name');
        const modalDescription = document.getElementById('modal-description');
        const modalImage = document.getElementById('modal-image');
        const modalBadges = document.getElementById('modal-badges');
        const modalServes = document.getElementById('modal-serves');
        const modalNutritional = document.getElementById('modal-nutritional');
        const modalPriceHalf = document.getElementById('modal-price-half');
        const modalPriceFull = document.getElementById('modal-price-full');
        
        // Set basic info
        if (modalName) modalName.textContent = item.name;
        if (modalDescription) modalDescription.textContent = item.description || 'Delicious dish prepared with care';
        if (modalBadges) modalBadges.innerHTML = this.generateBadgesHTML(item);
        if (modalServes) modalServes.textContent = item.serves || '1';
        if (modalNutritional) modalNutritional.textContent = item.nutritionalInfo || 'Images shown are for illustration only; actual dish may vary.';
        
        // Set image
        if (modalImage) {
            if (item.imageUrl) {
                modalImage.src = item.imageUrl;
                modalImage.style.display = 'block';
            } else {
                modalImage.style.display = 'none';
            }
        }
        
        // Set prices
        if (modalPriceHalf) {
            modalPriceHalf.textContent = item.priceHalf ? `₹${item.priceHalf}` : 
                                        (item.plateSizes && item.plateSizes.half && item.plateSizes.half.price) ? 
                                        `₹${item.plateSizes.half.price}` : 'N/A';
        }
        
        if (modalPriceFull) {
            modalPriceFull.textContent = item.priceFull ? `₹${item.priceFull}` : 
                                        item.price ? `₹${item.price}` :
                                        (item.plateSizes && item.plateSizes.full && item.plateSizes.full.price) ? 
                                        `₹${item.plateSizes.full.price}` : 'N/A';
        }
        
        // Handle price options container (if exists)
        const priceOptionsContainer = document.querySelector('.price-options');
        if (priceOptionsContainer && !modalPriceHalf && !modalPriceFull) {
            priceOptionsContainer.innerHTML = this.generateModalPriceOptions(item.plateSizes || item.price);
        }
        
        if (modal) {
            modal.classList.add('active');
        }
    }

    // Helper method to find item by ID
    findItemById(itemId) {
        for (const category in this.menuItems) {
            const item = this.menuItems[category].find(item => item.id === itemId);
            if (item) return item;
        }
        return null;
    }

    // Helper method to get item price for display
    getItemPrice(item) {
        if (item.price) return item.price;
        if (item.priceFull) return item.priceFull;
        if (item.plateSizes) {
            if (item.plateSizes.full && item.plateSizes.full.price) return item.plateSizes.full.price;
            if (item.plateSizes.half && item.plateSizes.half.price) return item.plateSizes.half.price;
        }
        return 'N/A';
    }

    // Helper method to generate plate size options
    generatePlateSizeOptions(plateSizes) {
        if (typeof plateSizes === 'number') {
            // Legacy single price support
            return `<span class="item-price-list">₹${plateSizes}</span>`;
        }

        if (!plateSizes || typeof plateSizes !== 'object') {
            return '<span class="item-price-list" style="color: #999;">Price not available</span>';
        }

        const options = [];
        if (plateSizes.half && plateSizes.half.available) {
            options.push(`<div class="plate-option"><span>Half Plate:</span> <strong>₹${plateSizes.half.price}</strong></div>`);
        }
        if (plateSizes.full && plateSizes.full.available) {
            options.push(`<div class="plate-option"><span>Full Plate:</span> <strong>₹${plateSizes.full.price}</strong></div>`);
        }

        return options.length > 0 ? options.join('') : '<span class="item-price-list" style="color: #999;">No sizes available</span>';
    }

    // Generate modal price options
    generateModalPriceOptions(plateSizes) {
        if (typeof plateSizes === 'number') {
            return `<div class="price-option"><span>Price:</span> <strong>₹${plateSizes}</strong></div>`;
        }

        if (!plateSizes || typeof plateSizes !== 'object') {
            return '<div class="price-option"><span>Price not available</span></div>';
        }

        const options = [];
        if (plateSizes.half && plateSizes.half.available) {
            options.push(`<div class="price-option"><span>Half Plate:</span> <strong>₹${plateSizes.half.price}</strong></div>`);
        }
        if (plateSizes.full && plateSizes.full.available) {
            options.push(`<div class="price-option"><span>Full Plate:</span> <strong>₹${plateSizes.full.price}</strong></div>`);
        }

        return options.length > 0 ? options.join('') : '<div class="price-option">No sizes available</div>';
    }

    // Generate badges HTML with support for various badge types
    generateBadgesHTML(item) {
        const badges = [];
        
        // Handle different badge property names
        if (item.recommended || item.isRecommended) badges.push('<span class="badge chef-special">Recommended</span>');
        if (item.bestSeller || item.bestseller || item.isBestseller) badges.push('<span class="badge bestseller">Bestseller</span>');
        if (item.newItem || item.isNew) badges.push('<span class="badge new-item">✨ New</span>');
        if (item.isSpicy || item.spicy) badges.push('<span class="badge spicy">Spicy</span>');
        
        // Handle vegetarian status
        if (item.vegetarian === true || item.isVegetarian) badges.push('<span class="badge veg">Veg</span>');
        else if (item.vegetarian === false || item.isNonVegetarian) badges.push('<span class="badge non-veg">Non-Veg</span>');
        
        // Handle tags array
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => {
                badges.push(`<span class="badge ${tag}" data-filter="${tag}">${tag.charAt(0).toUpperCase() + tag.slice(1)}</span>`);
            });
        }

        // Handle custom tags
        if (item.customTags && Array.isArray(item.customTags)) {
            item.customTags.forEach(tagId => {
                const customTag = this.customTags.find(tag => tag.id === tagId);
                if (customTag) {
                    badges.push(`<span class="badge custom-tag" data-filter="${tagId}">${customTag.name}</span>`);
                }
            });
        }

        return badges.length > 0 ? `<div class="item-badges">${badges.join('')}</div>` : '';
    }

    // Apply filters to items
    applyFilter(item) {
        if (this.activeFilter === 'all') return true;
        
        // Handle standard filters
        if (this.activeFilter === 'veg') return item.vegetarian === true || item.isVegetarian;
        if (this.activeFilter === 'non-veg') return item.vegetarian === false || item.isNonVegetarian;
        if (this.activeFilter === 'spicy') return item.isSpicy || item.spicy;
        if (this.activeFilter === 'mildSpicy') return item.isMildSpicy || item.mildSpicy;
        if (this.activeFilter === 'sweet') return item.isSweet || item.sweet;
        if (this.activeFilter === 'refreshing') return item.isRefreshing || item.refreshing;
        if (this.activeFilter === 'cold') return item.isCold || item.cold;
        if (this.activeFilter === 'hot') return item.isHot || item.hot;
        if (this.activeFilter === 'recommended') return item.recommended || item.isRecommended;
        if (this.activeFilter === 'bestseller') return item.bestSeller || item.bestseller || item.isBestseller;
        if (this.activeFilter === 'new') return item.newItem || item.isNew;
        
        // Handle tag filters
        if (item.tags && Array.isArray(item.tags) && item.tags.includes(this.activeFilter)) return true;
        
        // Handle custom tag filters
        if (item.customTags && Array.isArray(item.customTags) && item.customTags.includes(this.activeFilter)) return true;
        
        return false;
    }

    // Get filtered categories based on search and filters
    getFilteredCategories() {
        const filtered = {};
        
        Object.keys(this.menuItems).forEach(category => {
            const items = this.menuItems[category].filter(item => {
                // Apply search filter
                if (this.searchTerm) {
                    const searchMatch = item.name.toLowerCase().includes(this.searchTerm) ||
                                      (item.description && item.description.toLowerCase().includes(this.searchTerm));
                    if (!searchMatch) return false;
                }
                
                // Apply other filters
                return this.applyFilter(item);
            });
            
            if (items.length > 0) {
                filtered[category] = items;
            }
        });
        
        return filtered;
    }

    // Display menu items in the main container - FIXED TO USE menu-content
    displayMenuItems() {
        const menuContainer = document.getElementById('menu-content'); // Changed from menu-container to menu-content
        if (!menuContainer) {
            console.error('Menu content container not found');
            return;
        }

        const filteredCategories = this.getFilteredCategories();
        console.log('📋 Displaying filtered categories:', Object.keys(filteredCategories));

        if (Object.keys(filteredCategories).length === 0) {
            const noResults = document.getElementById('no-results');
            if (noResults) {
                noResults.style.display = 'block';
            }
            menuContainer.innerHTML = '<div class="no-items">No menu items found matching your criteria.</div>';
            return;
        } else {
            const noResults = document.getElementById('no-results');
            if (noResults) {
                noResults.style.display = 'none';
            }
        }

        let html = '';
        Object.keys(filteredCategories).forEach(category => {
            const items = filteredCategories[category];
            
            html += `
                <div class="menu-section" id="${category}">
                    <h2 class="section-title">${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
                    <div class="items-list">
                        ${items.map(item => this.generateItemHTML(item)).join('')}
                    </div>
                </div>
            `;
        });

        menuContainer.innerHTML = html;
        
        // Setup lazy loading for the newly added images
        this.setupLazyLoading();
    }

    // Get veg/non-veg icon
    getVegNonVegIcon(item) {
        if (item.vegetarian === true || item.isVegetarian) {
            return '<span class="veg-nonveg-icon veg">🟢</span>';
        } else if (item.vegetarian === false || item.isNonVegetarian) {
            return '<span class="veg-nonveg-icon nonveg">🔴</span>';
        }
        return '';
    }

    // Open item modal (alternative method name for compatibility)
    openItemModal(item) {
        this.showItemModal(item.id);
    }

    // Show search suggestions
    showSearchSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;

        suggestionsContainer.innerHTML = '';
        
        if (this.searchTerm.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        const suggestions = Object.values(this.menuItems).flat()
            .filter(item => 
                this.applyFilter(item) &&
                (item.name.toLowerCase().includes(this.searchTerm) ||
                (item.description && item.description.toLowerCase().includes(this.searchTerm)))
            )
            .slice(0, 5);

        if (suggestions.length > 0) {
            suggestionsContainer.style.display = 'block';
            suggestions.forEach(item => {
                const div = document.createElement('div');
                div.classList.add('suggestion-item');
                div.innerHTML = `
                    <img src="${item.imageUrl || 'https://via.placeholder.com/40x40?text=No+Image'}" alt="${item.name}" class="lazy-load">
                    <div class="suggestion-content">
                        <p>${item.name}</p>
                        ${this.generateBadgesHTML(item)}
                    </div>
                `;
                div.addEventListener('click', () => {
                    const searchInput = document.getElementById('menu-search');
                    if (searchInput) {
                        searchInput.value = item.name;
                        this.searchTerm = item.name.toLowerCase();
                        this.displayMenuItems();
                        suggestionsContainer.style.display = 'none';
                    }
                });
                suggestionsContainer.appendChild(div);
            });
        } else {
            suggestionsContainer.style.display = 'none';
        }
    }
}

// Initialize the menu when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const customerMenu = new CustomerMenu();
    window.customerMenu = customerMenu;
    console.log('🍽️ Premium customer menu with custom tags and filters loaded!');
});

// Fallback initialization if DOMContentLoaded has already fired
if (document.readyState === 'loading') {
    // Do nothing, DOMContentLoaded will fire
} else {
    // DOM is already loaded
    const customerMenu = new CustomerMenu();
    window.customerMenu = customerMenu;
    console.log('🍽️ Premium customer menu with custom tags and filters loaded!');
}