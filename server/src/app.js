import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middlewares/errorHandler.js';

// Load biến môi trường
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(cors({
  origin: '*', // Cho phép kết nối từ mọi client frontend trong môi trường dev
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());

// Request logging & Server Instance header
app.use((req, res, next) => {
  res.setHeader('X-Server-Instance', process.env.SERVER_NAME || 'Node-App');
  console.log(`[${new Date().toISOString()}][${process.env.SERVER_NAME || 'Node-App'}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverInstance: process.env.SERVER_NAME || 'Node-App',
    timestamp: new Date(),
  });
});

// Đăng ký Business Routes
app.use('/api', userRoutes);

// Global Error Handler
app.use(errorHandler);

// Khởi chạy server nếu chạy trực tiếp
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy trên cổng ${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api/users`);
  });
}

export default app;

