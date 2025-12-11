import { Router } from 'express';
import * as serviceService from '../services/services.service';

const router = Router();

router.post('/', async (req, res, next) => {
    try {
        const service = await serviceService.createService(req.body, req.user!.tenantId);
        res.status(201).json(service);
    } catch (error: any) {
        next(error);
    }
});

router.get('/', async (req, res, next) => {
    try {
        const services = await serviceService.getServices(req.user!.tenantId);
        res.json(services);
    } catch (error: any) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const service = await serviceService.getServiceById(req.params.id, req.user!.tenantId);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
    } catch (error: any) {
        next(error);
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const service = await serviceService.updateService(req.params.id, req.body, req.user!.tenantId);
        res.json(service);
    } catch (error: any) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        await serviceService.deleteService(req.params.id, req.user!.tenantId);
        res.status(204).send();
    } catch (error: any) {
        next(error);
    }
});

export default router;
