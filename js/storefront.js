// storefront.js

document.addEventListener('DOMContentLoaded', async () => {
    const productGrid = document.getElementById('product-grid');
    const heroSection = document.getElementById('hero-section');
    const cartCountEl = document.getElementById('cart-count');

    // Render Hero Carousel
    function renderHero() {
        if (!heroSection) return;

        const slides = [
            'https://images.unsplash.com/photo-1541643600914-78b084683702?auto=format&fit=crop&w=1400&q=80',
            'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=1400&q=80',
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1400&q=80',
            'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=1400&q=80',
            'https://images.unsplash.com/photo-1587017539504-67cfbfc2cd5f?auto=format&fit=crop&w=1400&q=80'
        ];

        heroSection.innerHTML = `
            <div class="hero-carousel">
                <div class="hero-slides" id="hero-slides">
                    ${slides.map((url, i) => `
                        <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${url}');"></div>
                    `).join('')}
                </div>
                <div class="hero-overlay">
                    <div class="hero-text">
                        <h1 class="brand-font">Unveil Your Signature Scent</h1>
                        <p>Luxurious, artisanal, and unforgettable oil perfumes crafted for the elegant soul.</p>
                        <a href="#shop" class="btn btn-primary">Discover the Collection</a>
                    </div>
                </div>
                <div class="carousel-dots" id="carousel-dots">
                    ${slides.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`).join('')}
                </div>
            </div>
        `;

        // Auto-advance logic
        let current = 0;
        const allSlides = heroSection.querySelectorAll('.hero-slide');
        const allDots = heroSection.querySelectorAll('.dot');

        window.goToSlide = function(index) {
            allSlides[current].classList.remove('active');
            allDots[current].classList.remove('active');
            current = index;
            allSlides[current].classList.add('active');
            allDots[current].classList.add('active');
        };

        setInterval(() => {
            goToSlide((current + 1) % allSlides.length);
        }, 4500);
    }

    // Render Products
    async function renderProducts() {
        if (!productGrid) return;
        productGrid.innerHTML = '<p style="text-align:center; padding:2rem; color:var(--color-text-light);">Loading...</p>';

        const products = await getProducts();

        if (products.length === 0) {
            productGrid.innerHTML = '<p style="text-align:center;">No products available at the moment.</p>';
            return;
        }

        productGrid.innerHTML = products.map(product => {
            const isSoldOut = product.status === 'Sold Out';
            const btnClass = isSoldOut ? 'btn-secondary disabled' : 'btn-primary';
            const btnText = isSoldOut ? 'Sold Out' : 'Add to Bag';
            const ribbon = isSoldOut ? `<div class="ribbon badge-sold-out">Sold Out</div>` : '';
            // Use per-size prices, fallback to old single 'price' field if migrating
            const prices = product.prices || { '6ml': product.price, '10ml': product.price, '15ml': product.price, '30ml': product.price };
            const defaultPrice = prices['6ml'] || 0;

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
                            <label for="size-${product.id}" style="font-size: 0.8rem; color: var(--color-text-light); font-weight: 500;">Select Size:</label>
                            <select id="size-${product.id}" class="form-control" onchange="updatePriceDisplay('${product.id}')" style="padding: 0.5rem;" ${isSoldOut ? 'disabled' : ''} data-prices='${JSON.stringify(prices)}'>
                                <option value="6ml">6ml</option>
                                <option value="10ml">10ml</option>
                                <option value="15ml">15ml</option>
                                <option value="30ml">30ml</option>
                            </select>
                        </div>

                        <div class="product-meta flex justify-between items-center">
                            <span class="product-price" id="price-${product.id}">$${defaultPrice.toFixed(2)}</span>
                            <button class="btn ${btnClass}" onclick="addToCart('${product.id}')" ${isSoldOut ? 'disabled' : ''}>
                                ${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Update price display when size changes (reads from data attribute)
    window.updatePriceDisplay = function(productId) {
        const selectEl = document.getElementById(`size-${productId}`);
        const priceEl = document.getElementById(`price-${productId}`);
        if (!selectEl || !priceEl) return;
        const prices = JSON.parse(selectEl.dataset.prices);
        const selectedPrice = prices[selectEl.value] || 0;
        priceEl.textContent = `$${selectedPrice.toFixed(2)}`;
    };

    // Cart stays in localStorage
    function loadCartStorefront() {
        try { return JSON.parse(localStorage.getItem('pm_cart')) || []; }
        catch (e) { return []; }
    }
    function saveCartStorefront(cartData) {
        localStorage.setItem('pm_cart', JSON.stringify(cartData));
    }

    window.addToCart = async function(productId) {
        const products = await getProducts();
        const product = products.find(p => p.id === productId);
        if (!product || product.status === 'Sold Out') return;

        const selectEl = document.getElementById(`size-${productId}`);
        const selectedSize = selectEl ? selectEl.value : '6ml';
        const prices = product.prices || {};
        const actualPrice = prices[selectedSize] || product.price || 0;
        const cartItemId = `${productId}_${selectedSize}`;

        let cartData = loadCartStorefront();
        const cartItem = cartData.find(item => item.cartId === cartItemId);

        if (cartItem) {
            cartItem.quantity += 1;
        } else {
            cartData.push({ ...product, cartId: cartItemId, size: selectedSize, price: actualPrice, quantity: 1 });
        }

        saveCartStorefront(cartData);
        updateCartCountUI(cartData);
        showToast(`Added ${product.name} (${selectedSize}) to bag`);
    };

    function updateCartCountUI(cartData) {
        if (!cartCountEl) return;
        cartCountEl.textContent = cartData.reduce((sum, item) => sum + item.quantity, 0);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast show';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
    }

    // Initialize
    await initDb();
    renderHero();
    await renderProducts();
    updateCartCountUI(loadCartStorefront());
});
