const express = require('express');
const adminRoutes = require('../src/routes/adminRoutes');

const app = express();
const port = process.env.PORT || 8080; // Local: 3000, Cloud Run: 8080

app.use(express.json());
app.use('/api', adminRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});