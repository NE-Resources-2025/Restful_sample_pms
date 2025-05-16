import { Router } from 'express';
import { createRequest, getRequests, updateRequest, deleteRequest, approveRequest, rejectRequest } from "../controllers/requestController";
import { authenticate, isAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/slot-requests:
 *   post:
 *     summary: Create a new slot request
 *     tags: [Slot Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId]
 *             properties:
 *               vehicleId: { type: integer }
 *     responses:
 *       201: { description: Slot request created }
 *       401: { description: Unauthorized }
 *       404: { description: Vehicle not found }
 *       500: { description: Server error }
 */
router.post('/', authenticate, createRequest);

/**
 * @swagger
 * /api/slot-requests:
 *   get:
 *     summary: List slot requests
 *     tags: [Slot Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of slot requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: integer }
 *                       userId: { type: integer }
 *                       vehicleId: { type: integer }
 *                       requestStatus: { type: string }
 *                       plateNumber: { type: string }
 *                       vehicleType: { type: string }
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalItems: { type: integer }
 *                     currentPage: { type: integer }
 *                     totalPages: { type: integer }
 *                     limit: { type: integer }
 *       401: { description: Unauthorized }
 *       500: { description: Server error }
 */
router.get('/', authenticate, getRequests);

/**
 * @swagger
 * /api/slot-requests/{id}:
 *   put:
 *     summary: Update a slot request
 *     tags: [Slot Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId]
 *             properties:
 *               vehicleId: { type: integer }
 *     responses:
 *       200: { description: Slot request updated }
 *       401: { description: Unauthorized }
 *       404: { description: Request not found }
 *       500: { description: Server error }
 */
router.put('/:id', authenticate, updateRequest);

/**
 * @swagger
 * /api/slot-requests/{id}:
 *   delete:
 *     summary: Delete a slot request
 *     tags: [Slot Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200: { description: Slot request deleted }
 *       401: { description: Unauthorized }
 *       404: { description: Request not found }
 *       500: { description: Server error }
 */
router.delete('/:id', authenticate, deleteRequest);

/**
 * @swagger
 * /api/slot-requests/{id}/approve:
 *   post:
 *     summary: Approve a slot request (admin only)
 *     tags: [Slot Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Slot request approved
 *       400: { description: No compatible slots }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Request not found }
 *       500: { description: Server error }
 */
router.post('/:id/approve', authenticate, isAdmin, approveRequest);

/**
 * @swagger
 * /api/slot-requests/{id}/reject:
 *   post:
 *     summary: Reject a slot request (admin only)
 *     tags: [Slot Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Slot request rejected
 *       400: { description: Reason required }
 *       401: { description: Unauthorized }
 *       403: { description: Forbidden }
 *       404: { description: Request not found }
 *       500: { description: Server error }
 */
router.post('/:id/reject', authenticate, isAdmin, rejectRequest);

export default router;