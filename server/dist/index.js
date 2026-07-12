"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const vehicle_routes_1 = __importDefault(require("./routes/vehicle.routes"));
const driver_routes_1 = __importDefault(require("./routes/driver.routes"));
const trip_routes_1 = __importDefault(require("./routes/trip.routes"));
const maintenance_routes_1 = __importDefault(require("./routes/maintenance.routes"));
const fuel_routes_1 = __importDefault(require("./routes/fuel.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
}));
app.use(express_1.default.json());
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/vehicles', vehicle_routes_1.default);
app.use('/api/drivers', driver_routes_1.default);
app.use('/api/trips', trip_routes_1.default);
app.use('/api/maintenance', maintenance_routes_1.default);
app.use('/api', fuel_routes_1.default); // fuel, expenses, dashboard, reports, export
// Start server
app.listen(PORT, () => {
    console.log(`🚀 TransitOps server running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map