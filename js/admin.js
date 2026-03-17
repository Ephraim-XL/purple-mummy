// admin.js

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const productTbody = document.getElementById('admin-product-tbody');
    const orderTbody = document.getElementById('admin-order-tbody');
    const productModal = document.getElementById('product-modal');
    const productForm = document.getElementById('product-form');
    const navLinks = document.querySelectorAll('.admin-nav a[href^="#"]');
    const viewSections = document.querySelectorAll('.view-section');

    // Navigation Logic
    function initNavigation() {
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1) + '-view';
                
                // Only switch if the section exists
                if (document.getElementById(targetId)) {
                    // Update active link
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    // Update active section
                    viewSections.forEach(sec => sec.classList.remove('active'));
                    document.getElementById(targetId).classList.add('active');

                    // Refresh data based on view
                    if (targetId === 'dashboard-view') renderDashboard();
                    else if (targetId === 'products-view') renderProductsTable();
                    else if (targetId === 'orders-view') renderOrdersTable();
                }
            });
        });
    }

    // Render Dashboard
    function renderDashboard() {
        const products = getProducts();
        const orders = getOrders();

        const activeProductsFreq = products.filter(p => p.status === 'Active').length;
        const totalOrders = orders.length;
        const totalRevenue = orders
            .filter(o => o.status === 'Approved')
            .reduce((sum, o) => sum + o.totalPrice, 0);

        // Update metric cards
        document.getElementById('dash-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
        document.getElementById('dash-orders-count').textContent = totalOrders;
        document.getElementById('dash-products-count').textContent = activeProductsFreq;

        // Render recent orders (Top 5)
        const recentOrdersTbody = document.getElementById('dash-recent-orders');
        if (recentOrdersTbody) {
            const sortedOrders = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
            recentOrdersTbody.innerHTML = sortedOrders.map(o => {
                const statusColor = o.status === 'Pending Approval' ? 'var(--color-gold)' : 
                                   (o.status === 'Rejected' ? 'var(--color-error)' : 'var(--color-success)');
                return `
                <tr>
                    <td style="font-weight: 500;">${o.id}</td>
                    <td>${o.customerName}</td>
                    <td>${new Date(o.date).toLocaleDateString()}</td>
                    <td>$${o.totalPrice.toFixed(2)}</td>
                    <td style="color: ${statusColor}; font-weight: 600;">${o.status}</td>
                </tr>
                `;
            }).join('');
        }
    }

    // Render Products Table
    function renderProductsTable() {
        if (!productTbody) return;
        const products = getProducts();
        
        productTbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><img src="${p.imageUrl}" alt="${p.name}" class="product-img-thumbnail"></td>
                <td style="font-weight: 500;">${p.name}</td>
                <td>${p.category}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td>${p.stock}</td>
                <td>
                    <span class="badge ${p.status === 'Active' ? 'badge-active' : 'badge-sold-out'}">
                        ${p.status}
                    </span>
                </td>
                <td>
                    <span class="action-icon edit" onclick="editProduct('${p.id}')">✏️</span>
                    <span class="action-icon delete" onclick="removeProduct('${p.id}')">🗑️</span>
                    <label class="toggle-switch" style="vertical-align: middle; margin-left: 0.5rem;" title="Toggle Sold Out">
                        <input type="checkbox" onchange="toggleSoldOut('${p.id}', this.checked)" ${p.status === 'Active' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </td>
            </tr>
        `).join('');
    }

    // Render Orders Table
    function renderOrdersTable() {
        if (!orderTbody) return;
        const orders = getOrders();

        orderTbody.innerHTML = orders.map(o => {
            const isPending = o.status === 'Pending Approval';
            const statusColor = isPending ? 'var(--color-gold)' : 
                               (o.status === 'Rejected' ? 'var(--color-error)' : 'var(--color-success)');

            return `
            <tr>
                <td style="font-weight: 500;">${o.id}</td>
                <td>${o.customerName}</td>
                <td>${new Date(o.date).toLocaleDateString()}</td>
                <td>$${o.totalPrice.toFixed(2)}</td>
                <td style="color: ${statusColor}; font-weight: 600;">${o.status}</td>
                <td>
                    ${isPending ? `
                        <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--color-success); color: white;" onclick="handleOrder('${o.id}', 'Approved')">Approve</button>
                        <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--color-error); color: white;" onclick="handleOrder('${o.id}', 'Rejected')">Reject</button>
                    ` : `
                        <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: var(--color-error); color: white;" onclick="removeOrder('${o.id}')">Delete</button>
                    `}
                </td>
            </tr>
        `}).join('');
    }

    // Product Actions
    window.toggleSoldOut = function(id, isActive) {
        updateProductStatus(id, isActive ? 'Active' : 'Sold Out');
        renderProductsTable();
    };

    window.removeProduct = function(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            deleteProduct(id);
            renderProductsTable();
        }
    };

    window.openProductModal = function() {
        document.getElementById('product-form').reset();
        document.getElementById('p-id').value = '';
        document.getElementById('modal-title').textContent = 'Add New Product';
        productModal.classList.add('show');
    };

    window.closeProductModal = function() {
        productModal.classList.remove('show');
    };

    window.editProduct = function(id) {
        const prod = getProducts().find(p => p.id === id);
        if (prod) {
            document.getElementById('p-id').value = prod.id;
            document.getElementById('p-name').value = prod.name;
            document.getElementById('p-price').value = prod.price;
            document.getElementById('p-category').value = prod.category;
            document.getElementById('p-stock').value = prod.stock;
            document.getElementById('p-status').value = prod.status;
            document.getElementById('p-image').value = prod.imageUrl;
            document.getElementById('p-desc').value = prod.description;
            document.getElementById('modal-title').textContent = 'Edit Product';
            productModal.classList.add('show');
        }
    };

    // Form Submission
    productForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const id = document.getElementById('p-id').value;
        const isNew = !id;
        
        const prodData = {
            id: id || 'pm-' + Date.now().toString().slice(-4),
            name: document.getElementById('p-name').value,
            price: parseFloat(document.getElementById('p-price').value),
            category: document.getElementById('p-category').value,
            stock: parseInt(document.getElementById('p-stock').value, 10),
            status: document.getElementById('p-status').value,
            imageUrl: document.getElementById('p-image').value,
            description: document.getElementById('p-desc').value
        };

        if (isNew) {
            addProduct(prodData);
        } else {
            const products = getProducts();
            const idx = products.findIndex(p => p.id === id);
            if (idx > -1) {
                products[idx] = prodData;
                saveProducts(products);
            }
        }

        closeProductModal();
        renderProductsTable();
    });

    // Order Actions
    window.handleOrder = function(id, status) {
        if (confirm(`Are you sure you want to mark order ${id} as ${status}?`)) {
            updateOrderStatus(id, status);
            renderOrdersTable();
            renderDashboard(); // Update metrics if needed
        }
    };

    window.removeOrder = function(id) {
        if (confirm(`Are you sure you want to permanently delete order ${id}?`)) {
            deleteOrder(id);
            renderOrdersTable();
            renderDashboard();
        }
    };

    // Initialize
    initNavigation();
    renderDashboard();
    renderProductsTable();
    renderOrdersTable();
});

// Global Logout Function
window.logoutAdmin = function() {
    sessionStorage.removeItem('pm_admin_auth');
    window.location.href = 'login.html';
};
