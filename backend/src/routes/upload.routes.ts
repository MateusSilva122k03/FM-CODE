import { Router } from 'express';
import { upload, getFileUrl } from '../services/storage.service';
import { prismaClient } from '../lib/prisma';
import { BadRequestError, NotFoundError } from '../errors/AppError';

const router = Router({ mergeParams: true });

// POST /api/appointments/:id/proof/upload
router.post('/:id/proof/upload', upload.single('file'), async (req, res, next) => {
    try {
        const { id } = req.params;
        const tenantId = req.user!.tenantId;

        if (!req.file) {
            throw new BadRequestError('No file uploaded');
        }

        // 1. Verify Appointment matches Tenant
        const appointment = await prismaClient.appointment.findFirst({
            where: { id, tenantId }
        });

        if (!appointment) {
            throw new NotFoundError('Appointment not found');
        }

        const fileUrl = getFileUrl(req.file.filename);

        // 2. Transaction: Create Proof + Update Status
        const result = await prismaClient.$transaction(async (tx) => {
            const proof = await tx.paymentProof.create({
                data: {
                    url: fileUrl,
                    appointmentId: id,
                    tenantId
                }
            });

            await tx.appointment.update({
                where: { id },
                data: { paymentStatus: 'PENDING_APPROVAL' }
            });

            return proof;
        });

        res.status(201).json(result);

    } catch (error: any) {
        next(error);
    }
});

export default router;
