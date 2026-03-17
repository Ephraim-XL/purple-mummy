// storefront.js

document.addEventListener('DOMContentLoaded', () => {
    let cart = [];

    // Elements
    const productGrid = document.getElementById('product-grid');
    const heroSection = document.getElementById('hero-section');
    const cartCountEl = document.getElementById('cart-count');

    // Render Hero Section
    function renderHero() {
        if (!heroSection) return;
        heroSection.innerHTML = `
            <div class="hero-content">
                <h1 class="brand-font">Unveil Your Signature Scent</h1>
                <p>Luxurious, artisanal, and unforgettable oil perfumes crafted for the elegant soul.</p>
                <a href="#shop" class="btn btn-primary">Discover the Collection</a>
            </div>
        `;
    }

    // Price Multipliers based on Size
    const sizeMultipliers = {
        '6ml': 1,
        '10ml': 1.5,
        '15ml': 2,
        '30ml': 3.5
    };

    window.updatePriceDisplay = function(productId, basePrice) {
        const selectEl = document.getElementById(`size-${productId}`);
        const priceEl = document.getElementById(`price-${productId}`);
        if (selectEl && priceEl) {
            const multiplier = sizeMultipliers[selectEl.value] || 1;
            const newPrice = basePrice * multiplier;
            priceEl.textContent = `$${newPrice.toFixed(2)}`;
        }
    };

    // Render Products
    function renderProducts() {
        if (!productGrid) return;
        const products = getProducts();
        
        if (products.length === 0) {
            productGrid.innerHTML = '<p>No products available at the moment.</p>';
            return;
        }

        productGrid.innerHTML = products.map(product => {
            const isSoldOut = product.status === 'Sold Out';
            const btnClass = isSoldOut ? 'btn-secondary disabled' : 'btn-primary';
            const btnText = isSoldOut ? 'Sold Out' : 'Add to Bag';
            const ribbon = isSoldOut ? `<div class="ribbon badge-sold-out">Sold Out</div>` : '';

            return `
                <div class="product-card">
                    ${ribbon}
                    <div class="product-image-wrapper">
                        <img src="${product.imageUrl || 'https://via.placeholder.com/400x400?text=Perfume'}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="product-info">
                        <h3 class="product-name brand-font">${product.name}</h3>
                        <p class="product-desc">${product.description}</p>
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label for="size-${product.id}" style="font-size: 0.8rem; color: var(--color-text-light);">Select Size:</label>
                            <select id="size-${product.id}" class="form-control" onchange="updatePriceDisplay('${product.id}', ${product.price})" style="padding: 0.5rem;" ${isSoldOut ? 'disabled' : ''}>
                                <option value="6ml">6ml</option>
                                <option value="10ml">10ml</option>
                                <option value="15ml">15ml</option>
                                <option value="30ml">30ml</option>
                            </select>
                        </div>

                        <div class="product-meta flex justify-between items-center">
                            <span class="product-price" id="price-${product.id}">$${product.price.toFixed(2)}</span>
                            <button class="btn ${btnClass}" onclick="addToCart('${product.id}', ${product.price})" ${isSoldOut ? 'disabled' : ''}>
                                ${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Cart Logic
    function loadCartStorefront() {
        const storedCart = localStorage.getItem('pm_cart');
        if (storedCart) {
            try { return JSON.parse(storedCart); } 
            catch (e) { return []; }
        }
        return [];
    }

    function saveCartStorefront(newCart) {
        localStorage.setItem('pm_cart', JSON.stringify(newCart));
    }

    window.addToCart = function(productId, basePrice) {
        const products = getProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product || product.status === 'Sold Out') return;

        // Get selected size and updated price
        const selectEl = document.getElementById(`size-${productId}`);
        const selectedSize = selectEl ? selectEl.value : '6ml';
        const multiplier = sizeMultipliers[selectedSize] || 1;
        const actualPrice = basePrice * multiplier;

        // Composite ID
        const cartItemId = `${productId}_${selectedSize}`;

        let cartData = loadCartStorefront();
        const cartItem = cartData.find(item => item.cartId === cartItemId);
        
        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cartData.push({ 
                ...product, 
                cartId: cartItemId, 
                size: selectedSize, 
                price: actualPrice, // Override base price with selected size price
                quantity: 1 
            });
        }
        
        saveCartStorefront(cartData);
        updateCartCountUI(cartData);
        showToast(`Added ${product.name} (${selectedSize}) to bag`);
    };

    function updateCartCountUI(cartData) {
        if (!cartCountEl) return;
        const total = cartData.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = total;
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Initialize
    renderHero();
    renderProducts();
    updateCartCountUI(loadCartStorefront());
});
