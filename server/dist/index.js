"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const profile_1 = __importDefault(require("./routes/profile"));
const match_1 = __importDefault(require("./routes/match"));
const schedule_1 = __importDefault(require("./routes/schedule"));
const config_1 = require("./config");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)({ origin: config_1.CLIENT_ORIGIN }));
app.use(express_1.default.json({ limit: '1mb' }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/profile', profile_1.default);
app.use('/api/matches', match_1.default);
app.use('/api/schedule', schedule_1.default);
app.get('/', (req, res) => {
    res.send('Dating App API is running');
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
