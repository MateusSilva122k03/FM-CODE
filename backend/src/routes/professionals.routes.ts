import { Router } from 'express';
import * as professionalService from '../services/professionals.service';
import availabilityRoutes from './availability.routes';

const router = Router();

router.use('/:professionalId/availability', availabilityRoutes);

router.post('/', async (req, res, next) => {
    try {
        const professional = await professionalService.createProfessional(req.body, req.user!.tenantId);
        res.status(201).json(professional);
    } catch (error: any) {
        next(error);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const professionals = await professionalService.getProfessionals(req.user!.tenantId);
        res.json(professionals);
    } catch (error: any) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const professional = await professionalService.getProfessionalById(req.params.id, req.user!.tenantId);
        if (!professional) {
            return res.status(404).json({ error: 'Professional not found' });
        }
        res.json(professional);
    } catch (error: any) {
        next(error);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const professional = await professionalService.updateProfessional(req.params.id, req.body, req.user!.tenantId);
        res.json(professional);
    } catch (error: any) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        await professionalService.deleteProfessional(req.params.id, req.user!.tenantId);
        res.status(204).send();
    } catch (error: any) {
        next(error);
    }
});

export default router;
