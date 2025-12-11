import { Router } from 'express';
import * as financeService from '../services/finance.service';

const router = Router();

// GET /api/finance/summary
router.get('/summary', async (req, res, next) => {
    try {
        const tenantId = req.user!.tenantId;
        const summary = await financeService.getFinancialSummary(tenantId);
        res.json(summary);
    } catch (error: any) {
        next(error);
    }
});

// GET /api/finance/report
router.get('/report', async (req, res, next) => {
    try {
        const tenantId = req.user!.tenantId;
        const { start_date, end_date, professionalId } = req.query;

        const report = await financeService.getDetailedReport(
            tenantId,
            start_date as string,
            end_date as string,
            professionalId as string
        );
        res.json(report);
    } catch (error: any) {
        next(error);
    }
});

export default router;
