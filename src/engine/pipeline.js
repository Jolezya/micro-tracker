// =============================================================================
//  PIPELINE — single entry point that composes the whole model
// -----------------------------------------------------------------------------
//  results -> aggregate -> buildModel -> pointForecast -> Monte Carlo -> race
//  The UI calls computeForecast() (or the useForecast hook) and gets everything.
// =============================================================================

import { useMemo } from 'react';
import { aggregate, outstandingAreas } from './aggregate.js';
import { buildModel, pointForecast } from './forecast.js';
import { runMonteCarlo } from './monteCarlo.js';
import { analyzeRace } from './runoff.js';
import { generateExplanation } from './explain.js';
import { useStore, selectors } from '../data/store.js';

const DEFAULT_SEED = 20260813; // fixed seed => reproducible probabilities

export function computeForecast(results, { scenario = {}, iterations = 4000, seed = DEFAULT_SEED } = {}) {
  const agg = aggregate(results);
  const model = buildModel(agg, scenario);
  const point = pointForecast(model);
  const mc = runMonteCarlo(model, { iterations, seed });
  const race = analyzeRace(agg, model, point, mc);
  const explanation = generateExplanation({ agg, model, point, mc, race });
  const outstanding = outstandingAreas(agg);
  return { agg, model, point, mc, race, explanation, outstanding, swing: model.swing };
}

/** Live forecast from the store (memoised on the active/included result set). */
export function useForecast({ scenario = {}, iterations = 4000, seed = DEFAULT_SEED } = {}) {
  const state = useStore();
  const included = selectors.includedResults(state);
  // Cheap signature so we only recompute when included data actually changes.
  const sig = included.map((r) => `${r.id}:${r.includedInModel}:${r.receivedAt}`).join('|');
  const scenSig = JSON.stringify(scenario);
  return useMemo(
    () => computeForecast(state.results, { scenario, iterations, seed }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sig, scenSig, iterations, seed]
  );
}
