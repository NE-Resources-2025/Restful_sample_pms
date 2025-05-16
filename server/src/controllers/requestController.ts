import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendApprovalEmail, sendRejectionEmail } from '../utils/email';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: { id: number; role: string };
}

export const createRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { vehicleId } = req.body;
  if (typeof userId !== 'number') {
    res.status(401).json({ error: 'Unauthorized: user ID missing' });
    return;
  }
  try {
    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const request = await prisma.slotRequest.create({
      data: {
        userId,
        vehicleId,
        requestStatus: 'pending',
      },
    });

    await prisma.log.create({
      data: { userId, action: `Slot request ${request.id} created for vehicle ${vehicle.plateNumber}` },
    });

    res.status(201).json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getRequests = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const isAdmin = req.user?.role === 'admin';
  const { page = '1', limit = '10', search = '' } = req.query;
  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const skip = (pageNum - 1) * limitNum;
  const searchQuery = `%${search}%`;

  try {
    const where = isAdmin
      ? {
          OR: [
            { vehicle: { plateNumber: { contains: search as string, mode: 'insensitive' as const } } },
            { vehicle: { vehicleType: { contains: search as string, mode: 'insensitive' as const } } },
          ],
        }
      : {
          userId,
          OR: [
            { vehicle: { plateNumber: { contains: search as string, mode: 'insensitive' as const } } },
            { vehicle: { vehicleType: { contains: search as string, mode: 'insensitive' as const } } },
          ],
        };

    const [requests, totalItems] = await Promise.all([
      prisma.slotRequest.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { id: 'asc' },
        include: {
          vehicle: { select: { plateNumber: true, vehicleType: true } },
          user: { select: { email: true } },
        },
      }),
      prisma.slotRequest.count({ where }),
    ]);

    await prisma.log.create({
      data: { userId, action: 'Slot requests list viewed' },
    });

    res.json({
      data: requests.map(r => ({
        ...r,
        plateNumber: r.vehicle.plateNumber,
        vehicleType: r.vehicle.vehicleType,
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

export const updateRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { vehicleId } = req.body;
  try {
    const request = await prisma.slotRequest.findFirst({
      where: { id: parseInt(id, 10), userId, requestStatus: 'pending' },
    });
    if (!request) {
      res.status(404).json({ error: 'Request not found or not editable' });
      return;
    }

    const vehicle = await prisma.vehicle.findFirst({ where: { id: vehicleId, userId } });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }

    const updatedRequest = await prisma.slotRequest.update({
      where: { id: parseInt(id, 10) },
      data: { vehicleId },
    });

    await prisma.log.create({
      data: { userId, action: `Slot request ${id} updated` },
    });

    res.json(updatedRequest);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const deleteRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;
  try {
    const request = await prisma.slotRequest.findFirst({
      where: { id: parseInt(id, 10), userId, requestStatus: 'pending' },
    });
    if (!request) {
      res.status(404).json({ error: 'Request not found or not deletable' });
      return;
    }

    await prisma.slotRequest.delete({ where: { id: parseInt(id, 10) } });
    await prisma.log.create({
      data: { userId, action: `Slot request ${id} deleted` },
    });

    res.json({ message: 'Request deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const approveRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;
  try {
    const request = await prisma.slotRequest.findFirst({
      where: { id: parseInt(id, 10), requestStatus: 'pending' },
      include: { vehicle: true, user: true },
    });
    if (!request) {
      res.status(404).json({ error: 'Request not found or already processed' });
      return;
    }

    const slot = await prisma.parkingSlot.findFirst({
      where: {
        status: 'available',
        vehicleType: request.vehicle.vehicleType,
        size: request.vehicle.size,
      },
    });
    if (!slot) {
      res.status(400).json({ error: 'No compatible slots available' });
      return;
    }

    const updatedRequest = await prisma.slotRequest.update({
      where: { id: parseInt(id, 10) },
      data: {
        requestStatus: 'approved',
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        approvedAt: new Date(),
      },
    });

    await prisma.parkingSlot.update({
      where: { id: slot.id },
      data: { status: 'occupied' },
    });

    const emailStatus = await sendApprovalEmail(request.user.email, slot.slotNumber);
    await prisma.log.create({
      data: { userId, action: `Slot request ${id} approved for slot ${slot.slotNumber}` },
    });

    res.json({ message: 'Request approved', slot, emailStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const rejectRequest = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const request = await prisma.slotRequest.findFirst({
      where: { id: parseInt(id, 10), requestStatus: 'pending' },
      include: { user: true },
    });
    if (!request) {
      res.status(404).json({ error: 'Request not found or already processed' });
      return;
    }

    if (!reason) {
      res.status(400).json({ error: 'Rejection reason required' });
      return;
    }

    const updatedRequest = await prisma.slotRequest.update({
      where: { id: parseInt(id, 10) },
      data: { requestStatus: 'rejected' },
    });

    const emailStatus = await sendRejectionEmail(request.user.email, reason);
    await prisma.log.create({
      data: { userId, action: `Slot request ${id} rejected` },
    });

    res.json({ message: 'Request rejected', request: updatedRequest, emailStatus });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};