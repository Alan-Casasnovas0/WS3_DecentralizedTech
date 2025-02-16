const express = require('express');
const app = express();
const port = process.env.PORT || 3002;

app.get('/getServer', (req, res) => {
  res.json({ "code": 200, "server": `localhost:${port}` });
});

app.listen(port, () => {
  console.log(`DNS Registry running on port ${port}`);
});
