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

        document.getElementById('dash-revenue').textContent = `$${totalRevenue.toFixed(2)}`;
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
                    <td>$${o.totalPrice.toFixed(2)}</td>
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
        productTbody.innerHTML = products.map(p => `
            <tr>
                <td>${p.id}</td>
                <td><img src="${p.imageUrl}" alt="${p.name}" class="product-img-thumbnail"></td>
                <td style="font-weight:500;">${p.name}</td>
                <td>${p.category}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td>${p.stock}</td>
                <td>
                    <span class="badge ${p.status === 'Active' ? 'badge-active' : 'badge-sold-out'}">${p.status}</span>
                </td>
                <td>
                    <span class="action-icon edit" onclick="editProduct('${p.id}')">✏️</span>
                    <span class="action-icon delete" onclick="removeProduct('${p.id}')">🗑️</span>
                    <label class="toggle-switch" style="vertical-align:middle; margin-left:0.5rem;" title="Toggle Sold Out">
                        <input type="checkbox" onchange="toggleSoldOut('${p.id}', this.checked)" ${p.status === 'Active' ? 'checked' : ''}>
                        <span class="slider"></span>
                    </label>
                </td>
            </tr>
        `).join('');
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
                <td style="font-weight:500;">${o.id}</td>
                <td>${o.customerName}</td>
                <td>${o.phoneNumber || 'N/A'}</td>
                <td style="max-width:160px; white-space:normal; font-size:0.85rem;">${o.location || 'N/A'}</td>
                <td>${new Date(o.date).toLocaleDateString()}</td>
                <td>$${o.totalPrice.toFixed(2)}</td>
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

    window.removeProduct = async function(id) {
        if (confirm('Are you sure you want to delete this product?')) {
            await deleteProduct(id);
            await renderProductsTable();
        }
    };

    window.openProductModal = function() {
        productForm.reset();
        document.getElementById('p-id').value = '';
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

    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('p-id').value;
        const prodData = {
            id: id || 'pm-' + Date.now().toString().slice(-6),
            name: document.getElementById('p-name').value,
            price: parseFloat(document.getElementById('p-price').value),
            category: document.getElementById('p-category').value,
            stock: parseInt(document.getElementById('p-stock').value, 10),
            status: document.getElementById('p-status').value,
            imageUrl: document.getElementById('p-image').value,
            description: document.getElementById('p-desc').value
        };

        if (!id) {
            await addProduct(prodData);
        } else {
            await updateProduct(prodData);
        }
        closeProductModal();
        await renderProductsTable();
    });

    // ==============================
    // Order Actions
    // ==============================
    window.handleOrder = async function(id, status) {
        if (confirm(`Mark order ${id} as ${status}?`)) {
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

    // Initialize
    initNavigation();
    await renderDashboard();
    await renderProductsTable();
    await renderOrdersTable();
});

// Global Logout
window.logoutAdmin = function() {
    sessionStorage.removeItem('pm_admin_auth');
    window.location.href = 'login.html';
};
