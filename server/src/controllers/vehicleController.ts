import { Request, Response } from 'express';
import { PrismaClient, Vehicle, SlotRequest, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const createVehicle = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { plateNumber, vehicleType, size, otherAttributes } = req.body;

  if (!userId || typeof userId !== 'number') {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  if (!plateNumber || typeof plateNumber !== 'string') {
    res.status(400).json({ error: 'Plate number is required and must be a string' });
    return;
  }
  if (!vehicleType || !['car', 'truck', 'motorcycle'].includes(vehicleType)) {
    res.status(400).json({ error: 'Vehicle type is required and must be one of: car, truck, motorcycle' });
    return;
  }
  if (!size || !['small', 'medium', 'large'].includes(size)) {
    res.status(400).json({ error: 'Size is required and must be one of: small, medium, large' });
    return;
  }
  if (otherAttributes && typeof otherAttributes !== 'object') {
    res.status(400).json({ error: 'Other attributes must be a valid JSON object' });
    return;
  }

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        userId,
        plateNumber,
        vehicleType,
        size,
        otherAttributes: otherAttributes || {},
      },
      include: { user: { select: { email: true } } },
    });

    await prisma.log.create({
      data: {
        userId,
        action: `Vehicle ${plateNumber} created`,
      },
    });

    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(400).json({ error: `Vehicle with plate number ${plateNumber} already exists` });
    } else if (error instanceof Prisma.PrismaClientValidationError) {
      res.status(400).json({ error: 'Invalid input data' });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
};

// Define a type for the vehicle with slotRequests
type VehicleWithSlotRequests = Vehicle & {
  slotRequests: Pick<SlotRequest, 'requestStatus'>[];
};

export const getVehicles = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const isAdmin = req.user?.role === 'admin';
  const { page = '1', limit = '10', search = '' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;
  const searchQuery = search as string;

  try {
    // Use Prisma's QueryMode type for 'mode'
    const searchFilter: Prisma.StringFilter = {
      contains: searchQuery,
      mode: 'insensitive',
    };

    const where: Prisma.VehicleWhereInput = isAdmin
      ? {
          OR: [
            { plateNumber: searchFilter },
            { vehicleType: searchFilter },
          ],
        }
      : {
          userId,
          OR: [
            { plateNumber: searchFilter },
            { vehicleType: searchFilter },
          ],
        };

    // Remove explicit type annotation, let TypeScript infer from Prisma
    const [vehicles, totalItems] = await Promise.all([
      prisma.vehicle.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          slotRequests: {
            where: { requestStatus: 'approved' },
            select: { requestStatus: true },
            take: 1,
          },
        },
      }),
      prisma.vehicle.count({ where }),
    ]);

    await prisma.log.create({
      data: {
        userId,
        action: 'Vehicles list viewed',
      },
    });

    res.json({
      data: vehicles.map(v => ({
        ...v,
        approvalStatus: v.slotRequests && v.slotRequests.length > 0 ? v.slotRequests[0].requestStatus : null,
      })),
      meta: {
        totalItems,
        currentPage: pageNum,
        totalPages: Math.ceil(totalItems / limitNum),
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};