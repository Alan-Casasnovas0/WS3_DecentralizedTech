const express = require('express');
const { Queue } = require('bull');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(express.json());

// Primary SQLite Database
const primaryDB = new sqlite3.Database('./primary.db');

// Replication Queue
const replicationQueue = new Queue('db-replication', {
    redis: { host: 'localhost', port: 6379 }
});

// Initialize databases
primaryDB.serialize(() => {
    primaryDB.run(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            name TEXT,
            description TEXT,
            price REAL,
            category TEXT,
            stock INTEGER,
            created_at DATETIME
        )
    `);
});

// Async write handler
function asyncWrite(operation) {
    return new Promise((resolve, reject) => {
        primaryDB.run(
            'INSERT INTO products(id, name, description, price, category, stock, created_at) VALUES(?, ?, ?, ?, ?, ?, ?)',
            [
                operation.product.id,
                operation.product.name,
                operation.product.description,
                operation.product.price,
                operation.product.category,
                operation.product.stock,
                operation.product.createdAt
            ],
            (err) => {
                if (err) return reject(err);
                
                // Add to replication queue
                replicationQueue.add('replicate', operation);
                resolve();
            }
        );
    });
}

// Products Routes with Async
app.post('/products', async (req, res) => {
    const newProduct = {
        id: uuidv4(),
        ...req.body,
        createdAt: new Date().toISOString()
    };
    
    try {
        await asyncWrite({ type: 'CREATE_PRODUCT', product: newProduct });
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(500).json({ error: 'Primary write failed' });
    }
});

// Queue processor
replicationQueue.process(async (job) => {
    const { type, product } = job.data;
    
    // Here you would implement replication to secondary database(s)
    console.log('Replicating:', product.id);
    // Example: Write to JSON file
    const fs = require('fs');
    fs.appendFileSync('replica.log', JSON.stringify(product) + '\n');
});

app.listen(3003, () => {
    console.log('Asynchronous Replication API running on http://localhost:3003');
});