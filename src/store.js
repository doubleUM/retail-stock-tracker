// A simple store using LocalStorage for persistence

const STORAGE_KEY = 'retail_stock_items';
const TRANSACTIONS_KEY = 'retail_transactions';

const getInitialData = () => [
  { id: '1', sku: 'SKU-001', name: 'Wireless Mouse', category: 'Electronics', price: 25.99, quantity: 45, reorderLevel: 10 },
  { id: '2', sku: 'SKU-002', name: 'Mechanical Keyboard', category: 'Electronics', price: 89.99, quantity: 5, reorderLevel: 15 },
  { id: '3', sku: 'SKU-003', name: 'Desk Mat', category: 'Accessories', price: 19.99, quantity: 120, reorderLevel: 20 },
  { id: '4', sku: 'SKU-004', name: 'USB-C Hub', category: 'Accessories', price: 39.99, quantity: 2, reorderLevel: 25 },
  { id: '5', sku: 'SKU-005', name: 'Laptop Stand', category: 'Accessories', price: 29.99, quantity: 35, reorderLevel: 10 },
  { id: '6', sku: 'SKU-006', name: '27-inch Monitor', category: 'Electronics', price: 249.99, quantity: 15, reorderLevel: 5 },
  { id: '7', sku: 'SKU-007', name: 'Noise Cancelling Headphones', category: 'Electronics', price: 199.99, quantity: 20, reorderLevel: 8 },
  { id: '8', sku: 'SKU-008', name: 'Webcam 1080p', category: 'Electronics', price: 59.99, quantity: 12, reorderLevel: 10 },
  { id: '9', sku: 'SKU-009', name: 'Microphone USB', category: 'Electronics', price: 79.99, quantity: 8, reorderLevel: 5 },
  { id: '10', sku: 'SKU-010', name: 'Ergonomic Chair', category: 'Furniture', price: 150.00, quantity: 3, reorderLevel: 2 },
  { id: '11', sku: 'SKU-011', name: 'Standing Desk', category: 'Furniture', price: 300.00, quantity: 7, reorderLevel: 3 },
  { id: '12', sku: 'SKU-012', name: 'LED Strip Lights', category: 'Accessories', price: 15.99, quantity: 50, reorderLevel: 15 },
  { id: '13', sku: 'SKU-013', name: 'Cable Management Box', category: 'Accessories', price: 12.99, quantity: 60, reorderLevel: 20 },
  { id: '14', sku: 'SKU-014', name: 'Ethernet Cable 10ft', category: 'Accessories', price: 9.99, quantity: 100, reorderLevel: 30 },
  { id: '15', sku: 'SKU-015', name: 'Wireless Charger', category: 'Electronics', price: 24.99, quantity: 25, reorderLevel: 10 },
  { id: '16', sku: 'SKU-016', name: 'External SSD 1TB', category: 'Electronics', price: 109.99, quantity: 18, reorderLevel: 5 },
  { id: '17', sku: 'SKU-017', name: 'Flash Drive 64GB', category: 'Electronics', price: 14.99, quantity: 80, reorderLevel: 20 },
  { id: '18', sku: 'SKU-018', name: 'Bluetooth Speaker', category: 'Electronics', price: 45.99, quantity: 22, reorderLevel: 10 },
  { id: '19', sku: 'SKU-019', name: 'Power Bank 10000mAh', category: 'Electronics', price: 29.99, quantity: 40, reorderLevel: 15 },
  { id: '20', sku: 'SKU-020', name: 'Smartphone Stand', category: 'Accessories', price: 8.99, quantity: 75, reorderLevel: 25 },
  { id: '21', sku: 'SKU-021', name: 'Screen Cleaning Kit', category: 'Accessories', price: 11.99, quantity: 55, reorderLevel: 15 },
  { id: '22', sku: 'SKU-022', name: 'Monitor Arm Mount', category: 'Furniture', price: 49.99, quantity: 14, reorderLevel: 5 },
  { id: '23', sku: 'SKU-023', name: 'Keyboard Wrist Rest', category: 'Accessories', price: 13.99, quantity: 38, reorderLevel: 10 },
  { id: '24', sku: 'SKU-024', name: 'Mouse Pad Large', category: 'Accessories', price: 17.99, quantity: 65, reorderLevel: 20 },
];

export const getItems = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getInitialData()));
    return getInitialData();
  }
  let parsed = JSON.parse(data);
  // Auto-seed to test scrolling if items are few
  if (parsed.length < 20) {
    parsed = getInitialData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  }
  return parsed;
};

export const saveItem = (item) => {
  const items = getItems();
  const index = items.findIndex((i) => i.id === item.id);
  if (index >= 0) {
    items[index] = item;
  } else {
    items.push({ ...item, id: Date.now().toString() });
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items;
};

export const deleteItem = (id) => {
  const items = getItems();
  const newItems = items.filter((i) => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  return newItems;
};

export const updateQuantity = (id, delta) => {
  const items = getItems();
  const index = items.findIndex((i) => i.id === id);
  if (index >= 0) {
    items[index].quantity = Math.max(0, items[index].quantity + delta);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }
  return items;
};

export const getItemBySku = (sku) => {
  const items = getItems();
  return items.find(i => i.sku.toLowerCase() === sku.toLowerCase());
};

export const getTransactions = () => {
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveTransaction = (transaction) => {
  const transactions = getTransactions();
  const newTransaction = {
    ...transaction,
    id: Date.now().toString(),
    date: new Date().toISOString()
  };
  transactions.push(newTransaction);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  return newTransaction;
};
