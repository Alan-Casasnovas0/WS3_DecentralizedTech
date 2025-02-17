const express = require('express');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// PostgreSQL Configuration
const pgPool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'ecommerce',
    password: 'password',
    port: 5432,
});

// MongoDB Configuration
const mongoClient = new MongoClient('mongodb://localhost:27017');
let mongoCollection;

async function initDatabases() {
    // Initialize PostgreSQL
    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS products (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255),
            description TEXT,
            price DECIMAL,
            category VARCHAR(255),
            stock INT,
            created_at TIMESTAMP
        )
    `);
    
    // Initialize MongoDB
    await mongoClient.connect();
    mongoCollection = mongoClient.db('ecommerce').collection('products');
    await mongoCollection.createIndex({ id: 1 }, { unique: true });
}

// Synchronous write handler
async function syncWrite(operation) {
    try {
        // Execute on PostgreSQL
        await pgPool.query(
            'INSERT INTO products(id, name, description, price, category, stock, created_at) VALUES($1, $2, $3, $4, $5, $6, $7)',
            [
                operation.product.id,
                operation.product.name,
                operation.product.description,
                operation.product.price,
                operation.product.category,
                operation.product.stock,
                new Date(operation.product.createdAt)
            ]
        );
        
        // Execute on MongoDB
        await mongoCollection.insertOne(operation.product);
        
        return true;
    } catch (error) {
        console.error('Sync write failed:', error);
        // Rollback logic would go here
        return false;
    }
}

// Products Routes with Sync
app.post('/products', async (req, res) => {
    const newProduct = {
        id: uuidv4(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    const success = await syncWrite({ type: 'CREATE_PRODUCT', product: newProduct });
    
    if (success) {
        res.status(201).json(newProduct);
    } else {
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.listen(3002, async () => {
    await initDatabases();
    console.log('Synchronous Mirroring API running on http://localhost:3002');
});