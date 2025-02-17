const express = require('express');
const app = express();
const servers = ['http://localhost:3001', 'http://localhost:3002'];
let currentIndex = 0;

app.get('/getServer', (req, res) => {
    const server = servers[currentIndex];
    currentIndex = (currentIndex + 1) % servers.length;
    res.json({ code: 200, server });
});

app.listen(3000, () => {
    console.log('DNS Registry running on http://localhost:3000');
});