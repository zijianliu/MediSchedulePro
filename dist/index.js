"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const errorHandler_1 = require("./middleware/errorHandler");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const doctor_routes_1 = __importDefault(require("./routes/doctor.routes"));
const schedule_routes_1 = __importDefault(require("./routes/schedule.routes"));
const appointment_routes_1 = __importDefault(require("./routes/appointment.routes"));
const visit_routes_1 = __importDefault(require("./routes/visit.routes"));
const refund_routes_1 = __importDefault(require("./routes/refund.routes"));
const log_routes_1 = __importDefault(require("./routes/log.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/doctors', doctor_routes_1.default);
app.use('/api/schedules', schedule_routes_1.default);
app.use('/api/appointments', appointment_routes_1.default);
app.use('/api/visit', visit_routes_1.default);
app.use('/api/refunds', refund_routes_1.default);
app.use('/api/logs', log_routes_1.default);
app.use('/api/notifications', notification_routes_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'MediSchedulePro API is running' });
});
app.use(errorHandler_1.errorHandler);
app.listen(PORT, () => {
    console.log(`MediSchedulePro server is running on http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map