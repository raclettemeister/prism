import {
  THEME_CYCLE,
  THEME_CONFIG,
  THEME_OVERRIDE_CONFIG,
} from './config.js';

export function ensureThemeCycle(memory = {}) {
  const order = [...THEME_CYCLE.order];
  memory.themeCycle = memory.themeCycle || {};
  memory.themeCycle.order = Array.isArray(memory.themeCycle.order) && memory.themeCycle.order.length === order.length
    ? [...memory.themeCycle.order]
    : order;
  memory.themeCycle.nextIndex = Number.isInteger(memory.themeCycle.nextIndex)
    ? Math.max(0, memory.themeCycle.nextIndex % order.length)
    : 0;
  memory.themeCycle.lastTheme = memory.themeCycle.lastTheme || null;
  memory.themeCycle.lastThemeDate = memory.themeCycle.lastThemeDate || null;
  memory.themeCycle.lastOverrideReason = memory.themeCycle.lastOverrideReason || null;
  return memory.themeCycle;
}

export function getScheduledTheme(memory = {}) {
  const cycle = ensureThemeCycle(memory);
  return cycle.order[cycle.nextIndex];
}

export function themeLabel(themeKey) {
  return THEME_CONFIG[themeKey]?.label || themeKey;
}

export function themeShortLabel(themeKey) {
  return THEME_CONFIG[themeKey]?.shortLabel || themeLabel(themeKey);
}

export function listOtherThemes(themeKey) {
  return THEME_CYCLE.order.filter((key) => key !== themeKey);
}

export function getForecastThemes(memory = {}, count = THEME_CYCLE.forecastDays || 3, options = {}) {
  const cycle = ensureThemeCycle(memory);
  const offset = options.overrideDeferred ? 0 : 1;
  const themes = [];
  for (let i = 0; i < count; i++) {
    const idx = (cycle.nextIndex + offset + i) % cycle.order.length;
    themes.push(cycle.order[idx]);
  }
  return themes;
}

export function advanceThemeCycle(memory = {}, usedTheme, { scheduledTheme, overrideReason = null, runDate = null } = {}) {
  const cycle = ensureThemeCycle(memory);
  cycle.lastTheme = usedTheme;
  cycle.lastThemeDate = runDate || new Date().toISOString().slice(0, 10);
  cycle.lastOverrideReason = overrideReason || null;

  if (!overrideReason && usedTheme === scheduledTheme) {
    cycle.nextIndex = (cycle.nextIndex + 1) % cycle.order.length;
  }

  return cycle;
}

export function themeForCategory(category) {
  return Object.entries(THEME_CONFIG).find(([, config]) =>
    (config.categories || []).includes(category)
  )?.[0] || 'dev';
}

export function summarizeThemeSignals(themeKey, articles = [], webIntelResults = [], lifeContext = '') {
  const config = THEME_CONFIG[themeKey] || {};
  const textBlob = `${lifeContext}\n${articles.map(articleSignalText).join('\n')}\n${webIntelResults.map(webIntelSignalText).join('\n')}`.toLowerCase();
  const activeProjectBoost = (config.projectKeywords || []).some((keyword) => lifeContext.toLowerCase().includes(keyword));
  const directImpact = (config.directImpactKeywords || []).some((keyword) => textBlob.includes(keyword));
  const urgent = (config.urgentKeywords || []).some((keyword) => textBlob.includes(keyword));

  const topArticleScore = articles
    .slice(0, 3)
    .reduce((sum, article) => sum + scoreArticle(article), 0);
  const webIntelScore = webIntelResults
    .slice(0, 3)
    .reduce((sum, result) => sum + scoreWebIntel(result), 0);

  const score = topArticleScore + webIntelScore + (activeProjectBoost ? 3 : 0) + (directImpact ? 2 : 0) + (urgent ? 2 : 0);

  return {
    themeKey,
    score,
    urgent,
    directImpact,
    activeProjectBoost,
    topArticle: articles[0] || null,
    articleCount: articles.length,
    webIntelCount: webIntelResults.length,
  };
}

export function determineThemeDecision({
  scheduledTheme,
  summaries,
}) {
  const scheduledSummary = summaries[scheduledTheme] || { score: 0 };
  const candidates = Object.values(summaries)
    .filter((summary) => summary.themeKey !== scheduledTheme)
    .filter((summary) => summary.urgent && summary.directImpact)
    .sort((a, b) => b.score - a.score);

  const winner = candidates[0];
  if (!winner) {
    return { scheduledTheme, resolvedTheme: scheduledTheme, overrideReason: null };
  }

  const scoreThreshold = Math.max(
    scheduledSummary.score * (THEME_OVERRIDE_CONFIG.scoreMultiplier || 1.4),
    scheduledSummary.score + (THEME_OVERRIDE_CONFIG.minScoreDelta || 4)
  );

  if (winner.score < scoreThreshold) {
    return { scheduledTheme, resolvedTheme: scheduledTheme, overrideReason: null };
  }

  const reason = `${themeShortLabel(winner.themeKey)} override — urgent direct-impact signal outscored scheduled ${themeShortLabel(scheduledTheme)} day`;
  return {
    scheduledTheme,
    resolvedTheme: winner.themeKey,
    overrideReason: reason,
  };
}

function articleSignalText(article = {}) {
  return [
    article.title || '',
    article.content || '',
    article.fullText || '',
    article.reason || '',
  ].join('\n');
}

function webIntelSignalText(result = {}) {
  return `${result.query || ''}\n${result.result || ''}`;
}

function scoreArticle(article = {}) {
  const tierWeight = article.tier === 1 ? 4 : article.tier === 2 ? 2.5 : 1;
  const scoreWeight = typeof article.score === 'number' ? article.score / 3 : 0;
  return tierWeight + scoreWeight;
}

function scoreWebIntel(result = {}) {
  if (!result?.result) return 0;
  const lower = result.result.toLowerCase();
  if (lower.startsWith('search failed') || lower.startsWith('search temporarily unavailable')) return 0;
  return 1.5;
}
