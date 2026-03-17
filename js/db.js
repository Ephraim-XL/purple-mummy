// db.js - Cloud database using Firebase Firestore

// Initial seed data (used only if Firestore collections are empty)
const initialProducts = [
  { id: 'pm-001', name: "Mystique Rose", description: "A delicate blend of Damascus Rose and warm Sandalwood. Experience luxury in every drop.", prices: { '6ml': 40, '10ml': 65, '15ml': 85, '30ml': 150 }, stock: 12, status: "Active", imageUrl: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&q=80&w=400" },
  { id: 'pm-002', name: "Desert Oud", description: "Rich, woody, and intensely captivating. Our signature Oud blend with a touch of vanilla.", prices: { '6ml': 60, '10ml': 95, '15ml': 125, '30ml': 220 }, stock: 5, status: "Active", imageUrl: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&q=80&w=400" },
  { id: 'pm-003', name: "Mummy's Grace", description: "A calming elixir of Jasmine, Lavender, and hints of Bergamot.", prices: { '6ml': 30, '10ml': 50, '15ml': 65, '30ml': 115 }, stock: 0, status: "Sold Out", imageUrl: "https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&q=80&w=400" },
  { id: 'pm-004', name: "Golden Amber", description: "Warm amber perfectly balanced with sweet musk and subtle spices.", prices: { '6ml': 45, '10ml': 70, '15ml': 90, '30ml': 160 }, stock: 8, status: "Active", imageUrl: "https://images.unsplash.com/photo-1587017539504-67cfbfc2cd5f?auto=format&fit=crop&q=80&w=400" }
];

const initialOrders = [
  { id: 'ORD-1001', customerName: 'Eleanor Vance', phoneNumber: '+1 (555) 234-5678', location: '45 Blossom Ave, New York, NY 10001', date: new Date(Date.now() - 86400000 * 2).toISOString(), items: [{ productId: 'pm-001', quantity: 1, price: 85 }], totalPrice: 85.00, status: 'Approved' },
  { id: 'ORD-1002', customerName: 'Marcus Pierce', phoneNumber: '+1 (555) 876-5432', location: '12 Royal Street, Brooklyn, NY 11201', date: new Date().toISOString(), items: [{ productId: 'pm-002', quantity: 1, price: 125 }], totalPrice: 125.00, status: 'Pending Approval' }
];

// =============================
// Product API (Firestore)
// =============================

async function getProducts() {
  const snapshot = await db.collection('products').get();
  return snapshot.docs.map(doc => ({ ...doc.data() }));
}

async function addProduct(product) {
  await db.collection('products').doc(product.id).set(product);
}

async function updateProduct(product) {
  await db.collection('products').doc(product.id).set(product);
}

async function deleteProduct(id) {
  await db.collection('products').doc(id).delete();
}

async function updateProductStatus(id, newStatus) {
  await db.collection('products').doc(id).update({ status: newStatus });
}

// =============================
// Order API (Firestore)
// =============================

async function getOrders() {
  const snapshot = await db.collection('orders').orderBy('date', 'desc').get();
  return snapshot.docs.map(doc => ({ ...doc.data() }));
}

async function createOrder(orderData) {
  const snapshot = await db.collection('orders').get();
  const id = 'ORD-' + (1000 + snapshot.size + 1);
  const newOrder = {
    id,
    date: new Date().toISOString(),
    status: 'Pending Approval',
    ...orderData
  };
  await db.collection('orders').doc(id).set(newOrder);
  return newOrder;
}

async function updateOrderStatus(id, status) {
  await db.collection('orders').doc(id).update({ status });
}

async function deleteOrder(id) {
  await db.collection('orders').doc(id).delete();
}

// =============================
// Seed DB on First Load
// =============================

async function initDb() {
  try {
    const productSnapshot = await db.collection('products').limit(1).get();
    if (productSnapshot.empty) {
      console.log('Seeding initial products to Firestore...');
      const batch = db.batch();
      initialProducts.forEach(p => batch.set(db.collection('products').doc(p.id), p));
      await batch.commit();
    }

    const orderSnapshot = await db.collection('orders').limit(1).get();
    if (orderSnapshot.empty) {
      console.log('Seeding initial orders to Firestore...');
      const batch = db.batch();
      initialOrders.forEach(o => batch.set(db.collection('orders').doc(o.id), o));
      await batch.commit();
    }
  } catch (err) {
    console.error('Error initializing DB. Check your firebase-config.js settings.', err);
  }
}
