// db.js - Mock database using localStorage

const DB_KEY_PRODUCTS = 'pm_products';
const DB_KEY_ORDERS = 'pm_orders';

const initialProducts = [
  {
    id: 'pm-001',
    name: "Mystique Rose",
    description: "A delicate blend of Damascus Rose and warm Sandalwood. Experience luxury in every drop.",
    price: 85.00,
    category: "Floral",
    stock: 12,
    status: "Active",
    imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'pm-002',
    name: "Desert Oud",
    description: "Rich, woody, and intensely captivating. Our signature Oud blend with a touch of vanilla.",
    price: 125.00,
    category: "Woody",
    stock: 5,
    status: "Active",
    imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'pm-003',
    name: "Mummy's Grace",
    description: "A calming elixir of Jasmine, Lavender, and hints of Bergamot.",
    price: 65.00,
    category: "Floral",
    stock: 0,
    status: "Sold Out",
    imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'pm-004',
    name: "Golden Amber",
    description: "Warm amber perfectly balanced with sweet musk and subtle spices.",
    price: 90.00,
    category: "Oriental",
    stock: 8,
    status: "Active",
    imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbfc2cd5f?auto=format&fit=crop&q=80&w=400"
  }
];

const initialOrders = [
  {
    id: 'ORD-1001',
    customerName: 'Eleanor Vance',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    items: [{ productId: 'pm-001', quantity: 1, price: 85 }],
    totalPrice: 85.00,
    status: 'Approved'
  },
  {
    id: 'ORD-1002',
    customerName: 'Marcus Pierce',
    date: new Date().toISOString(),
    items: [{ productId: 'pm-002', quantity: 1, price: 125 }],
    totalPrice: 125.00,
    status: 'Pending Approval'
  }
];

// Initialize DB if empty
function initDb() {
  if (!localStorage.getItem(DB_KEY_PRODUCTS)) {
    localStorage.setItem(DB_KEY_PRODUCTS, JSON.stringify(initialProducts));
  }
  if (!localStorage.getItem(DB_KEY_ORDERS)) {
    localStorage.setItem(DB_KEY_ORDERS, JSON.stringify(initialOrders));
  }
}

// Product API
function getProducts() {
  return JSON.parse(localStorage.getItem(DB_KEY_PRODUCTS)) || [];
}

function saveProducts(products) {
  localStorage.setItem(DB_KEY_PRODUCTS, JSON.stringify(products));
}

function updateProductStatus(id, newStatus) {
  const products = getProducts();
  const index = products.findIndex(p => p.id === id);
  if (index !== -1) {
    products[index].status = newStatus;
    saveProducts(products);
  }
}

function deleteProduct(id) {
  const products = getProducts();
  saveProducts(products.filter(p => p.id !== id));
}

function addProduct(product) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
}

// Order API
function getOrders() {
  return JSON.parse(localStorage.getItem(DB_KEY_ORDERS)) || [];
}

function saveOrders(orders) {
  localStorage.setItem(DB_KEY_ORDERS, JSON.stringify(orders));
}

function createOrder(orderData) {
  const orders = getOrders();
  const id = 'ORD-' + (1000 + orders.length + 1);
  const newOrder = {
    id,
    date: new Date().toISOString(),
    status: 'Pending Approval',
    ...orderData
  };
  orders.push(newOrder);
  saveOrders(orders);
  return newOrder;
}

function updateOrderStatus(id, status) {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === id);
  if (index !== -1) {
    orders[index].status = status;
    saveOrders(orders);
  }
}

function deleteOrder(id) {
  const orders = getOrders();
  saveOrders(orders.filter(o => o.id !== id));
}

// Run init on load
initDb();
