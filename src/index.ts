import express from 'express';
import path from 'path';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth.routes';
import departmentRoutes from './routes/department.routes';
import doctorRoutes from './routes/doctor.routes';
import scheduleRoutes from './routes/schedule.routes';
import appointmentRoutes from './routes/appointment.routes';
import visitRoutes from './routes/visit.routes';
import refundRoutes from './routes/refund.routes';
import logRoutes from './routes/log.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/visit', visitRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MediSchedulePro API is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`MediSchedulePro server is running on http://localhost:${PORT}`);
});

export default app;
