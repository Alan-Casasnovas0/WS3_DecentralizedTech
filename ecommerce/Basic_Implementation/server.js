const express = require('express');
const { Low } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const { v4: uuidv4 } = require('uuid');

// Initialize database
const adapter = new JSONFileSync('database.json');
const db = new Low(adapter);

// Read the data from the file
db.read().then(() => {
    // Initialize data structure if it doesn't exist
    if (!db.data) {
        db.data = { 
            products: [],
            orders: [],
            carts: {}
        };
        db.write(); // Write the initialized data back to the file
    }
})

const app = express();
app.use(express.json());

// Products Routes
app.get('/products', (req, res) => {
    let products = db.data.products;
    
    if (req.query.category) {
        products = products.filter(p => p.category === req.query.category);
    }
    
    if (req.query.inStock === 'true') {
        products = products.filter(p => p.stock > 0);
    }
    
    res.json(products);
});

app.get('/products/:id', (req, res) => {
    const product = db.data.products.find(p => p.id === req.params.id);
    res.json(product || { error: 'Product not found' });
});

app.post('/products', (req, res) => {
    const newProduct = {
        id: uuidv4(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    db.data.products.push(newProduct);
    db.write();
    res.status(201).json(newProduct);
});

app.put('/products/:id', (req, res) => {
    const index = db.data.products.findIndex(p => p.id === req.params.id);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    db.data.products[index] = {
        ...db.data.products[index],
        ...req.body
    };
    
    db.write();
    res.json(db.data.products[index]);
});

app.delete('/products/:id', (req, res) => {
    const initialLength = db.data.products.length;
    db.data.products = db.data.products.filter(p => p.id !== req.params.id);
    
    if (db.data.products.length === initialLength) {
        return res.status(404).json({ error: 'Product not found' });
    }
    
    db.write();
    res.json({ message: 'Product deleted successfully' });
});

// Orders Routes
app.post('/orders', (req, res) => {
    const order = {
        id: uuidv4(),
        userId: req.body.userId,
        items: req.body.items,
        total: calculateTotal(req.body.items),
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    db.data.orders.push(order);
    db.write();
    res.status(201).json(order);
});

app.get('/orders/:userId', (req, res) => {
    const orders = db.data.orders.filter(o => o.userId === req.params.userId);
    res.json(orders);
});

// Cart Routes
app.post('/cart/:userId', (req, res) => {
    const userId = req.params.userId;
    const { productId, quantity } = req.body;
    
    if (!db.data.carts) db.data.carts = {};
    if (!db.data.carts[userId]) db.data.carts[userId] = [];
    
    const cart = db.data.carts[userId];
    const existingItem = cart.find(item => item.productId === productId);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({ productId, quantity });
    }
    
    db.write();
    res.json(cart);
});

app.get('/cart/:userId', (req, res) => {
    const userId = req.params.userId;
    const cart = db.data.carts?.[userId] || [];
    res.json(cart);
});

app.delete('/cart/:userId/item/:productId', (req, res) => {
    const userId = req.params.userId;
    const productId = req.params.productId;
    
    if (!db.data.carts?.[userId]) {
        return res.status(404).json({ error: 'Cart not found' });
    }
    
    db.data.carts[userId] = db.data.carts[userId].filter(item => item.productId !== productId);
    db.write();
    res.json(db.data.carts[userId]);
});

function calculateTotal(items) {
    return items.reduce((total, item) => {
        const product = db.data.products.find(p => p.id === item.productId);
        return total + (product?.price || 0) * item.quantity;
    }, 0);
}

app.listen(3001, () => {
    console.log('E-commerce API running on http://localhost:3001');
});