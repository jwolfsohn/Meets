import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import profileRoutes from './routes/profile';
import matchRoutes from './routes/match';
import scheduleRoutes from './routes/schedule';
import { CLIENT_ORIGIN, IS_PROD } from './config';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// In dev, reflect the request origin to avoid CORS friction (localhost vs 127.0.0.1 vs LAN IP).
// In prod, lock down to a single configured origin.
app.use(cors({ origin: IS_PROD ? CLIENT_ORIGIN : true }));
app.use(express.json({ limit: '1mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/schedule', scheduleRoutes);

app.get('/', (req, res) => {
    res.send('Dating App API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
