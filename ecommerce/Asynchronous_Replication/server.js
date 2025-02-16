const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 3001;

app.use(bodyParser.json());

const PRIMARY_DB = './db_primary.json';
const SECONDARY_DB = './db_secondary.json';

// Initialisation de la base si elle n'existe pas
function initDB() {
  if (!fs.existsSync(PRIMARY_DB)) {
    const initData = { products: [], orders: [], carts: {} };
    fs.writeFileSync(PRIMARY_DB, JSON.stringify(initData, null, 2));
    fs.writeFileSync(SECONDARY_DB, JSON.stringify(initData, null, 2));
  }
}
initDB();

// Fonction de lecture depuis la base primaire
function readDB() {
  return JSON.parse(fs.readFileSync(PRIMARY_DB, 'utf8'));
}

// Fonction d'écriture dans la base primaire et réplication asynchrone vers la base secondaire
function writeDB(data) {
  // Écriture immédiate dans la base primaire
  fs.writeFileSync(PRIMARY_DB, JSON.stringify(data, null, 2));
  // Réplication asynchrone après 5 secondes
  setTimeout(() => {
    fs.writeFileSync(SECONDARY_DB, JSON.stringify(data, null, 2));
    console.log('Données répliquées asynchronement vers la base secondaire');
  }, 5000);
}

// ----------------------
// Routes Produits
// ----------------------

// GET /products (avec filtres optionnels : category, inStock)
app.get('/products', (req, res) => {
  const db = readDB();
  let products = db.products;
  if (req.query.category) {
    products = products.filter(p => p.category === req.query.category);
  }
  if (req.query.inStock) {
    const inStock = req.query.inStock === 'true';
    products = products.filter(p => inStock ? p.stock > 0 : p.stock <= 0);
  }
  res.json(products);
});

// GET /products/:id
app.get('/products/:id', (req, res) => {
  const db = readDB();
  const product = db.products.find(p => p.id == req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// POST /products
app.post('/products', (req, res) => {
  const db = readDB();
  const newProduct = { ...req.body, id: Date.now() };
  db.products.push(newProduct);
  writeDB(db);
  res.json(newProduct);
});

// PUT /products/:id
app.put('/products/:id', (req, res) => {
  const db = readDB();
  let product = db.products.find(p => p.id == req.params.id);
  if (product) {
    product = { ...product, ...req.body };
    db.products = db.products.map(p => p.id == req.params.id ? product : p);
    writeDB(db);
    res.json(product);
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// DELETE /products/:id
app.delete('/products/:id', (req, res) => {
  const db = readDB();
  const initialLength = db.products.length;
  db.products = db.products.filter(p => p.id != req.params.id);
  if (db.products.length < initialLength) {
    writeDB(db);
    res.json({ message: "Product deleted successfully" });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
});

// ----------------------
// Routes Commandes
// ----------------------

// POST /orders
app.post('/orders', (req, res) => {
  const db = readDB();
  const newOrder = {
    id: Date.now(),
    products: req.body.products,
    total: req.body.total || 0,
    status: "created",
    userId: req.body.userId || null
  };
  db.orders.push(newOrder);
  writeDB(db);
  res.json(newOrder);
});

// GET /orders/:userId
app.get('/orders/:userId', (req, res) => {
  const db = readDB();
  const orders = db.orders.filter(o => o.userId == req.params.userId);
  res.json(orders);
});

// ----------------------
// Routes Panier
// ----------------------

// POST /cart/:userId
app.post('/cart/:userId', (req, res) => {
  const db = readDB();
  const userId = req.params.userId;
  if (!db.carts[userId]) {
    db.carts[userId] = [];
  }
  db.carts[userId].push(req.body);
  writeDB(db);
  res.json(db.carts[userId]);
});

// GET /cart/:userId
app.get('/cart/:userId', (req, res) => {
  const db = readDB();
  res.json(db.carts[req.params.userId] || []);
});

app.get('/', (req, res) => {
    res.send('Bienvenue sur le serveur Node.js !');
});


// DELETE /cart/:userId/item/:productId
app.delete('/cart/:userId/item/:productId', (req, res) => {
  const db = readDB();
  const userId = req.params.userId;
  if (db.carts[userId]) {
    db.carts[userId] = db.carts[userId].filter(item => item.productId != req.params.productId);
    writeDB(db);
    res.json(db.carts[userId]);
  } else {
    res.status(404).json({ error: "Cart not found" });
  }
});

app.listen(port, () => {
  console.log(`Asynchronous Replication server running on port ${port}`);
});
