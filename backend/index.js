const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
require('dotenv').config();
connectDB();
const cookieParser = require('cookie-parser');
require('dotenv').config();
const http = require('http');
const app = express();
connectDB();
app.use(cors());
app.use(cookieParser());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/news', require('./routes/newsRoutes'));

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
