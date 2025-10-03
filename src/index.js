require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());

app.use(express.json());

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Import routes
// ... (to be added)

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Backend API' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
