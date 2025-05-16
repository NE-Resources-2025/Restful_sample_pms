import express, { Express } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from "./swagger";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import vehicleRoutes from "./routes/vehicleRoutes";
import slotRoutes from "./routes/slotRoutes";
import requestRoutes from "./routes/requestRoutes";
import logRoutes from "./routes/logRoutes";

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/parking-slots', slotRoutes);
app.use('/api/slot-requests', requestRoutes);
app.use('/api/logs', logRoutes);

const PORT: number = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));