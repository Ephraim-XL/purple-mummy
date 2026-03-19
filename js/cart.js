// cart.js

document.addEventListener('DOMContentLoaded', () => {
    let cart = [];

    function loadCart() {
        try { cart = JSON.parse(localStorage.getItem('pm_cart')) || []; }
        catch (e) { cart = []; }
    }

    function saveCart() {
        localStorage.setItem('pm_cart', JSON.stringify(cart));
    }

    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartLayout = document.getElementById('cart-layout');
    const emptyCartView = document.getElementById('empty-cart-view');
    const cartCountEl = document.getElementById('cart-count');
    const checkoutForm = document.getElementById('checkout-form');

    function updateCartCount() {
        if (!cartCountEl) return;
        cartCountEl.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    function renderCart() {
        if (!cartItemsContainer || !cartLayout || !emptyCartView) return;

        if (cart.length === 0) {
            cartLayout.style.display = 'none';
            emptyCartView.style.display = 'block';
            updateCartCount();
            return;
        }

        cartLayout.style.display = 'flex';
        emptyCartView.style.display = 'none';

        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <div class="cart-item-title brand-font">${item.name} <span style="font-size: 0.9rem; color: var(--color-text-light);">(${item.size})</span></div>
                    <div class="cart-item-price">GHC ${item.price.toFixed(2)}</div>
                    ${item.maxStock !== undefined ? `<div style="font-size:0.78rem; color:var(--color-text-light); margin-bottom:4px;">Stock available: ${item.maxStock}</div>` : ''}
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateQuantity('${item.cartId}', -1)">-</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${item.cartId}', 1)" ${item.maxStock !== undefined && item.quantity >= item.maxStock ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>+</button>
                        <button class="remove-btn" onclick="removeItem('${item.cartId}')">Remove</button>
                    </div>
                </div>
            </div>
        `).join('');

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartSubtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        updateCartCount();
    }

    window.updateQuantity = function(cartId, delta) {
        const item = cart.find(i => i.cartId === cartId);
        if (item) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) {
                cart = cart.filter(i => i.cartId !== cartId);
            } else if (item.maxStock !== undefined && newQty > item.maxStock) {
                // Show a small alert or just silently cap
                const msg = document.createElement('div');
                msg.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:0.5rem 1.2rem;border-radius:6px;font-size:0.85rem;z-index:9999;';
                msg.textContent = `Only ${item.maxStock} unit(s) available`;
                document.body.appendChild(msg);
                setTimeout(() => msg.remove(), 2500);
                return;
            } else {
                item.quantity = newQty;
            }
            saveCart();
            renderCart();
        }
    };

    window.removeItem = function(cartId) {
        cart = cart.filter(i => i.cartId !== cartId);
        saveCart();
        renderCart();
    };

    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (cart.length === 0) { alert("Your cart is empty!"); return; }

            const checkoutBtn = document.getElementById('checkout-btn');
            if (checkoutBtn) { checkoutBtn.textContent = 'Placing Order...'; checkoutBtn.disabled = true; }

            const name = document.getElementById('c-name').value;
            const phone = document.getElementById('c-phone').value;
            const location = document.getElementById('c-location').value;
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const orderData = {
                customerName: name,
                phoneNumber: phone,
                location: location,
                items: cart.map(item => ({
                    productId: item.id,
                    size: item.size,
                    cartId: item.cartId,
                    quantity: item.quantity,
                    price: item.price
                })),
                totalPrice: subtotal
            };

            try {
                await createOrder(orderData);
                cart = [];
                saveCart();
                
                // Show review modal instead of redirecting immediately
                const reviewModal = document.getElementById('review-modal');
                if (reviewModal) {
                    document.getElementById('r-name').value = name;
                    reviewModal.style.display = 'flex';
                } else {
                    alert(`Thank you, ${name}! Your order has been placed and is pending approval.`);
                    window.location.href = 'index.html';
                }
            } catch (error) {
                console.error("Checkout failed:", error);
                alert("There was an error placing your order. Please try again.");
                if (checkoutBtn) { checkoutBtn.textContent = 'Confirm Order'; checkoutBtn.disabled = false; }
            }
        });
    }

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-review-btn');
            btn.textContent = 'Submitting...';
            btn.disabled = true;

            const reviewData = {
                name: document.getElementById('r-name').value,
                rating: parseInt(document.getElementById('r-rating').value, 10),
                comment: document.getElementById('r-comment').value
            };

            try {
                await addReview(reviewData);
                alert('Thank you for your review!');
                window.location.href = 'index.html';
            } catch (err) {
                console.error('Failed to submit review:', err);
                alert('Could not submit your review. Please try again later.');
                btn.textContent = 'SUBMIT TESTIMONIAL';
                btn.disabled = false;
            }
        });
    }

    loadCart();
    renderCart();
});
