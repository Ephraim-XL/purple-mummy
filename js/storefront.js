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
            'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=1400&q=80'
        ];

        heroSection.innerHTML = `
            <section class="hero-carousel">
                <div class="hero-slides" id="hero-slides">
                    ${slides.map((url, i) => `
                        <div class="hero-slide ${i === 0 ? 'active' : ''}" style="background-image: url('${url}');"></div>
                    `).join('')}
                </div>
                <div class="hero-overlay">
                    <div class="hero-text">
                        <h1 class="brand-font">Experience Luxury<br>In Every Drop</h1>
                        <p>Richly made from Natural Ingredients</p>
                        <a href="#shop" class="btn btn-ghost">SHOP MORE</a>
                    </div>
                </div>
                <button class="hero-nav-btn prev" onclick="prevSlide()">&#8592;</button>
                <button class="hero-nav-btn next" onclick="nextSlide()">&#8594;</button>
                <div class="carousel-dots" id="carousel-dots">
                    ${slides.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`).join('')}
                </div>
                <button class="hero-scroll-btn" onclick="document.getElementById('about-section').scrollIntoView({behavior:'smooth'})">&#8595;</button>
            </section>
        `;

        let current = 0;
        const allSlides = heroSection.querySelectorAll('.hero-slide');
        const allDots = heroSection.querySelectorAll('.dot');

        window.goToSlide = function(index) {
            allSlides[current].classList.remove('active');
            allDots[current].classList.remove('active');
            current = (index + allSlides.length) % allSlides.length;
            allSlides[current].classList.add('active');
            allDots[current].classList.add('active');
        };

        window.nextSlide = () => goToSlide(current + 1);
        window.prevSlide = () => goToSlide(current - 1);

        setInterval(nextSlide, 5000);
    }

    // Render Products
    window.allProducts = [];

    async function loadProducts() {
        if (!productGrid) return;
        productGrid.innerHTML = '<p style="text-align:center; padding:5rem 0; width:100%; font-family:var(--font-heading); font-size:1.5rem; font-style:italic; color:var(--color-text-muted);">Loading Collection...</p>';

        window.allProducts = await getProducts();
        renderProductGrid(window.allProducts);
    }

    window.filterProducts = function(category) {
        if (category === 'all') {
            renderProductGrid(window.allProducts);
        } else {
            const filtered = window.allProducts.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
            renderProductGrid(filtered);
        }
    };

    function renderProductGrid(products) {
        if (!productGrid) return;
        if (products.length === 0) {
            productGrid.innerHTML = '<p style="text-align:center; padding:3rem 0; width:100%;">Our new collection is arriving soon.</p>';
            return;
        }

        productGrid.innerHTML = products.map(product => {
            const isSoldOut = product.status === 'Sold Out';
            const btnClass = isSoldOut ? 'btn-outline disabled' : 'btn-gold';
            const btnText = isSoldOut ? 'Sold Out' : 'Add to Bag';
            const ribbon = isSoldOut ? `<div class="ribbon badge-sold-out">Sold Out</div>` : '';
            
            const prices = product.prices || { '6ml': product.price || 0 };
            const defaultPrice = prices['6ml'] || 0;

            return `
                <div class="product-card">
                    ${ribbon}
                    <div class="product-image-wrapper">
                        <img src="${product.imageUrl || 'https://via.placeholder.com/400x400?text=Perfume'}" alt="${product.name}" class="product-image">
                    </div>
                    <div class="product-info">
                        ${product.category ? `<span class="product-category">${product.category}</span>` : ''}
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-desc">${product.description || ''}</p>

                        <div class="form-group" style="margin-bottom: 1.25rem;">
                            <label style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Select Size:</label>
                            <div class="size-buttons" id="size-container-${product.id}" data-prices='${JSON.stringify(prices)}'>
                                <button class="size-btn active" onclick="selectSize('${product.id}', '6ml')" ${isSoldOut ? 'disabled' : ''}>6ml</button>
                                <button class="size-btn" onclick="selectSize('${product.id}', '10ml')" ${isSoldOut ? 'disabled' : ''}>10ml</button>
                                <button class="size-btn" onclick="selectSize('${product.id}', '15ml')" ${isSoldOut ? 'disabled' : ''}>15ml</button>
                                <button class="size-btn" onclick="selectSize('${product.id}', '30ml')" ${isSoldOut ? 'disabled' : ''}>30ml</button>
                            </div>
                            <input type="hidden" id="size-${product.id}" value="6ml">
                        </div>

                        <div class="product-meta flex justify-between items-center" style="margin-top:auto;">
                            <span class="product-price" id="price-${product.id}" style="font-family:var(--font-heading); font-size:1.1rem; color:var(--color-gold-dark); font-weight:600;">GHC ${defaultPrice.toFixed(2)}</span>
                            <button class="btn ${btnClass}" onclick="addToCart('${product.id}')" ${isSoldOut ? 'disabled' : ''} style="padding: 0.6rem 1rem; font-size: 0.7rem;">
                                ${btnText}
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Select size via buttons
    window.selectSize = function(productId, size) {
        // Update hidden input
        const hiddenInput = document.getElementById(`size-${productId}`);
        if (hiddenInput) hiddenInput.value = size;

        // Update active class on buttons
        const container = document.getElementById(`size-container-${productId}`);
        if (container) {
            const buttons = container.querySelectorAll('.size-btn');
            buttons.forEach(btn => {
                if (btn.textContent.trim() === size) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            // Update price text
            const priceEl = document.getElementById(`price-${productId}`);
            const prices = JSON.parse(container.dataset.prices || "{}");
            const selectedPrice = prices[size] || 0;
            if (priceEl) priceEl.textContent = `GHC ${selectedPrice.toFixed(2)}`;
        }
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

    // Render Testimonials
    async function renderTestimonials() {
        const slider = document.getElementById('testimonials-slider');
        if (!slider) return;

        const reviews = await getReviews();
        // Fallback to static if no reviews yet
        if (reviews.length === 0) return;

        // Show max 4 latest reviews
        const latest = reviews.slice(0, 4);

        slider.innerHTML = latest.map(r => `
            <div class="testimonial-card">
                <span class="testimonial-quote-mark">"</span>
                <div class="testimonial-label" style="color:var(--color-gold);">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
                <p class="testimonial-quote">"${r.comment}"</p>
                <div class="testimonial-author-row">
                    <div class="testimonial-avatar" style="background: var(--color-gold); width:42px; height:42px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:white; font-weight:bold; font-family:var(--font-heading); font-size:1.2rem;">
                        ${r.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="testimonial-author-name">${r.name}</div>
                        <div class="testimonial-author-role">/ Verified Buyer</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Initialize
    await initDb();
    renderHero();
    await loadProducts();
    await renderTestimonials();
    updateCartCountUI(loadCartStorefront());
});
