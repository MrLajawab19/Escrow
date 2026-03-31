/**
 * Shared scopeBox / XBox helpers for order validation (controller + Sequelize model).
 */

const CONTENT_WRITING_FIELDS = ['wordCount', 'tone', 'topic', 'targetAudience'];

const PRODUCT_TYPE_ALIASES = {
  'Landing page creation': 'Landing Page Creation',
  'Script writing': 'Script Writing'
};

function normalizeProductType(productType) {
  if (typeof productType !== 'string') return productType;
  const trimmed = productType.trim().normalize('NFC');
  return PRODUCT_TYPE_ALIASES[trimmed] || trimmed;
}

function hasCompleteContentWritingPayload(scopeBox) {
  const cw = scopeBox?.contentWritingSpecific;
  if (!cw || typeof cw !== 'object') return false;
  return CONTENT_WRITING_FIELDS.every((field) => {
    const v = cw[field];
    return v !== undefined && v !== null && String(v).trim() !== '';
  });
}

module.exports = {
  CONTENT_WRITING_FIELDS,
  normalizeProductType,
  hasCompleteContentWritingPayload
};
