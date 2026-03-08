import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureThemeCycle,
  getScheduledTheme,
  getForecastThemes,
  advanceThemeCycle,
  determineThemeDecision,
} from '../src/themes.js';

test('theme cycle defaults to dev and advances on scheduled runs', () => {
  const memory = {};
  ensureThemeCycle(memory);
  assert.equal(getScheduledTheme(memory), 'dev');

  advanceThemeCycle(memory, 'dev', {
    scheduledTheme: 'dev',
    runDate: '2026-03-08',
  });

  assert.equal(getScheduledTheme(memory), 'grassroot');
  assert.deepEqual(getForecastThemes(memory, 3), ['game', 'geo_eu', 'dev']);
});

test('override keeps the scheduled theme deferred', () => {
  const memory = {};
  ensureThemeCycle(memory);

  const cycle = advanceThemeCycle(memory, 'geo_eu', {
    scheduledTheme: 'dev',
    overrideReason: 'Geo-EU override',
    runDate: '2026-03-08',
  });

  assert.equal(cycle.nextIndex, 0);
  assert.equal(cycle.lastTheme, 'geo_eu');
  assert.equal(cycle.lastOverrideReason, 'Geo-EU override');
  assert.deepEqual(getForecastThemes(memory, 3, { overrideDeferred: true }), ['dev', 'grassroot', 'game']);
});

test('override decision requires urgent direct-impact score advantage', () => {
  const decision = determineThemeDecision({
    scheduledTheme: 'dev',
    summaries: {
      dev: { themeKey: 'dev', score: 8, urgent: false, directImpact: false },
      grassroot: { themeKey: 'grassroot', score: 9, urgent: true, directImpact: false },
      game: { themeKey: 'game', score: 6, urgent: false, directImpact: false },
      geo_eu: { themeKey: 'geo_eu', score: 14, urgent: true, directImpact: true },
    },
  });

  assert.equal(decision.resolvedTheme, 'geo_eu');
  assert.match(decision.overrideReason, /override/i);
});
