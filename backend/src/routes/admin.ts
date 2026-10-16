/**
 * INSURE — Insurance Admin / Owner Routes
 */

import express, { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth, requireAdmin } from '../middleware/auth';
import { getClient } from '../db/client';
import { logAuditEvent } from '../services/auditService';
import { createError } from '../middleware/errorHandler';

const router = express.Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get('/portfolio', async (req: any, res: Response, next: NextFunction) => {
  try {
    const db = getClient();

    const { data: users } = await db.from('users').select('*');
    const { data: trips } = await db.from('trips').select('*');
    const { data: quotes } = await db.from('quotes').select('*');
    const { data: assessments } = await db.from('risk_assessments').select('*');
    const { data: disputes } = await db.from('pricing_disputes').select('*');

    const allUsers = users || [];
    const allQuotes = quotes || [];
    const allTrips = trips || [];
    const allAssessments = assessments || [];
    const allDisputes = disputes || [];

    // Only count actual customers (not admin / compliance accounts)
    const totalCustomers = allUsers.filter((u: any) => u.role === 'customer').length;
    const verifiedCustomers = allUsers.filter((u: any) => u.role === 'customer' && u.is_email_verified).length;

    const totalQuotes = allQuotes.length;
    const totalPremiumVolume = allQuotes.reduce((acc: number, q: any) => acc + (parseFloat(q.illustrative_estimate) || 0), 0);
    const avgPremium = totalQuotes > 0 ? Math.round(totalPremiumVolume / totalQuotes) : 0;

    // ── Actuarial Ratios ─────────────────────────────────────────────────────
    // Earned premium: sum of actual quotes if present, else verified customers × base premium
    const basePremium = parseFloat(process.env.BASE_PREMIUM || '2000');
    const earnedPremium = totalPremiumVolume > 0
      ? totalPremiumVolume
      : Math.max(verifiedCustomers, 1) * basePremium;

    const { data: accidents } = await db.from('accident_records').select('*');
    const { data: finScenarios } = await db.from('financial_scenarios').select('*').limit(1);
    const allAccidents = accidents || [];
    const totalClaimsAmount = allAccidents.reduce((acc: number, a: any) => acc + (parseFloat(a.claim_amount) || 0), 0);

    // Loss Ratio = Claims Incurred / Earned Premium (%)
    const lossRatioPct = earnedPremium > 0
      ? (totalClaimsAmount / earnedPremium) * 100
      : 0;
    const lossRatioVal = lossRatioPct.toFixed(1) + '%';

    // Expense Ratio: use actual operating expenses if available, else standard 30% industry loading
    const operatingExpActual = (finScenarios && finScenarios[0]?.operating_expenses)
      ? parseFloat(finScenarios[0].operating_expenses)
      : null;
    const operatingExp = operatingExpActual !== null ? operatingExpActual : earnedPremium * 0.30;
    const expenseRatioPct = earnedPremium > 0 ? (operatingExp / earnedPremium) * 100 : 30;

    // Combined Ratio = Loss Ratio + Expense Ratio (industry standard)
    const combinedRatioPct = lossRatioPct + expenseRatioPct;
    const combinedRatioVal = combinedRatioPct.toFixed(1) + '%';

    // Active trips = only those with status 'in_progress' or created in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const activeTripsCount = allTrips.filter((t: any) =>
      t.status === 'in_progress' || (t.created_at && t.created_at >= sevenDaysAgo)
    ).length;

    const scoredAssessments = allAssessments.filter((a: any) => a.safety_score != null);
    const lowRiskCount    = scoredAssessments.filter((a: any) => a.safety_score >= 80).length;
    const mediumRiskCount = scoredAssessments.filter((a: any) => a.safety_score >= 50 && a.safety_score < 80).length;
    const highRiskCount   = scoredAssessments.filter((a: any) => a.safety_score < 50).length;

    res.json({
      portfolio: {
        totalCustomers,
        verifiedCustomers,
        totalTrips: allTrips.length,
        activeTrips: activeTripsCount,
        totalQuotes,
        earnedPremium: Math.round(earnedPremium),
        totalPremiumVolume: Math.round(totalPremiumVolume),
        avgAnnualPremium: avgPremium,
        totalClaimsAmount: Math.round(totalClaimsAmount),
        lossRatio: lossRatioVal,
        lossRatioPct: parseFloat(lossRatioPct.toFixed(1)),
        expenseRatio: expenseRatioPct.toFixed(1) + '%',
        combinedRatio: combinedRatioVal,
        combinedRatioPct: parseFloat(combinedRatioPct.toFixed(1)),
        activeDisputes: allDisputes.filter((d: any) => d.status === 'pending').length,
        riskDistribution: {
          lowRisk: lowRiskCount,
          mediumRisk: mediumRiskCount,
          highRisk: highRiskCount,
        },
      },
      pricingConfig: {
        currency: process.env.CURRENCY || 'INR',
        currencySymbol: process.env.CURRENCY_SYMBOL || '₹',
        basePremium: parseFloat(process.env.BASE_PREMIUM || '2000') || 2000,
        maxAdjustment: parseFloat(process.env.MAX_RISK_ADJUSTMENT || '0.5') || 0.5,
        ruleVersion: process.env.PRICING_RULE_VERSION || 'v2.1-profitability',
      },
    });
  } catch (err) {
    next(err);
  }
});


const getUsersHandler = async (req: any, res: Response, next: NextFunction) => {
  try {
    const db = getClient();
    const { data: users, error } = await db
      .from('users')
      .select('id, email, full_name, role, status, is_email_verified, created_at')
      .order('created_at', { ascending: false });

    if (error) return next(createError(500, error.message));

    res.json({ users: users || [], customers: users || [] });
  } catch (err) {
    next(err);
  }
};
router.get('/users', getUsersHandler);
router.get('/customers', getUsersHandler);

const UpdateStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'pending_verification']),
});

const patchStatusHandler = async (req: any, res: Response, next: NextFunction) => {
  try {
    const parsed = UpdateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(400, parsed.error.errors.map(e => e.message).join('; ')));
    }

    const db = getClient();
    const { data, error } = await db
      .from('users')
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq('id', req.params.id);

    if (error) return next(createError(500, error.message));

    await logAuditEvent(req.userId, 'admin_user_status_updated', {
      target_user_id: req.params.id,
      new_status: parsed.data.status,
    });

    res.json({ message: `User status updated to ${parsed.data.status}.` });
  } catch (err) {
    next(err);
  }
};
router.patch('/users/:id/status', patchStatusHandler);
router.patch('/customers/:id/status', patchStatusHandler);

const PricingConfigSchema = z.object({
  basePremium: z.number().min(100),
  maxAdjustment: z.number().min(0.1).max(1.0),
  ruleVersion: z.string().min(2),
});

router.post('/pricing-config', async (req: any, res: Response, next: NextFunction) => {
  try {
    const parsed = PricingConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(400, parsed.error.errors.map(e => e.message).join('; ')));
    }

    process.env.BASE_PREMIUM = parsed.data.basePremium.toString();
    process.env.MAX_RISK_ADJUSTMENT = parsed.data.maxAdjustment.toString();
    process.env.PRICING_RULE_VERSION = parsed.data.ruleVersion;

    await logAuditEvent(req.userId, 'admin_pricing_config_updated', parsed.data);

    res.json({
      message: 'Pricing configuration updated and applied successfully.',
      config: parsed.data,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
