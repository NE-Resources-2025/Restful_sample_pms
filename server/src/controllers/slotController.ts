import { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

interface SlotInput {
  slotNumber: string;
  size: string;
  vehicleType: string;
  location: string;
}

export const bulkCreateSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { slots }: { slots: SlotInput[] } = req.body;
  try {
    const createdSlots = await prisma.parkingSlot.createMany({
      data: slots.map(slot => ({
        slotNumber: slot.slotNumber,
        size: slot.size,
        vehicleType: slot.vehicleType,
        location: slot.location,
        status: 'available',
      })),
    });

    await prisma.log.create({
      data: { userId, action: `Bulk created ${slots.length} slots` },
    });

    const newSlots = await prisma.parkingSlot.findMany({
      where: { slotNumber: { in: slots.map(s => s.slotNumber) } },
    });

    res.status(201).json(newSlots);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Slot number already exists or server error' });
  }
};

export const getSlots = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const isAdmin = req.user?.role === 'admin';
  const { page = '1', limit = '10', search = '' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;
  const searchQuery = `%${search}%`;

  try {
    const where = {
      OR: [
        { slotNumber: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { vehicleType: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
      ],
      ...(isAdmin ? {} : { status: 'available' }),
    };

    const [slots, totalItems] = await Promise.all([
      prisma.parkingSlot.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: 'asc' },
      }),
      prisma.parkingSlot.count({ where }),
    ]);

    await prisma.log.create({
      data: { userId, action: 'Slots list viewed' },
    });

    res.json({
      data: slots,
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

export const updateSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { slotNumber, size, vehicleType, location } = req.body;
  try {
    const slot = await prisma.parkingSlot.update({
      where: { id: parseInt(id, 10) },
      data: { slotNumber, size, vehicleType, location },
    });

    await prisma.log.create({
      data: { userId, action: `Slot ${slotNumber} updated` },
    });

    res.json(slot);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Slot number already exists or server error' });
  }
};

export const deleteSlot = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;
  try {
    const slot = await prisma.parkingSlot.delete({
      where: { id: parseInt(id, 10) },
      select: { slotNumber: true },
    });

    await prisma.log.create({
      data: { userId, action: `Slot ${slot.slotNumber} deleted` },
    });

    res.json({ message: 'Slot deleted' });
  } catch (error) {
    console.error(error);
    res.status(404).json({ error: 'Slot not found' });
  }
};