
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// Middleware must be applied first
app.use(cors());
app.use(express.json());

// Menu routes
const menuRoutes = require('./routes/menu');
app.use('/menu', menuRoutes);

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Order routes
const orderRoutes = require('./routes/order');
app.use('/order', orderRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Backend API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
