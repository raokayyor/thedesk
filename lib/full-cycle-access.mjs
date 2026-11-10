import {hasAccess} from './report-store.mjs';
// Explicit preview-only review override. Normal free accounts require membership.
export const FULL_CYCLE_REVIEW_MODE=process.env.VERCEL_ENV==='preview'&&process.env.FULL_CYCLE_REVIEW_MODE==='true';
export async function fullCycleAccess(record){return !!record&&(FULL_CYCLE_REVIEW_MODE||await hasAccess(record))}
