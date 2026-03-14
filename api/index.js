const express = require('express');
const cors = require('cors');
require('dotenv').config();

const restaurantsRouter = require('./restaurants');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', restaurantsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
