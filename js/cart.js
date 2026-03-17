// cart.js

document.addEventListener('DOMContentLoaded', () => {
    let cart = [];

    // Load cart from localStorage or initialize empty
    function loadCart() {
        const storedCart = localStorage.getItem('pm_cart');
        if (storedCart) {
            try {
                cart = JSON.parse(storedCart);
            } catch (e) {
                cart = [];
            }
        }
    }

    function saveCart() {
        localStorage.setItem('pm_cart', JSON.stringify(cart));
    }

    // Elements
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSubtotalEl = document.getElementById('cart-subtotal');
    const cartLayout = document.getElementById('cart-layout');
    const emptyCartView = document.getElementById('empty-cart-view');
    const cartCountEl = document.getElementById('cart-count');
    const checkoutForm = document.getElementById('checkout-form');

    function updateCartCount() {
        if (!cartCountEl) return;
        const total = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountEl.textContent = total;
        
        // Also update the storefront headers if they exist on the page
        const storefrontCartCounts = document.querySelectorAll('#cart-count');
        storefrontCartCounts.forEach(el => el.textContent = total);
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
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    
                    <div class="cart-item-actions">
                        <button class="qty-btn" onclick="updateQuantity('${item.cartId}', -1)">-</button>
                        <span class="qty-display">${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity('${item.cartId}', 1)">+</button>
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
            item.quantity += delta;
            if (item.quantity <= 0) {
                cart = cart.filter(i => i.cartId !== cartId);
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

    // Checkout Handling
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (cart.length === 0) {
                alert("Your cart is empty!");
                return;
            }

            const name = document.getElementById('c-name').value;
            const phone = document.getElementById('c-phone').value;
            const location = document.getElementById('c-location').value;
            const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Create Order data matching db.js extended schema
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

            // Assuming createOrder is globally available from db.js
            try {
                if (typeof createOrder === 'function') {
                    createOrder(orderData);
                    
                    // Clear cart
                    cart = [];
                    saveCart();
                    
                    alert(`Thank you, ${name}! Your order has been placed successfully and is pending approval.`);
                    window.location.href = 'index.html';
                } else {
                    console.error("createOrder function not found. Ensure db.js is loaded.");
                    alert("There was an error processing your order. Please try again.");
                }
            } catch (error) {
                console.error("Checkout failed:", error);
            }
        });
    }

    // Initialize
    loadCart();
    renderCart();
    // Expose cart saving logic to window for storefront.js to use
    window.saveAndRenderCartNav = function(newCart) {
        cart = newCart;
        saveCart();
        updateCartCount();
    };
});
