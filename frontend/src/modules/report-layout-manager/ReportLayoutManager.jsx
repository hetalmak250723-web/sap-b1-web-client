import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  copyLayout,
  createLayout,
  createMenuEntry,
  deleteLayout,
  deleteMenuEntry,
  fetchLayouts,
  fetchLayoutVersions,
  fetchManagerCatalog,
  fetchReportCatalog,
  fetchReportFields,
  previewLayout,
  searchManagerCatalog,
  setDefaultLayout,
  updateLayout,
  updateMenuEntry,
} from '../../api/reportLayoutApi';
import './reportLayoutManager.css';

const REPORT_FALLBACKS = [
  {
    code: 'SALES_REGISTER',
    name: 'Sales Register',
    description: 'Invoice-wise sales register with customer and line-level values.',
  },
  {
    code: 'STOCK_REPORT',
    name: 'Stock Report',
    description: 'Warehouse stock snapshot including on-hand, committed, and available quantities.',
  },
  {
    code: 'INVOICE_PRINT',
    name: 'Invoice Print',
    description: 'Customer invoice print layout with document header, lines, and totals.',
  },
];

const SAP_MENU_CATEGORIES = [
  'Administration',
  'Financials',
  'CRM',
  'Opportunities',
  'Sales - A/R',
  'Purchasing - A/P',
  'Business Partners',
  'Banking',
  'Inventory',
  'Resources',
  'Production',
  'MRP',
  'Service',
  'Human Resources',
  'Lost Reports',
  'Add-On Layouts',
];

const CATEGORY_PATH_SEPARATOR = ' > ';

const BLOCK_LIBRARY = [
  { type: 'text', label: 'Text' },
  { type: 'image', label: 'Image' },
  { type: 'line', label: 'Line' },
  { type: 'box', label: 'Box' },
];

const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

const normalizeMessage = (error, fallback) =>
  error?.response?.data?.detail ||
  error?.response?.data?.message ||
  error?.message ||
  fallback;

const slugify = (value, fallback = 'CUSTOM_MENU') => {
  const slug = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 100);

  return slug || fallback;
};

const readDragPayload = (event) => {
  const raw = event.dataTransfer.getData('text/plain');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
};

const chunkRows = (rows, pageSize) => {
  if (!rows.length) return [[]];
  const chunks = [];
  for (let index = 0; index < rows.length; index += pageSize) {
    chunks.push(rows.slice(index, index + pageSize));
  }
  return chunks;
};

const moveItemById = (items, itemId, targetId) => {
  if (!itemId || !targetId || itemId === targetId) return items;
  const nextItems = [...items];
  const fromIndex = nextItems.findIndex((item) => item.id === itemId);
  const toIndex = nextItems.findIndex((item) => item.id === targetId);
  if (fromIndex === -1 || toIndex === -1) return items;

  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
};

const createBlock = (type, field = null) => {
  if (field) {
    return {
      id: createId('block'),
      type: 'text',
      label: field.label,
      content: `{{firstRow.${field.key}}}`,
      src: '',
      style: {
        align: 'left',
        width: 'full',
        emphasis: 'normal',
        fontSize: 'sm',
        height: 'md',
        borderStyle: 'solid',
        accent: 'steel',
      },
    };
  }

  if (type === 'image') {
    return {
      id: createId('block'),
      type,
      label: 'Company Logo',
      content: '',
      src: 'logo://company',
      style: {
        align: 'left',
        width: 'sm',
        emphasis: 'normal',
        fontSize: 'sm',
        height: 'md',
        borderStyle: 'solid',
        accent: 'steel',
      },
    };
  }

  if (type === 'line') {
    return {
      id: createId('block'),
      type,
      label: 'Separator',
      content: '',
      src: '',
      style: {
        align: 'left',
        width: 'full',
        emphasis: 'normal',
        fontSize: 'sm',
        height: 'sm',
        borderStyle: 'solid',
        accent: 'steel',
      },
    };
  }

  if (type === 'box') {
    return {
      id: createId('block'),
      type,
      label: 'Box',
      content: 'Add notes or signature text here',
      src: '',
      style: {
        align: 'left',
        width: 'full',
        emphasis: 'normal',
        fontSize: 'sm',
        height: 'lg',
        borderStyle: 'dashed',
        accent: 'steel',
      },
    };
  }

  return {
    id: createId('block'),
    type: 'text',
    label: 'Text',
    content: 'New text block',
    src: '',
    style: {
      align: 'left',
      width: 'full',
      emphasis: 'normal',
      fontSize: 'sm',
      height: 'md',
      borderStyle: 'solid',
      accent: 'steel',
    },
  };
};

const createColumnFromField = (field) => ({
  id: field.key,
  kind: 'field',
  field: field.key,
  label: field.label,
  width: ['text'].includes(field.type) ? 180 : 110,
  align: ['number', 'currency'].includes(field.type) ? 'right' : 'left',
  dataType: field.type || 'text',
  showTotal: ['number', 'currency'].includes(field.type),
  formula: '',
});

const createCalculatedColumn = () => ({
  id: createId('calc'),
  kind: 'formula',
  field: '',
  label: 'Calculated Total',
  width: 130,
  align: 'right',
  dataType: 'currency',
  showTotal: true,
  formula: 'qty * price',
});

const buildTemplateFromFields = (reportCode, reportMeta, fields) => {
  const preferredFields = {
    SALES_REGISTER: ['docNum', 'postingDate', 'customerName', 'itemDescription', 'qty', 'price', 'lineTotal'],
    STOCK_REPORT: ['itemCode', 'itemName', 'warehouseName', 'onHand', 'committed', 'onOrder', 'available'],
    INVOICE_PRINT: ['lineNumber', 'itemCode', 'itemDescription', 'qty', 'price', 'lineTotal', 'docTotal'],
  };

  const orderedFields = [];
  const keys = preferredFields[reportCode] || [];
  keys.forEach((key) => {
    const field = fields.find((entry) => entry.key === key);
    if (field) orderedFields.push(field);
  });
  fields.forEach((field) => {
    if (!orderedFields.find((entry) => entry.key === field.key)) {
      orderedFields.push(field);
    }
  });

  return {
    version: 1,
    reportCode,
    page: {
      size: 'A4',
      orientation: reportCode === 'STOCK_REPORT' ? 'landscape' : 'portrait',
      pageSize: reportCode === 'INVOICE_PRINT' ? 10 : 12,
      margins: { top: 18, right: 16, bottom: 18, left: 16 },
    },
    header: {
      elements: [
        createBlock('image'),
        {
          ...createBlock('text'),
          label: 'Company Name',
          content: '{{company.companyName}}',
          style: { ...createBlock('text').style, emphasis: 'title', fontSize: 'xl' },
        },
        {
          ...createBlock('text'),
          label: 'Report Title',
          content: reportMeta?.previewTitle || reportMeta?.name || reportCode,
          style: { ...createBlock('text').style, emphasis: 'heading', fontSize: 'lg' },
        },
      ],
    },
    filtersSection: {
      elements: [
        {
          ...createBlock('text'),
          label: 'Filters Summary',
          content: '{{filtersSummary}}',
          style: { ...createBlock('text').style, emphasis: 'muted' },
        },
      ],
    },
    table: {
      showGrid: true,
      columns: orderedFields.slice(0, 7).map(createColumnFromField),
    },
    footer: {
      elements: [
        createBlock('line'),
        {
          ...createBlock('text'),
          label: 'Footer Totals',
          content: 'Rows: {{summary.rowCount}} | Grand Total: {{summary.docTotal}}',
          style: { ...createBlock('text').style, align: 'right', emphasis: 'heading' },
        },
        {
          ...createBlock('box'),
          label: 'Signature Box',
          content: 'Authorised Signatory',
          style: { ...createBlock('box').style, align: 'right', width: 'md' },
        },
      ],
    },
  };
};

const buildFreshMenuDraft = (reports, preferredReportCode = '', preferredCategory = 'Add-On Layouts') => ({
  menuEntryId: null,
  menuCode: '',
  menuName: '',
  menuCategory: preferredCategory || 'Add-On Layouts',
  menuSequence: null,
  reportCode: preferredReportCode || reports[0]?.code || 'SALES_REGISTER',
  entryType: 'Report',
  searchKeywords: '',
  isSystem: false,
});

const buildFreshLayoutDraft = (menuEntry, reportMeta, fields, existingCount = 0) => ({
  layoutId: null,
  menuEntryId: menuEntry?.menuEntryId || null,
  layoutName: `${menuEntry?.menuName || reportMeta?.name || 'Layout'} ${existingCount + 1}`,
  reportCode: menuEntry?.reportCode || reportMeta?.code || 'SALES_REGISTER',
  isDefault: false,
  assignedUserId: '',
  assignedRoleId: '',
  createdBy: '',
  createdDate: '',
  updatedBy: '',
  updatedDate: '',
  layoutJson: buildTemplateFromFields(menuEntry?.reportCode || reportMeta?.code, reportMeta, fields),
  filters: {},
});

const resolvePath = (objectValue, path) => {
  const segments = String(path || '')
    .split('.')
    .map((segment) => segment.trim())
    .filter(Boolean);

  return segments.reduce((current, segment) => {
    if (current == null) return '';
    return current[segment];
  }, objectValue);
};

const renderTemplate = (text, context) =>
  String(text || '').replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, token) => {
    const resolved = resolvePath(context, token);
    if (resolved === undefined || resolved === null) return '';
    return String(resolved);
  });

const formatValue = (value, dataType) => {
  if (value === undefined || value === null || value === '') return '';
  if (dataType === 'currency') {
    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  if (dataType === 'number') {
    return Number(value).toLocaleString('en-IN', {
      minimumFractionDigits: Number.isInteger(Number(value)) ? 0 : 2,
      maximumFractionDigits: 2,
    });
  }

  return String(value);
};

const buildPreviewPages = (previewData) =>
  previewData ? chunkRows(previewData.rows || [], previewData.pagination?.pageSize || 12) : [[]];

const splitCategoryPath = (value) =>
  String(value || '')
    .split(CATEGORY_PATH_SEPARATOR)
    .map((part) => part.trim())
    .filter(Boolean);

const joinCategoryPath = (parts) => splitCategoryPath(parts.join(CATEGORY_PATH_SEPARATOR)).join(CATEGORY_PATH_SEPARATOR);

const getAncestorCategoryPaths = (value) => {
  const parts = splitCategoryPath(value);
  return parts.slice(0, -1).map((_part, index) => joinCategoryPath(parts.slice(0, index + 1)));
};

const getCategoryLabel = (value) => {
  const parts = splitCategoryPath(value);
  return parts[parts.length - 1] || String(value || '').trim();
};

const normalizeSapMenuLabel = (value) => {
  const label = String(value || '').trim();
  const normalized = label.toLowerCase();

  if (normalized === 'sales') {
    return 'Sales - A/R';
  }

  if (normalized === 'purchasing') {
    return 'Purchasing - A/P';
  }

  return label;
};

const collectAuthorizedCategoryPaths = (menus = [], parentParts = []) => {
  const collected = [];

  menus.forEach((menu) => {
    const label = normalizeSapMenuLabel(menu?.menuName);
    if (!label) {
      return;
    }

    if (!parentParts.length && !SAP_MENU_CATEGORIES.includes(label)) {
      return;
    }

    const nextParts = [...parentParts, label];
    if (nextParts.length > 1) {
      collected.push(joinCategoryPath(nextParts));
    }

    if (Array.isArray(menu?.children) && menu.children.length) {
      collected.push(...collectAuthorizedCategoryPaths(menu.children, nextParts));
    }
  });

  return [...new Set(collected)];
};

const buildCategoryTree = ({ categories = [], customPaths = [], rootPaths = [] } = {}) => {
  const rootNodes = [];
  const nodeMap = new Map();
  const rootOrder = new Map(rootPaths.map((path, index) => [path, index]));

  const ensureNode = (path) => {
    const normalizedPath = joinCategoryPath(splitCategoryPath(path));
    if (!normalizedPath) return null;
    if (nodeMap.has(normalizedPath)) {
      return nodeMap.get(normalizedPath);
    }

    const parentPath = joinCategoryPath(splitCategoryPath(normalizedPath).slice(0, -1));
    const node = {
      path: normalizedPath,
      name: getCategoryLabel(normalizedPath),
      items: [],
      children: [],
      isCustomPath: false,
      hasCatalogCategory: false,
    };
    nodeMap.set(normalizedPath, node);

    if (parentPath) {
      const parentNode = ensureNode(parentPath);
      if (parentNode && !parentNode.children.some((child) => child.path === normalizedPath)) {
        parentNode.children.push(node);
      }
    } else {
      rootNodes.push(node);
    }

    return node;
  };

  rootPaths.forEach((path) => ensureNode(path));

  categories.forEach((category) => {
    const node = ensureNode(category.name);
    if (!node) return;
    node.hasCatalogCategory = true;
    node.items = [...(category.items || [])];
  });

  customPaths.forEach((path) => {
    const node = ensureNode(path);
    if (node) {
      node.isCustomPath = true;
    }
  });

  const sortNodes = (nodes, depth = 0) =>
    [...nodes]
      .sort((left, right) => {
        if (depth === 0) {
          const leftOrder = rootOrder.has(left.path) ? rootOrder.get(left.path) : Number.MAX_SAFE_INTEGER;
          const rightOrder = rootOrder.has(right.path) ? rootOrder.get(right.path) : Number.MAX_SAFE_INTEGER;
          if (leftOrder !== rightOrder) {
            return leftOrder - rightOrder;
          }
        }
        return left.name.localeCompare(right.name);
      })
      .map((node) => ({
        ...node,
        children: sortNodes(node.children, depth + 1),
      }));

  return sortNodes(rootNodes);
};

const TreeCategory = ({
  category,
  expanded,
  expandedCategories,
  onToggle,
  expandedMenuEntries,
  onToggleMenuEntry,
  onSelectMenu,
  onSelectLayout,
  selectedMenuEntryId,
  selectedLayoutId,
  showReports,
  showLayouts,
}) => {
  const hasChildren = category.children.length > 0;
  const hasItems = category.items.length > 0;
  const renderAsSimpleItem = category.isCustomPath && !category.hasCatalogCategory && !hasChildren && !hasItems;

  if (renderAsSimpleItem) {
    return (
      <div className="rlm-tree__node">
        <div className="rlm-tree__item rlm-tree__item--placeholder">
          <span className="rlm-tree__bullet" />
          <span className="rlm-tree__item-text">{category.name}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rlm-tree__category">
      <button type="button" className="rlm-tree__category-btn" onClick={() => onToggle(category.path)}>
        <span className={`rlm-tree__caret${expanded ? ' is-open' : ''}`}>{'>'}</span>
        <span>{category.name}</span>
      </button>

      {expanded ? (
        <div className="rlm-tree__items">
          {hasChildren
            ? category.children.map((child) => (
                <TreeCategory
                  key={child.path}
                  category={child}
                  expanded={Boolean(expandedCategories[child.path])}
                  expandedCategories={expandedCategories}
                  onToggle={onToggle}
                  expandedMenuEntries={expandedMenuEntries}
                  onToggleMenuEntry={onToggleMenuEntry}
                  onSelectMenu={onSelectMenu}
                  onSelectLayout={onSelectLayout}
                  selectedMenuEntryId={selectedMenuEntryId}
                  selectedLayoutId={selectedLayoutId}
                  showReports={showReports}
                  showLayouts={showLayouts}
                />
              ))
            : null}

          {hasItems ? (
            category.items.map((item) => (
              <div key={item.menuEntryId} className="rlm-tree__node">
                {showReports ? (
                  <button
                    type="button"
                    className={`rlm-tree__item rlm-tree__item--submenu${selectedMenuEntryId === item.menuEntryId ? ' is-active' : ''}`}
                    onClick={() => {
                      onSelectMenu(item);
                      if (item.layouts?.length) {
                        onToggleMenuEntry(item.menuEntryId);
                      }
                    }}
                  >
                    <span className={`rlm-tree__caret${expandedMenuEntries[item.menuEntryId] ? ' is-open' : ''}`}>
                      {item.layouts?.length ? '>' : ''}
                    </span>
                    <span className="rlm-tree__item-text">{item.menuName}</span>
                  </button>
                ) : null}

                {showLayouts && item.layouts?.length && expandedMenuEntries[item.menuEntryId] ? (
                  <div className="rlm-tree__subitems">
                    {item.layouts.map((layout) => (
                      <button
                        key={layout.layoutId}
                        type="button"
                        className={`rlm-tree__subitem${selectedLayoutId === layout.layoutId ? ' is-active' : ''}`}
                        onClick={() => onSelectLayout(item, layout)}
                      >
                        <span className="rlm-tree__sub-bullet" />
                        <span>{layout.layoutName}</span>
                        {layout.isDefault ? <span className="rlm-tree__default-mark">*</span> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          ) : null}

          {!hasChildren && !hasItems ? <div className="rlm-tree__empty">No items</div> : null}
        </div>
      ) : null}
    </div>
  );
};

const PreviewBlock = ({ block, context }) => {
  const content = renderTemplate(block.content, context);
  const alignClass = `align-${block.style?.align || 'left'}`;
  const widthClass = `width-${block.style?.width || 'full'}`;
  const emphasisClass = `emphasis-${block.style?.emphasis || 'normal'}`;
  const heightClass = `height-${block.style?.height || 'md'}`;

  if (block.type === 'line') {
    return <div className="rlm-preview-block rlm-preview-block--line" />;
  }

  if (block.type === 'image') {
    const src = block.src === 'logo://company' ? context.company.logo : block.src;
    return (
      <div className={`rlm-preview-block rlm-preview-block--image ${alignClass} ${widthClass}`}>
        {src ? <img src={src} alt={block.label || 'Layout visual'} /> : <div className="rlm-preview-block__placeholder">No image</div>}
      </div>
    );
  }

  if (block.type === 'box') {
    return (
      <div className={`rlm-preview-block rlm-preview-block--box ${alignClass} ${widthClass} ${heightClass}`}>
        <span>{content}</span>
      </div>
    );
  }

  return (
    <div className={`rlm-preview-block rlm-preview-block--text ${alignClass} ${widthClass} ${emphasisClass}`}>
      {content}
    </div>
  );
};

const PreviewDocument = ({ previewData, previewPage, onPreviewPageChange }) => {
  const pages = buildPreviewPages(previewData);
  const activePage = pages[previewPage] || [];
  const columns = previewData?.layout?.table?.columns || [];
  const context = {
    company: previewData?.company || {},
    report: previewData?.report || {},
    summary: previewData?.summary || {},
    filters: previewData?.filters || {},
    filtersSummary: previewData?.filtersSummary || '',
    firstRow: previewData?.firstRow || {},
  };

  const totalWidth = columns.reduce((sum, column) => sum + Number(column.width || 100), 0) || 1;

  return (
    <div className="rlm-preview">
      <div className="rlm-preview__toolbar">
        <div>
          <strong>{previewData?.report?.title || 'Preview'}</strong>
          <span className={`rlm-status-pill ${previewData?.dataMode === 'live' ? 'is-live' : 'is-sample'}`}>
            {previewData?.dataMode === 'live' ? 'Live data' : 'Sample fallback'}
          </span>
        </div>
        <div className="rlm-preview__pager">
          <button type="button" className="rlm-mini-btn" onClick={() => onPreviewPageChange(Math.max(previewPage - 1, 0))} disabled={previewPage === 0}>
            Previous
          </button>
          <span>Page {previewPage + 1} / {pages.length}</span>
          <button type="button" className="rlm-mini-btn" onClick={() => onPreviewPageChange(Math.min(previewPage + 1, pages.length - 1))} disabled={previewPage >= pages.length - 1}>
            Next
          </button>
        </div>
      </div>

      <div className="rlm-preview__page">
        <div className="rlm-preview__section">
          {(previewData?.layout?.header?.elements || []).map((block) => (
            <PreviewBlock key={block.id} block={block} context={context} />
          ))}
        </div>

        <div className="rlm-preview__section">
          {(previewData?.layout?.filtersSection?.elements || []).map((block) => (
            <PreviewBlock key={block.id} block={block} context={context} />
          ))}
        </div>

        <div className="rlm-preview__table-shell">
          <table className="rlm-preview__table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.id}
                    style={{
                      width: `${(Number(column.width || 100) / totalWidth) * 100}%`,
                      textAlign: column.align || 'left',
                    }}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePage.length ? (
                activePage.map((row, rowIndex) => (
                  <tr key={`${rowIndex}-${row.docNum || row.itemCode || 'row'}`}>
                    {columns.map((column) => (
                      <td key={column.id} style={{ textAlign: column.align || 'left' }}>
                        {formatValue(row[column.id], column.dataType)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length || 1} className="rlm-preview__empty">
                    No rows available for this preview.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rlm-preview__section">
          {(previewData?.layout?.footer?.elements || []).map((block) => (
            <PreviewBlock key={block.id} block={block} context={context} />
          ))}
        </div>
      </div>
    </div>
  );
};

const SectionBuilder = ({
  sectionKey,
  label,
  section,
  selectedBlock,
  onSelectBlock,
  onRemoveBlock,
  onMoveBlock,
  onDropPayload,
}) => (
  <section
    className="rlm-designer__section"
    onDragOver={(event) => event.preventDefault()}
    onDrop={(event) => onDropPayload(event, sectionKey)}
  >
    <div className="rlm-designer__section-header">
      <div>
        <h4>{label}</h4>
        <span>Drop text, image, line, box, or fields here.</span>
      </div>
    </div>

    <div className="rlm-designer__blocks">
      {(section?.elements || []).length ? (
        section.elements.map((block) => (
          <article
            key={block.id}
            className={`rlm-block-card${selectedBlock?.section === sectionKey && selectedBlock?.id === block.id ? ' is-selected' : ''}`}
            draggable
            onDragStart={(event) =>
              event.dataTransfer.setData(
                'text/plain',
                JSON.stringify({ source: 'block', section: sectionKey, blockId: block.id }),
              )
            }
            onClick={() => onSelectBlock(sectionKey, block.id)}
          >
            <div className="rlm-block-card__meta">
              <strong>{block.label || block.type}</strong>
              <span>{block.type}</span>
            </div>
            <div className="rlm-block-card__body">
              {block.type === 'image' ? (block.src || 'logo://company') : block.content || 'No content'}
            </div>
            <div className="rlm-block-card__actions">
              <button type="button" className="rlm-mini-btn" onClick={(event) => { event.stopPropagation(); onMoveBlock(sectionKey, block.id, -1); }}>
                Up
              </button>
              <button type="button" className="rlm-mini-btn" onClick={(event) => { event.stopPropagation(); onMoveBlock(sectionKey, block.id, 1); }}>
                Down
              </button>
              <button type="button" className="rlm-mini-btn is-danger" onClick={(event) => { event.stopPropagation(); onRemoveBlock(sectionKey, block.id); }}>
                Remove
              </button>
            </div>
          </article>
        ))
      ) : (
        <div className="rlm-placeholder">Nothing added yet.</div>
      )}
    </div>
  </section>
);

function ReportLayoutManager() {
  const { menus: authorizedMenus } = useAuth();
  const [reports, setReports] = useState(REPORT_FALLBACKS);
  const [catalog, setCatalog] = useState({ categories: [], flatItems: [] });
  const [activeManagerTab, setActiveManagerTab] = useState('list');
  const [activeWorkbenchTab, setActiveWorkbenchTab] = useState('designer');
  const [showTreeReports, setShowTreeReports] = useState(true);
  const [showTreeLayouts, setShowTreeLayouts] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [expandedMenuEntries, setExpandedMenuEntries] = useState({});
  const [selectedMenuEntry, setSelectedMenuEntry] = useState(null);
  const [selectedLayout, setSelectedLayout] = useState(null);
  const [menuDraft, setMenuDraft] = useState(buildFreshMenuDraft(REPORT_FALLBACKS));
  const [layoutDraft, setLayoutDraft] = useState(null);
  const [layouts, setLayouts] = useState([]);
  const [availableFields, setAvailableFields] = useState([]);
  const [reportMeta, setReportMeta] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewPage, setPreviewPage] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [selectedColumnId, setSelectedColumnId] = useState('');
  const [versions, setVersions] = useState([]);
  const [searchState, setSearchState] = useState({
    query: '',
    entryType: 'Document Type',
    results: [],
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState({
    bootstrap: true,
    catalog: false,
    context: false,
    menuSave: false,
    layoutSave: false,
    preview: false,
  });

  const applyMessage = (type, text) => setMessage({ type, text });

  const setMenuFields = (updater) => {
    setMenuDraft((current) => {
      const next = clone(current);
      return typeof updater === 'function' ? updater(next) : updater;
    });
  };

  const setLayoutFields = (updater) => {
    setLayoutDraft((current) => {
      const next = clone(current);
      return typeof updater === 'function' ? updater(next) : updater;
    });
  };

  const loadReportTemplate = async (reportCode) => {
    const response = await fetchReportFields(reportCode);
    setReportMeta(response.report);
    setAvailableFields(response.fields || []);
    return response;
  };

  const loadCatalog = async () => {
    setLoading((current) => ({ ...current, catalog: true }));
    try {
      const data = await fetchManagerCatalog({ includeLayouts: true });
      setCatalog(data);
      return data;
    } finally {
      setLoading((current) => ({ ...current, catalog: false }));
    }
  };

  const loadMenuContext = async (menuEntry, preferredLayoutId = null, { expandCategory = true } = {}) => {
    setLoading((current) => ({ ...current, context: true }));
    try {
      setSelectedMenuEntry(menuEntry);
      if (menuEntry?.source === 'sap-rdoc') {
        setMenuDraft({
          menuEntryId: menuEntry.menuEntryId,
          menuCode: menuEntry.menuCode,
          menuName: menuEntry.menuName,
          menuCategory: menuEntry.menuCategory,
          menuSequence: menuEntry.menuSequence ?? null,
          reportCode: '',
          entryType: menuEntry.entryType || 'Layout Group',
          searchKeywords: '',
          isSystem: true,
        });
        if (expandCategory) {
          setExpandedCategories((current) => ({
            ...current,
            ...Object.fromEntries([...getAncestorCategoryPaths(menuEntry.menuCategory), menuEntry.menuCategory].map((path) => [path, true])),
          }));
        }
        setExpandedMenuEntries((current) => ({
          ...current,
          [menuEntry.menuEntryId]: true,
        }));

        const loadedLayouts = menuEntry.layouts || [];
        const nextLayout =
          loadedLayouts.find((layout) => layout.layoutId === preferredLayoutId) ||
          loadedLayouts[0] ||
          null;

        setLayouts(loadedLayouts);
        setSelectedLayout(nextLayout);
        setLayoutDraft(null);
        setAvailableFields([]);
        setReportMeta(null);
        setVersions([]);
        setSelectedBlock(null);
        setSelectedColumnId('');
        setPreviewData(null);
        setPreviewPage(0);
        setActiveWorkbenchTab('designer');
        applyMessage('', '');
        return;
      }

      setMenuDraft({
        menuEntryId: menuEntry.menuEntryId,
        menuCode: menuEntry.menuCode,
        menuName: menuEntry.menuName,
        menuCategory: menuEntry.menuCategory,
        menuSequence: menuEntry.menuSequence ?? null,
        reportCode: menuEntry.reportCode,
        entryType: menuEntry.entryType,
        searchKeywords: menuEntry.searchKeywords || '',
        isSystem: Boolean(menuEntry.isSystem),
      });
      if (expandCategory) {
        setExpandedCategories((current) => ({
          ...current,
          ...Object.fromEntries([...getAncestorCategoryPaths(menuEntry.menuCategory), menuEntry.menuCategory].map((path) => [path, true])),
        }));
      }
      setExpandedMenuEntries((current) => ({
        ...current,
        [menuEntry.menuEntryId]: true,
      }));

      const [fieldResponse, layoutResponse] = await Promise.all([
        loadReportTemplate(menuEntry.reportCode),
        fetchLayouts({ reportCode: menuEntry.reportCode, menuEntryId: menuEntry.menuEntryId }),
      ]);

      const loadedLayouts = layoutResponse.layouts || [];
      setLayouts(loadedLayouts);
      const nextLayout =
        loadedLayouts.find((layout) => layout.layoutId === preferredLayoutId) ||
        loadedLayouts.find((layout) => layout.isDefault) ||
        loadedLayouts[0] ||
        buildFreshLayoutDraft(menuEntry, fieldResponse.report, fieldResponse.fields || [], loadedLayouts.length);

      setSelectedLayout(nextLayout.layoutId ? nextLayout : null);
      setLayoutDraft(clone(nextLayout));
      setSelectedBlock(null);
      setSelectedColumnId(nextLayout.layoutJson?.table?.columns?.[0]?.id || '');
      setPreviewData(null);
      setPreviewPage(0);
      setActiveWorkbenchTab('designer');
      applyMessage('', '');
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Failed to load menu entry details.'));
    } finally {
      setLoading((current) => ({ ...current, context: false }));
    }
  };

  useEffect(() => {
    let ignore = false;

    const bootstrap = async () => {
      try {
        const reportResponse = await fetchReportCatalog();
        if (!ignore && reportResponse.reports?.length) {
          setReports(reportResponse.reports);
        }
      } catch (_error) {
        // Fallback reports are already present.
      }

      try {
        const data = await loadCatalog();
        const firstItem = data.flatItems?.[0];
        if (!ignore && firstItem) {
          await loadMenuContext(firstItem, null, { expandCategory: false });
        } else if (!ignore) {
          const fallbackReports = reports.length ? reports : REPORT_FALLBACKS;
          await loadReportTemplate(fallbackReports[0].code);
          setMenuDraft(buildFreshMenuDraft(fallbackReports, fallbackReports[0].code));
        }
      } catch (error) {
        if (!ignore) {
          applyMessage('error', normalizeMessage(error, 'Failed to load report and layout manager.'));
        }
      } finally {
        if (!ignore) {
          setLoading((current) => ({ ...current, bootstrap: false }));
        }
      }
    };

    bootstrap();
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let ignore = false;
    const loadVersions = async () => {
      if (!layoutDraft?.layoutId) {
        setVersions([]);
        return;
      }

      try {
        const response = await fetchLayoutVersions(layoutDraft.layoutId);
        if (!ignore) {
          setVersions(response.versions || []);
        }
      } catch (_error) {
        if (!ignore) setVersions([]);
      }
    };

    loadVersions();
    return () => {
      ignore = true;
    };
  }, [layoutDraft?.layoutId]);

  const handleToggleCategory = (categoryName) => {
    setExpandedCategories((current) => ({
      ...current,
      [categoryName]: !current[categoryName],
    }));
  };

  const handleToggleMenuEntry = (menuEntryId) => {
    setExpandedMenuEntries((current) => ({
      ...current,
      [menuEntryId]: !current[menuEntryId],
    }));
  };

  const handleSelectMenu = async (menuEntry) => {
    await loadMenuContext(menuEntry);
  };

  const handleSelectLayout = async (menuEntry, layout) => {
    if (selectedMenuEntry?.menuEntryId !== menuEntry.menuEntryId) {
      await loadMenuContext(menuEntry, layout.layoutId);
      return;
    }

    setExpandedMenuEntries((current) => ({
      ...current,
      [menuEntry.menuEntryId]: true,
    }));
    if (menuEntry?.source === 'sap-rdoc') {
      setSelectedLayout(layout);
      setLayoutDraft(null);
      setVersions([]);
      setSelectedBlock(null);
      setSelectedColumnId('');
      setPreviewData(null);
      setPreviewPage(0);
      return;
    }
    setSelectedLayout(layout);
    setLayoutDraft(clone(layout));
    setSelectedBlock(null);
    setSelectedColumnId(layout.layoutJson?.table?.columns?.[0]?.id || '');
    setPreviewData(null);
    setPreviewPage(0);
  };

  const handleNewMenu = async () => {
    const reportCode = menuDraft?.reportCode || reports[0]?.code || 'SALES_REGISTER';
    setSelectedMenuEntry(null);
    setSelectedLayout(null);
    setLayouts([]);
    setVersions([]);
    setMenuDraft(buildFreshMenuDraft(reports, reportCode));
    const fieldsResponse = await loadReportTemplate(reportCode);
    setLayoutDraft(buildFreshLayoutDraft(null, fieldsResponse.report, fieldsResponse.fields || [], 0));
    setSelectedBlock(null);
    setSelectedColumnId('');
    setPreviewData(null);
    setActiveWorkbenchTab('designer');
    applyMessage('info', 'Create a new menu name, then save it before adding layouts.');
  };

  const handleMenuReportCodeChange = async (nextReportCode) => {
    setMenuFields((current) => {
      current.reportCode = nextReportCode;
      if (!current.menuCode) {
        current.menuCode = slugify(current.menuName || nextReportCode);
      }
      return current;
    });

    const response = await loadReportTemplate(nextReportCode);
    setLayoutDraft((current) => {
      if (!current || current.layoutId) return current;
      return buildFreshLayoutDraft(
        {
          menuEntryId: null,
          reportCode: nextReportCode,
          menuName: menuDraft.menuName,
        },
        response.report,
        response.fields || [],
        layouts.length,
      );
    });
  };

  const handleSaveMenu = async () => {
    setLoading((current) => ({ ...current, menuSave: true }));
    try {
      const payload = {
        ...menuDraft,
        menuCode: menuDraft.menuCode || slugify(menuDraft.menuName),
      };

      const saved = menuDraft.menuEntryId
        ? await updateMenuEntry(menuDraft.menuEntryId, payload)
        : await createMenuEntry(payload);

      await loadCatalog();
      await loadMenuContext(saved, layoutDraft?.layoutId);
      applyMessage('success', 'Menu entry saved.');
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Failed to save menu entry.'));
    } finally {
      setLoading((current) => ({ ...current, menuSave: false }));
    }
  };

  const handleDeleteMenu = async () => {
    if (!menuDraft?.menuEntryId) {
      await handleNewMenu();
      return;
    }

    if (menuDraft.isSystem) {
      applyMessage('error', 'System menu entries cannot be deleted.');
      return;
    }

    if (!window.confirm(`Delete menu "${menuDraft.menuName}" and its layouts?`)) {
      return;
    }

    try {
      await deleteMenuEntry(menuDraft.menuEntryId);
      const data = await loadCatalog();
      const firstItem = data.flatItems?.[0];
      if (firstItem) {
        await loadMenuContext(firstItem);
      } else {
        await handleNewMenu();
      }
      applyMessage('success', 'Menu entry deleted.');
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Failed to delete menu entry.'));
    }
  };

  const handleNewLayout = async () => {
    if (!menuDraft?.menuEntryId) {
      applyMessage('info', 'Save the menu entry first so the layout can be attached to it.');
      return;
    }

    const fieldResponse = reportMeta ? { report: reportMeta, fields: availableFields } : await loadReportTemplate(menuDraft.reportCode);
    const fresh = buildFreshLayoutDraft(menuDraft, fieldResponse.report, fieldResponse.fields || [], layouts.length);
    setSelectedLayout(null);
    setLayoutDraft(fresh);
    setSelectedBlock(null);
    setSelectedColumnId(fresh.layoutJson?.table?.columns?.[0]?.id || '');
    setPreviewData(null);
    setActiveWorkbenchTab('designer');
  };

  const handleSaveLayout = async () => {
    if (!menuDraft?.menuEntryId) {
      applyMessage('info', 'Save the menu entry first before saving layouts.');
      return;
    }

    setLoading((current) => ({ ...current, layoutSave: true }));
    try {
      const payload = {
        ...layoutDraft,
        menuEntryId: menuDraft.menuEntryId,
        reportCode: menuDraft.reportCode,
      };

      const saved = layoutDraft.layoutId
        ? await updateLayout(layoutDraft.layoutId, payload)
        : await createLayout(payload);

      await loadCatalog();
      await loadMenuContext({
        ...menuDraft,
        menuEntryId: menuDraft.menuEntryId,
        menuName: menuDraft.menuName,
        menuCode: menuDraft.menuCode,
        menuCategory: menuDraft.menuCategory,
        menuSequence: menuDraft.menuSequence,
        reportCode: menuDraft.reportCode,
        entryType: menuDraft.entryType,
        searchKeywords: menuDraft.searchKeywords,
        isSystem: menuDraft.isSystem,
      }, saved.layoutId);
      applyMessage('success', 'Layout saved.');
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Failed to save layout.'));
    } finally {
      setLoading((current) => ({ ...current, layoutSave: false }));
    }
  };

  const handleDeleteLayout = async () => {
    if (!layoutDraft?.layoutId) {
      await handleNewLayout();
      return;
    }

    if (!window.confirm(`Delete layout "${layoutDraft.layoutName}"?`)) return;

    try {
      await deleteLayout(layoutDraft.layoutId);
      await loadCatalog();
      await loadMenuContext(selectedMenuEntry);
      applyMessage('success', 'Layout deleted.');
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Failed to delete layout.'));
    }
  };

  const handleSetDefault = async () => {
    if (!layoutDraft?.layoutId) {
      applyMessage('info', 'Save the layout first before setting it as default.');
      return;
    }

    try {
      await setDefaultLayout(layoutDraft.layoutId);
      await loadCatalog();
      await loadMenuContext(selectedMenuEntry, layoutDraft.layoutId);
      applyMessage('success', 'Default layout updated.');
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Failed to set default layout.'));
    }
  };

  const handleCopyLayout = async () => {
    if (!layoutDraft?.layoutId) {
      if (layoutDraft) {
        const copy = clone(layoutDraft);
        copy.layoutId = null;
        copy.layoutName = `${copy.layoutName} Copy`;
        setLayoutDraft(copy);
        applyMessage('info', 'Unsaved layout duplicated locally.');
      }
      return;
    }

    try {
      const copied = await copyLayout(layoutDraft.layoutId, {
        layoutName: `${layoutDraft.layoutName} Copy`,
        menuEntryId: menuDraft.menuEntryId,
      });
      await loadCatalog();
      await loadMenuContext(selectedMenuEntry, copied.layoutId);
      applyMessage('success', 'Layout copied.');
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Failed to copy layout.'));
    }
  };

  const runPreview = async () => {
    if (!layoutDraft) return null;
    setLoading((current) => ({ ...current, preview: true }));
    try {
      const response = await previewLayout({
        reportCode: menuDraft.reportCode,
        layoutId: layoutDraft.layoutId,
        layoutJson: layoutDraft.layoutJson,
        filters: layoutDraft.filters || {},
      });
      setPreviewData(response);
      setPreviewPage(0);
      setActiveWorkbenchTab('preview');
      applyMessage('success', 'Preview generated.');
      return response;
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Failed to generate preview.'));
      return null;
    } finally {
      setLoading((current) => ({ ...current, preview: false }));
    }
  };

  const handleSearch = async () => {
    try {
      const response = await searchManagerCatalog({
        query: searchState.query,
        entryType: searchState.entryType,
      });
      setSearchState((current) => ({
        ...current,
        results: response.results || [],
      }));
    } catch (error) {
      applyMessage('error', normalizeMessage(error, 'Search failed.'));
    }
  };

  const handleRefresh = async () => {
    const data = await loadCatalog();
    if (selectedMenuEntry?.menuEntryId) {
      const matching = data.flatItems.find((item) => item.menuEntryId === selectedMenuEntry.menuEntryId);
      if (matching) {
        await loadMenuContext(matching, layoutDraft?.layoutId);
        return;
      }
    }

    if (data.flatItems?.[0]) {
      await loadMenuContext(data.flatItems[0]);
    }
  };

  const handleCancel = async () => {
    if (selectedMenuEntry?.menuEntryId) {
      await loadMenuContext(selectedMenuEntry, selectedLayout?.layoutId);
    } else {
      await handleNewMenu();
    }
    applyMessage('info', 'Changes reset.');
  };

  const handleFieldFilterChange = (key, value) => {
    setLayoutFields((current) => {
      current.filters = {
        ...(current.filters || {}),
        [key]: value,
      };
      return current;
    });
  };

  const handleDropPayload = (event, sectionKey) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload || !layoutDraft) return;

    setLayoutFields((current) => {
      const next = clone(current);
      const targetElements = next.layoutJson?.[sectionKey]?.elements || [];

      if (payload.source === 'palette') {
        targetElements.push(createBlock(payload.blockType));
      }

      if (payload.source === 'field') {
        targetElements.push(createBlock('text', payload.field));
      }

      if (payload.source === 'block') {
        const sourceElements = next.layoutJson?.[payload.section]?.elements || [];
        const sourceIndex = sourceElements.findIndex((entry) => entry.id === payload.blockId);
        if (sourceIndex !== -1) {
          const [block] = sourceElements.splice(sourceIndex, 1);
          targetElements.push(block);
        }
      }

      next.layoutJson[sectionKey].elements = targetElements;
      return next;
    });
  };

  const handleSelectBlock = (sectionKey, blockId) => {
    setSelectedBlock({ section: sectionKey, id: blockId });
    setSelectedColumnId('');
  };

  const handleRemoveBlock = (sectionKey, blockId) => {
    setLayoutFields((current) => {
      const next = clone(current);
      next.layoutJson[sectionKey].elements = (next.layoutJson?.[sectionKey]?.elements || []).filter(
        (block) => block.id !== blockId,
      );
      return next;
    });
    setSelectedBlock(null);
  };

  const handleMoveBlock = (sectionKey, blockId, direction) => {
    setLayoutFields((current) => {
      const next = clone(current);
      const elements = next.layoutJson?.[sectionKey]?.elements || [];
      const index = elements.findIndex((block) => block.id === blockId);
      if (index === -1) return next;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= elements.length) return next;
      const [block] = elements.splice(index, 1);
      elements.splice(targetIndex, 0, block);
      next.layoutJson[sectionKey].elements = elements;
      return next;
    });
  };

  const handleTableDrop = (event, targetColumnId = null) => {
    event.preventDefault();
    const payload = readDragPayload(event);
    if (!payload || !layoutDraft) return;

    setLayoutFields((current) => {
      const next = clone(current);
      const columns = next.layoutJson?.table?.columns || [];

      if (payload.source === 'field') {
        const exists = columns.some((column) => column.field === payload.field.key || column.id === payload.field.key);
        if (!exists) {
          columns.push(createColumnFromField(payload.field));
        }
      }

      if (payload.source === 'column' && targetColumnId) {
        next.layoutJson.table.columns = moveItemById(columns, payload.columnId, targetColumnId);
      } else {
        next.layoutJson.table.columns = columns;
      }

      return next;
    });
  };

  const handleColumnChange = (columnId, key, value) => {
    setLayoutFields((current) => {
      const next = clone(current);
      next.layoutJson.table.columns = (next.layoutJson?.table?.columns || []).map((column) =>
        column.id === columnId ? { ...column, [key]: value } : column,
      );
      return next;
    });
  };

  const handleRemoveColumn = (columnId) => {
    setLayoutFields((current) => {
      const next = clone(current);
      next.layoutJson.table.columns = (next.layoutJson?.table?.columns || []).filter(
        (column) => column.id !== columnId,
      );
      return next;
    });
    setSelectedColumnId('');
  };

  const handleAddCalculatedColumn = () => {
    setLayoutFields((current) => {
      const next = clone(current);
      next.layoutJson.table.columns = [
        ...(next.layoutJson?.table?.columns || []),
        createCalculatedColumn(),
      ];
      return next;
    });
  };

  const selectedBlockConfig =
    selectedBlock &&
    layoutDraft?.layoutJson?.[selectedBlock.section]?.elements?.find((block) => block.id === selectedBlock.id);
  const selectedColumn =
    layoutDraft?.layoutJson?.table?.columns?.find((column) => column.id === selectedColumnId) || null;
  const sapSubmenuPaths = collectAuthorizedCategoryPaths(authorizedMenus);
  const catalogTree = buildCategoryTree({
    categories: catalog.categories,
    customPaths: sapSubmenuPaths,
    rootPaths: SAP_MENU_CATEGORIES,
  });

  if (loading.bootstrap) {
    return <div className="rlm-window rlm-window--loading">Loading Report and Layout Manager...</div>;
  }

  return (
    <div className="rlm-window">
      <div className="rlm-window__titlebar">
        <span>Report and Layout Manager</span>
      </div>

      {message.text ? (
        <div className={`rlm-message is-${message.type || 'info'}`}>
          {message.text}
        </div>
      ) : null}

      <div className="rlm-window__body">
        <aside className="rlm-manager-pane">
          <div className="rlm-tabs">
            <button type="button" className={`rlm-tab${activeManagerTab === 'list' ? ' is-active' : ''}`} onClick={() => setActiveManagerTab('list')}>
              List
            </button>
            <button type="button" className={`rlm-tab${activeManagerTab === 'search' ? ' is-active' : ''}`} onClick={() => setActiveManagerTab('search')}>
              Search
            </button>
          </div>

          {activeManagerTab === 'list' ? (
            <div className="rlm-manager-pane__content">
              <div className="rlm-list-controls">
                <div className="rlm-list-controls__title">Asterisk Indicates</div>
                <label><input type="checkbox" checked={showTreeReports} onChange={(event) => setShowTreeReports(event.target.checked)} /> Report</label>
                <label><input type="checkbox" checked={showTreeLayouts} onChange={(event) => setShowTreeLayouts(event.target.checked)} /> Layout</label>
              </div>

              <div className="rlm-tree">
                {catalogTree.map((category) => (
                  <TreeCategory
                    key={category.path}
                    category={category}
                    expanded={Boolean(expandedCategories[category.path])}
                    expandedCategories={expandedCategories}
                    onToggle={handleToggleCategory}
                    expandedMenuEntries={expandedMenuEntries}
                    onToggleMenuEntry={handleToggleMenuEntry}
                    onSelectMenu={handleSelectMenu}
                    onSelectLayout={handleSelectLayout}
                    selectedMenuEntryId={selectedMenuEntry?.menuEntryId}
                    selectedLayoutId={selectedLayout?.layoutId}
                    showReports={showTreeReports}
                    showLayouts={showTreeLayouts}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="rlm-manager-pane__content">
              <div className="rlm-search-box">
                <input
                  type="text"
                  value={searchState.query}
                  onChange={(event) => setSearchState((current) => ({ ...current, query: event.target.value }))}
                  placeholder="Search menu code or name"
                />
                <button type="button" className="rlm-action-btn" onClick={handleSearch}>
                  Find
                </button>
              </div>

              <div className="rlm-search-options">
                <label>
                  <input
                    type="radio"
                    checked={searchState.entryType === 'Document Type'}
                    onChange={() => setSearchState((current) => ({ ...current, entryType: 'Document Type' }))}
                  />
                  Document Type
                </label>
                <label>
                  <input
                    type="radio"
                    checked={searchState.entryType === 'Report'}
                    onChange={() => setSearchState((current) => ({ ...current, entryType: 'Report' }))}
                  />
                  Report
                </label>
              </div>

              <div className="rlm-search-results">
                <div className="rlm-search-results__header">
                  <span>#</span>
                  <span>Type Code</span>
                </div>
                {(searchState.results || []).map((result, index) => (
                  <button
                    key={result.menuEntryId}
                    type="button"
                    className="rlm-search-results__row"
                    onClick={() => handleSelectMenu(result)}
                  >
                    <span>{index + 1}</span>
                    <span>{result.menuCode} - {result.menuName}</span>
                  </button>
                ))}
                {!searchState.results?.length ? <div className="rlm-placeholder">Run a search to see results.</div> : null}
              </div>
            </div>
          )}

        </aside>

      </div>

      <div className="rlm-window__footer">
        <div className="rlm-window__footer-group">
          <button type="button" className="rlm-action-btn" onClick={() => selectedMenuEntry && handleSelectMenu(selectedMenuEntry)}>
            OK
          </button>
          <button type="button" className="rlm-action-btn" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="rlm-action-btn" onClick={handleRefresh}>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReportLayoutManager;
