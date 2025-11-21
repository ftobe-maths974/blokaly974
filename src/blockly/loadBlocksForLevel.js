const isEnabled = (item) => item && item.enabled !== false;

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const buildFieldXml = (fields = {}) =>
  Object.entries(fields)
    .map(([name, fieldValue]) => `<field name="${escapeXml(name)}">${escapeXml(fieldValue)}</field>`)
    .join('');

const buildValueXml = (values = {}) =>
  Object.entries(values)
    .map(([name, child]) => {
      if (!child || !child.type) return '';
      const tag = child.shadow ? 'shadow' : 'block';
      const childFields = buildFieldXml(child.fields);
      return `<value name="${escapeXml(name)}"><${tag} type="${escapeXml(child.type)}">${childFields}</${tag}></value>`;
    })
    .join('');

const buildBlockXml = (block) => {
  if (!isEnabled(block) || !block.type) return '';
  const fieldsXml = buildFieldXml(block.fields);
  const valuesXml = buildValueXml(block.values);
  return `<block type="${escapeXml(block.type)}">${fieldsXml}${valuesXml}</block>`;
};

const buildCategoryXml = (category) => {
  if (!isEnabled(category)) return '';
  const blocks = category.blocks || [];
  const renderedBlocks = blocks.map(buildBlockXml).filter(Boolean).join('');
  if (!renderedBlocks) return '';
  const colourAttr = category.colour ? ` colour="${escapeXml(category.colour)}"` : '';
  return `<category name="${escapeXml(category.name || 'Category')}"${colourAttr}>${renderedBlocks}</category>`;
};

const buildToolbox = (levelJson = {}) => {
  const blocksConfig = levelJson.blocks || {};
  const categories = Array.isArray(blocksConfig.categories) ? blocksConfig.categories : [];
  const renderedCategories = categories.map(buildCategoryXml).filter(Boolean).join('');
  return `<xml id="toolbox" style="display: none">${renderedCategories}</xml>`;
};

export { buildToolbox };
export default buildToolbox;
