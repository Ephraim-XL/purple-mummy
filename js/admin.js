// admin.js

document.addEventListener('DOMContentLoaded', async () => {
    const productTbody = document.getElementById('admin-product-tbody');
    const orderTbody = document.getElementById('admin-order-tbody');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const navLinks = document.querySelectorAll('.admin-nav a[href^="#"]');
    const viewSections = document.querySelectorAll('.view-section');

    // Wait for DB init on first load
    await initDb();

    // ==============================
    // Tab Navigation
    // ==============================
    function initNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1) + '-view';

                if (document.getElementById(targetId)) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                    viewSections.forEach(sec => sec.classList.remove('active'));
                    document.getElementById(targetId).classList.add('active');

                    if (targetId === 'dashboard-view') await renderDashboard();
                    else if (targetId === 'products-view') await renderProductsTable();
                    else if (targetId === 'orders-view') await renderOrdersTable();
                    else if (targetId === 'reviews-view') await renderReviewsTable();
                }
            });
        });
    }

    // ==============================
    // Render Dashboard
    // ==============================
    async function renderDashboard() {
        const [products, orders] = await Promise.all([getProducts(), getOrders()]);

        const activeProducts = products.filter(p => p.status === 'Active').length;
        const totalRevenue = orders.filter(o => o.status === 'Approved').reduce((sum, o) => sum + o.totalPrice, 0);

        document.getElementById('dash-revenue').textContent = `GHC ${totalRevenue.toFixed(2)}`;
        document.getElementById('dash-orders-count').textContent = orders.length;
        document.getElementById('dash-products-count').textContent = activeProducts;

        const recentTbody = document.getElementById('dash-recent-orders');
        if (recentTbody) {
            const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
            recentTbody.innerHTML = recent.map(o => {
                const color = o.status === 'Pending Approval' ? 'var(--color-gold)' :
                              o.status === 'Rejected' ? 'var(--color-error)' : 'var(--color-success)';
                return `
                <tr>
                    <td style="font-weight:500;">${o.id}</td>
                    <td>${o.customerName}</td>
                    <td>${o.phoneNumber || 'N/A'}</td>
                    <td>${new Date(o.date).toLocaleDateString()}</td>
                    <td>GHC ${o.totalPrice.toFixed(2)}</td>
                    <td style="color:${color}; font-weight:600;">${o.status}</td>
                </tr>`;
            }).join('');
        }
    }

    // ==============================
    // Render Products Table
    // ==============================
    async function renderProductsTable() {
        if (!productTbody) return;
        const products = await getProducts();
        productTbody.innerHTML = products.map(p => {
            // Support both old (price) and new (prices) schemas
            const displayPrice = p.prices
                ? `GHC ${p.prices['6ml'] || 0} – GHC ${p.prices['50ml'] || p.prices['30ml'] || 0}`
                : `GHC ${(p.price || 0).toFixed(2)}`;
            
            const soldOutSizes = p.soldOutSizes || [];
            let stockDisplay = '';
            if (typeof p.stock === 'object') {
                const sizes = ['6ml','10ml','20ml','30ml','50ml'];
                stockDisplay = `<div style="font-size:0.78rem; line-height:1.8;">${
                    sizes.map(s => {
                        const qty = p.stock[s] || 0;
                        const isSOSize = soldOutSizes.includes(s);
                        const badge = isSOSize ? ` <span style="color:var(--color-error);font-size:0.7rem;">[Sold Out]</span>` : (qty === 0 ? ` <span style="color:orange;font-size:0.7rem;">[No Stock]</span>` : '');
                        return `<b>${s}:</b> ${qty}${badge}`;
                    }).join(' | ')
                }</div>`;
            } else {
                stockDisplay = String(p.stock || 0);
            }

            return `
            <tr>
                <td>${p.id}</td>
                <td><img src="${p.imageUrl}" alt="${p.name}" class="product-img-thumbnail"></td>
                <td style="font-weight:500;">${p.name}</td>
                <td>${p.category || 'N/A'}</td>
                <td>${displayPrice}</td>
                <td>${stockDisplay}</td>
                <td>
                    <span class="badge ${p.status === 'Active' ? 'badge-active' : 'badge-sold-out'}">${p.status}</span>
                </td>
                <td>
                    <span class="action-icon edit" onclick="editProduct('${p.id}')">✏️</span>
                    <span class="action-icon delete" onclick="removeProduct('${p.id}')">🗑️</span>
                    <label class="toggle-switch" style="vertical-align:middle; margin-left:0.5rem;" title="Toggle Entire Product Sold Out">
                        <input type="checkbox" onchange="toggleSoldOut('${p.id}', this.checked)" ${p.status === 'Active' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                    <div style="margin-top:0.4rem; font-size:0.72rem; color:var(--color-text-light); font-weight:600;">Per-size sold out:</div>
                    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:3px;">
                        ${['6ml','10ml','20ml','30ml','50ml'].map(sz => {
                            const isSO = soldOutSizes.includes(sz);
                            return `<label style="cursor:pointer; display:flex; align-items:center; gap:3px; font-size:0.72rem; white-space:nowrap;">
                                <input type="checkbox" ${isSO ? 'checked' : ''} onchange="toggleSizeAvailability('${p.id}', '${sz}', this.checked)" style="width:12px; height:12px;">
                                ${sz}
                            </label>`;
                        }).join('')}
                    </div>
                </td>
            </tr>`;
        }).join('');
    }

    // ==============================
    // Render Orders Table (with Phone + Location)
    // ==============================
    async function renderOrdersTable() {
        if (!orderTbody) return;
        const orders = await getOrders();
        orderTbody.innerHTML = orders.map(o => {
            const isPending = o.status === 'Pending Approval';
            const color = isPending ? 'var(--color-gold)' :
                          o.status === 'Rejected' ? 'var(--color-error)' : 'var(--color-success)';
            return `
            <tr>
                <td style="font-weight:500;"><a href="#" onclick="viewOrderDetails('${o.id}')" style="color:var(--color-gold); text-decoration:underline;" title="View Order Details">${o.id}</a></td>
                <td>${o.customerName}</td>
                <td>${o.phoneNumber || 'N/A'}</td>
                <td style="max-width:160px; white-space:normal; font-size:0.85rem;">${o.location || 'N/A'}</td>
                <td>${new Date(o.date).toLocaleDateString()}</td>
                <td>GHC ${o.totalPrice.toFixed(2)}</td>
                <td style="color:${color}; font-weight:600;">${o.status}</td>
                <td>
                    ${isPending ? `
                        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:var(--color-success); color:white; margin-bottom:4px;" onclick="handleOrder('${o.id}', 'Approved')">Approve</button>
                        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:var(--color-error); color:white;" onclick="handleOrder('${o.id}', 'Rejected')">Reject</button>
                    ` : `
                        <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:var(--color-error); color:white;" onclick="removeOrder('${o.id}')">Delete</button>
                    `}
                </td>
            </tr>`;
        }).join('');
    }

    // ==============================
    // Product Actions
    // ==============================
    window.toggleSoldOut = async function(id, isActive) {
        await updateProductStatus(id, isActive ? 'Active' : 'Sold Out');
        await renderProductsTable();
    };

    // Toggle availability for a specific size
    window.toggleSizeAvailability = async function(productId, size, markSoldOut) {
        const products = await getProducts();
        const product = products.find(p => p.id === productId);
        if (!product) return;

        let soldOutSizes = product.soldOutSizes || [];
        if (markSoldOut) {
            if (!soldOutSizes.includes(size)) soldOutSizes.push(size);
        } else {
            soldOutSizes = soldOutSizes.filter(s => s !== size);
        }
        product.soldOutSizes = soldOutSizes;

        // If all sizes are sold out, also mark the product itself as Sold Out
        const allSizes = ['6ml','10ml','20ml','30ml','50ml'];
        if (allSizes.every(s => soldOutSizes.includes(s))) {
            product.status = 'Sold Out';
        } else if (product.status === 'Sold Out' && soldOutSizes.length < allSizes.length) {
            product.status = 'Active';
        }

        await updateProduct(product);
        await renderProductsTable();
    };

    window.removeProduct = async function(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id);
            await renderProductsTable();
        }
    };

    window.openProductModal = function() {
        productForm.reset();
        document.getElementById('p-id').value = '';
        
        // Mock data pre-filling
        document.getElementById('p-price-6ml').value = '50';
        document.getElementById('p-price-10ml').value = '80';
        document.getElementById('p-price-20ml').value = '150';
        document.getElementById('p-price-30ml').value = '220';
        document.getElementById('p-price-50ml').value = '350';
        
        document.getElementById('p-stock-6ml').value = '10';
        document.getElementById('p-stock-10ml').value = '10';
        document.getElementById('p-stock-20ml').value = '10';
        document.getElementById('p-stock-30ml').value = '10';
        document.getElementById('p-stock-50ml').value = '10';
        
        document.getElementById('p-category').value = 'Unisex';
        document.getElementById('p-status').value = 'Active';
        
        // Clear fields that should NOT have mock data
        document.getElementById('p-name').value = '';
        document.getElementById('p-desc').value = '';
        document.getElementById('p-image-url').value = '';
        document.getElementById('image-preview-container').style.display = 'none';
        document.getElementById('image-preview').src = '';
        
        document.getElementById('modal-title').textContent = 'Add New Product';
        productModal.classList.add('show');
    };

    window.closeProductModal = function() {
        productModal.classList.remove('show');
    };

    window.editProduct = async function(id) {
        const products = await getProducts();
        const prod = products.find(p => p.id === id);
        if (prod) {
            document.getElementById('p-id').value = prod.id;
            document.getElementById('p-name').value = prod.name;
            document.getElementById('p-category').value = prod.category || 'Women';
            const prices = prod.prices || { '6ml': prod.price || 0, '10ml': prod.price || 0, '20ml': prod.price || 0, '30ml': prod.price || 0, '50ml': prod.price || 0 };
            document.getElementById('p-price-6ml').value = prices['6ml'] || '';
            document.getElementById('p-price-10ml').value = prices['10ml'] || '';
            document.getElementById('p-price-20ml').value = prices['20ml'] || prices['15ml'] || '';
            document.getElementById('p-price-30ml').value = prices['30ml'] || '';
            document.getElementById('p-price-50ml').value = prices['50ml'] || '';
            
            const stocks = typeof prod.stock === 'object' ? prod.stock : { '6ml': prod.stock || 0, '10ml': prod.stock || 0, '20ml': prod.stock || 0, '30ml': prod.stock || 0, '50ml': prod.stock || 0 };
            document.getElementById('p-stock-6ml').value = stocks['6ml'] || 0;
            document.getElementById('p-stock-10ml').value = stocks['10ml'] || 0;
            document.getElementById('p-stock-20ml').value = stocks['20ml'] || stocks['15ml'] || 0;
            document.getElementById('p-stock-30ml').value = stocks['30ml'] || 0;
            document.getElementById('p-stock-50ml').value = stocks['50ml'] || 0;
            document.getElementById('p-status').value = prod.status;
            document.getElementById('p-desc').value = prod.description;
            // Show current image preview
            document.getElementById('p-image-url').value = prod.imageUrl || '';
            const previewContainer = document.getElementById('image-preview-container');
            const previewImg = document.getElementById('image-preview');
            if (prod.imageUrl) {
                previewImg.src = prod.imageUrl;
                previewContainer.style.display = 'block';
            } else {
                previewContainer.style.display = 'none';
            }
            document.getElementById('modal-title').textContent = 'Edit Product';
            productModal.classList.add('show');
        }
    };

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = productForm.querySelector('[type="submit"]');
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;

        const id = document.getElementById('p-id').value;
        const productId = id || 'pm-' + Date.now().toString().slice(-6);

        // === Handle Image ===
        const imageUrl = document.getElementById('p-image-url').value;

        const prodData = {
            id: productId,
            name: document.getElementById('p-name').value,
            category: document.getElementById('p-category').value,
            prices: {
                '6ml':  parseFloat(document.getElementById('p-price-6ml').value) || 0,
                '10ml': parseFloat(document.getElementById('p-price-10ml').value) || 0,
                '20ml': parseFloat(document.getElementById('p-price-20ml').value) || 0,
                '30ml': parseFloat(document.getElementById('p-price-30ml').value) || 0,
                '50ml': parseFloat(document.getElementById('p-price-50ml').value) || 0,
            },
            stock: {
                '6ml':  parseInt(document.getElementById('p-stock-6ml').value, 10) || 0,
                '10ml': parseInt(document.getElementById('p-stock-10ml').value, 10) || 0,
                '20ml': parseInt(document.getElementById('p-stock-20ml').value, 10) || 0,
                '30ml': parseInt(document.getElementById('p-stock-30ml').value, 10) || 0,
                '50ml': parseInt(document.getElementById('p-stock-50ml').value, 10) || 0,
            },
            status:   document.getElementById('p-status').value,
            imageUrl: imageUrl,
            description: document.getElementById('p-desc').value
        };

        if (!id) {
            await addProduct(prodData);
        } else {
            await updateProduct(prodData);
        }

        saveBtn.textContent = 'Save Product';
        saveBtn.disabled = false;
        closeProductModal();
        await renderProductsTable();
    });

    // ==============================
    // Order Actions
    // ==============================
    window.handleOrder = async function(id, status) {
        if (confirm(`Mark order ${id} as ${status}?`)) {
            if (status === 'Approved') {
                // Determine deduction logic based on items
                try {
                    const orders = await getOrders();
                    const orderToApprove = orders.find(o => o.id === id);
                    if (orderToApprove) {
                        const allProducts = await getProducts();
                        for (const item of orderToApprove.items) {
                            const product = allProducts.find(p => p.id === item.productId);
                            if (product) {
                                let modified = false;
                                if (typeof product.stock === 'object') {
                                    const requestedSize = item.size || '6ml';
                                    product.stock[requestedSize] = Math.max(0, (product.stock[requestedSize] || 0) - item.quantity);
                                    
                                    // If that size's stock hits 0, auto-mark it as sold out
                                    if (product.stock[requestedSize] === 0) {
                                        product.soldOutSizes = product.soldOutSizes || [];
                                        if (!product.soldOutSizes.includes(requestedSize)) {
                                            product.soldOutSizes.push(requestedSize);
                                        }
                                    }

                                    // Check if all sizes are zero → mark whole product Sold Out
                                    const totalStock = Object.values(product.stock).reduce((sum, val) => sum + val, 0);
                                    if (totalStock <= 0) {
                                        product.status = 'Sold Out';
                                    }
                                    
                                    await updateProduct(product);
                                } else {
                                    // Legacy single-number stock fallback
                                    product.stock = Math.max(0, product.stock - item.quantity);
                                    if (product.stock <= 0) {
                                        product.status = 'Sold Out';
                                    }
                                    await updateProduct(product);
                                }
                            }
                        }
                    }
                } catch(e) {
                    console.error("Failed to deduce stock", e);
                }
            }

            await updateOrderStatus(id, status);
            await renderOrdersTable();
            await renderDashboard();
        }
    };

    window.removeOrder = async function(id) {
        if (confirm(`Permanently delete order ${id}?`)) {
            await deleteOrder(id);
            await renderOrdersTable();
            await renderDashboard();
        }
    };

    window.viewOrderDetails = async function(id) {
        const orders = await getOrders();
        const order = orders.find(o => o.id === id);
        if (!order) return;

        const products = await getProducts();
        
        document.getElementById('order-modal-title').textContent = `Order Details - ${order.id}`;
        document.getElementById('order-modal-total').textContent = `Total: GHC ${order.totalPrice.toFixed(2)}`;

        const tbody = document.getElementById('order-items-tbody');
        tbody.innerHTML = order.items.map(item => {
            const prod = products.find(p => p.id === item.productId) || { name: 'Unknown Product', imageUrl: 'https://via.placeholder.com/50' };
            const subtotal = item.price * item.quantity;
            return `
            <tr>
                <td><img src="${prod.imageUrl}" alt="${prod.name}" class="product-img-thumbnail"></td>
                <td style="font-weight:500;">${prod.name}</td>
                <td>${item.size}</td>
                <td>${item.quantity}</td>
                <td>GHC ${item.price.toFixed(2)}</td>
                <td style="font-weight:600;">GHC ${subtotal.toFixed(2)}</td>
            </tr>`;
        }).join('');

        document.getElementById('order-modal').classList.add('show');
    };

    window.closeOrderModal = function() {
        document.getElementById('order-modal').classList.remove('show');
    };

    // ==============================
    // Review Actions
    // ==============================
    async function renderReviewsTable() {
        const reviewTbody = document.getElementById('admin-review-tbody');
        if (!reviewTbody) return;
        const reviews = await getReviews();
        reviewTbody.innerHTML = reviews.map(r => {
            return `
            <tr>
                <td style="font-weight:500;">${r.id}</td>
                <td>${r.name}</td>
                <td style="color:var(--color-gold);">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
                <td style="max-width:250px; white-space:normal; font-size:0.85rem;">"${r.comment}"</td>
                <td>${new Date(r.date).toLocaleDateString()}</td>
                <td>
                    <button class="btn" style="padding:0.25rem 0.5rem; font-size:0.75rem; background:var(--color-error); color:white;" onclick="removeReview('${r.id}')">Delete</button>
                </td>
            </tr>`;
        }).join('');
    }

    window.removeReview = async function(id) {
        if (confirm(`Permanently delete review ${id}?`)) {
            await deleteReview(id);
            await renderReviewsTable();
        }
    };

    // Initialize
    initNavigation();
    await renderDashboard();
    await renderProductsTable();
    await renderOrdersTable();
    await renderReviewsTable();
});

// Global Logout
window.logoutAdmin = function() {
    sessionStorage.removeItem('pm_admin_auth');
    window.location.href = 'login.html';
};
