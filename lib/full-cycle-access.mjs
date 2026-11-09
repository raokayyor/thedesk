import {hasAccess} from './report-store.mjs';
// Temporary product-review mode requested by the site owner. No payment records are changed.
// Set false when restoring checkout; assessment ownership checks still apply in every route.
export const FULL_CYCLE_REVIEW_MODE=true;
export async function fullCycleAccess(record){return !!record&&(FULL_CYCLE_REVIEW_MODE||await hasAccess(record))}
