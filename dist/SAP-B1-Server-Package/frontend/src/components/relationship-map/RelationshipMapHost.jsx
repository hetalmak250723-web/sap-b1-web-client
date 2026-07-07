import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchRelationshipMap } from '../../api/relationshipMapApi';
import './relationshipMap.css';

const RELATIONSHIP_CONTEXT_KEY = '__sapRelationshipMapContext';

const formatRelationshipDate = (value) => {
  if (!value) return '';
  const raw = String(value).split('T')[0];
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw;
  return `${match[3]}/${match[2]}/${match[1].slice(-2)}`;
};

const formatRelationshipMoney = (value, currency = 'INR') => {
  const number = Number(value);
  if (!Number.isFinite(number)) return '';
  return `${currency || 'INR'} ${number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getRelationshipNodeClass = (node) => {
  const objectType = Number(node?.objectType);
  if (node?.type === 'businessPartner') return 'rm-node--bp';
  if (objectType === 17 || objectType === 22) return 'rm-node--order';
  if (objectType === 13 || objectType === 18) return 'rm-node--invoice';
  if (objectType === 14 || objectType === 19) return 'rm-node--credit-memo';
  if (objectType === 24 || objectType === 46) return 'rm-node--payment';
  if (objectType === 30) return 'rm-node--journal';
  return 'rm-node--document';
};

const getFallbackSalesLabel = (objectType) => {
  const labels = {
    23: 'Sales Quotation',
    17: 'Sales Order',
    15: 'Delivery',
    13: 'A/R Invoice',
    14: 'A/R Credit Memo',
    1470000113: 'Purchase Request',
    540000006: 'Purchase Quotation',
    22: 'Purchase Order',
    20: 'Goods Receipt PO',
    18: 'A/P Invoice',
    19: 'A/P Credit Memo',
    24: 'Incoming Payment',
    46: 'Outgoing Payment',
    30: 'Journal Entry',
  };
  return labels[Number(objectType)] || 'Document';
};

const normalizeContext = (context = {}) => ({
  ...context,
  enabled: Boolean(context.enabled && context.objectType && context.docEntry),
  objectType: context.objectType ? Number(context.objectType) : null,
  docEntry: context.docEntry ? Number(context.docEntry) : null,
});

const NODE_WIDTH = 176;
const NODE_HEIGHT = 224;
const BP_HEIGHT = 114;
const COLUMN_GAP = 300;
const ROW_GAP = 38;
const TREE_LEFT = 24;
const TREE_TOP = 22;

const getNodeHeight = (node) => (node?.type === 'businessPartner' ? BP_HEIGHT : NODE_HEIGHT);

const getNodeSortValue = (node = {}) => [
  Number(node.rank || 0),
  String(node.postingDate || node.documentDate || ''),
  Number(node.docNum || node.docEntry || 0),
  String(node.label || ''),
].join('|');

const buildRelationshipTreeLayout = (nodes = [], edges = []) => {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const docNodes = nodes.filter((node) => node.type !== 'businessPartner');
  const bpNode = nodes.find((node) => node.type === 'businessPartner');
  const children = new Map();
  const parents = new Map();

  edges.forEach((edge) => {
    if (!nodeMap.has(edge.from) || !nodeMap.has(edge.to)) return;
    if (!children.has(edge.from)) children.set(edge.from, []);
    if (!parents.has(edge.to)) parents.set(edge.to, []);
    children.get(edge.from).push(edge.to);
    parents.get(edge.to).push(edge.from);
  });

  children.forEach((childIds) => {
    childIds.sort((a, b) => getNodeSortValue(nodeMap.get(a)).localeCompare(getNodeSortValue(nodeMap.get(b))));
  });

  const docIds = new Set(docNodes.map((node) => node.id));
  const roots = docNodes
    .filter((node) => !(parents.get(node.id) || []).some((parentId) => docIds.has(parentId)))
    .sort((a, b) => getNodeSortValue(a).localeCompare(getNodeSortValue(b)))
    .map((node) => node.id);

  if (!roots.length && docNodes.length) {
    roots.push(docNodes[0].id);
  }

  const positions = {};
  let nextLeafY = TREE_TOP + 128;
  let maxDepth = 0;
  const laidOut = new Set();

  const layoutNode = (nodeId, depth, stack = new Set()) => {
    if (positions[nodeId]) return positions[nodeId].y;
    if (stack.has(nodeId)) {
      const fallbackY = nextLeafY;
      nextLeafY += NODE_HEIGHT + ROW_GAP;
      positions[nodeId] = { x: TREE_LEFT + 210 + depth * COLUMN_GAP, y: fallbackY };
      return fallbackY;
    }

    stack.add(nodeId);
    maxDepth = Math.max(maxDepth, depth);

    const nodeChildren = (children.get(nodeId) || []).filter((childId) => docIds.has(childId));
    let y;
    if (nodeChildren.length) {
      const childYs = nodeChildren.map((childId) => layoutNode(childId, depth + 1, stack));
      y = childYs.reduce((sum, childY) => sum + childY, 0) / childYs.length;
    } else {
      y = nextLeafY;
      nextLeafY += NODE_HEIGHT + ROW_GAP;
    }

    positions[nodeId] = { x: TREE_LEFT + 210 + depth * COLUMN_GAP, y };
    laidOut.add(nodeId);
    stack.delete(nodeId);
    return y;
  };

  roots.forEach((rootId) => layoutNode(rootId, 0));

  docNodes
    .filter((node) => !laidOut.has(node.id))
    .forEach((node) => layoutNode(node.id, maxDepth + 1));

  if (bpNode) {
    const rootYs = roots.map((rootId) => positions[rootId]?.y).filter((value) => Number.isFinite(value));
    positions[bpNode.id] = {
      x: TREE_LEFT,
      y: rootYs.length ? Math.max(TREE_TOP, (rootYs.reduce((sum, y) => sum + y, 0) / rootYs.length) - 120) : TREE_TOP,
    };
  }

  const allPositions = Object.values(positions);
  const width = Math.max(1040, ...allPositions.map((pos) => pos.x + NODE_WIDTH + 80));
  const height = Math.max(530, ...nodes.map((node) => {
    const pos = positions[node.id] || { y: TREE_TOP };
    return pos.y + getNodeHeight(node) + 80;
  }));

  return { positions, width, height };
};

function RelationshipNode({ node, position, onDragStart }) {
  const objectType = Number(node.objectType);

  return (
    <div
      className={`rm-node ${getRelationshipNodeClass(node)}`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={(event) => onDragStart(event, node.id)}
      title="Drag"
    >
      <div className="rm-node__title">{node.label}</div>
      {node.type !== 'businessPartner' && <div className="rm-node__lock" aria-hidden="true" />}
      <div className="rm-node__body">
        {node.type === 'businessPartner' ? (
          <>
            <div>{node.cardCode || '-'}</div>
            <div>{node.cardName || '-'}</div>
          </>
        ) : (
          <>
            <div className="rm-node__num">{node.docNum || '-'}</div>
            <div className="rm-node__date">{formatRelationshipDate(node.documentDate || node.postingDate)}</div>
            <div className="rm-node__ref" title={node.customerRefNo || ''}>{node.customerRefNo || ''}</div>
            <div className="rm-node__total">{formatRelationshipMoney(node.total, node.currency)}</div>
          </>
        )}
      </div>
      {(objectType === 13 || objectType === 18) && <div className="rm-node__bottom" />}
    </div>
  );
}

function RelationshipMapTree({ nodes, edges }) {
  const canvasRef = useRef(null);
  const [manualPositions, setManualPositions] = useState({});
  const [drag, setDrag] = useState(null);
  const layout = useMemo(() => buildRelationshipTreeLayout(nodes, edges), [nodes, edges]);

  useEffect(() => {
    setManualPositions({});
  }, [nodes, edges]);

  const positions = useMemo(() => ({
    ...layout.positions,
    ...manualPositions,
  }), [layout.positions, manualPositions]);

  const startDrag = useCallback((event, nodeId) => {
    if (event.button !== 0) return;
    const canvas = canvasRef.current;
    const position = positions[nodeId];
    if (!canvas || !position) return;

    const rect = canvas.getBoundingClientRect();
    setDrag({
      nodeId,
      offsetX: event.clientX - rect.left + canvas.scrollLeft - position.x,
      offsetY: event.clientY - rect.top + canvas.scrollTop - position.y,
    });
    event.preventDefault();
  }, [positions]);

  useEffect(() => {
    if (!drag) return undefined;

    const handleMove = (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = Math.max(0, event.clientX - rect.left + canvas.scrollLeft - drag.offsetX);
      const y = Math.max(0, event.clientY - rect.top + canvas.scrollTop - drag.offsetY);
      setManualPositions((current) => ({
        ...current,
        [drag.nodeId]: { x, y },
      }));
    };

    const stopDrag = () => setDrag(null);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', stopDrag);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [drag]);

  const visibleEdges = edges.filter((edge) => positions[edge.from] && positions[edge.to]);

  return (
    <div className="rm-canvas" ref={canvasRef}>
      <div className="rm-tree" style={{ width: layout.width, height: layout.height }}>
        <svg className="rm-links" width={layout.width} height={layout.height} aria-hidden="true">
          <defs>
            <marker id="rm-arrow-blue" markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L10,5 L0,10 z" fill="#8fb5de" />
            </marker>
            <marker id="rm-arrow-yellow" markerWidth="12" markerHeight="10" refX="10" refY="5" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L10,5 L0,10 z" fill="#f1ce2f" />
            </marker>
          </defs>
          {visibleEdges.map((edge) => {
            const fromNode = nodes.find((node) => node.id === edge.from);
            const toNode = nodes.find((node) => node.id === edge.to);
            const from = positions[edge.from];
            const to = positions[edge.to];
            const x1 = from.x + NODE_WIDTH;
            const y1 = from.y + getNodeHeight(fromNode) / 2;
            const x2 = to.x;
            const y2 = to.y + getNodeHeight(toNode) / 2;
            const isPaymentEdge = Number(toNode?.objectType) === 24 || Number(toNode?.objectType) === 46;
            const colorClass = isPaymentEdge ? 'rm-link rm-link--payment' : 'rm-link';
            const marker = isPaymentEdge ? 'url(#rm-arrow-yellow)' : 'url(#rm-arrow-blue)';

            return (
              <path
                key={`${edge.from}-${edge.to}-${edge.type || ''}`}
                className={colorClass}
                d={`M ${x1} ${y1} C ${x1 + 90} ${y1}, ${x2 - 90} ${y2}, ${x2} ${y2}`}
                markerEnd={marker}
              />
            );
          })}
        </svg>
        {nodes.map((node) => (
          <RelationshipNode
            key={node.id}
            node={node}
            position={positions[node.id] || { x: TREE_LEFT, y: TREE_TOP }}
            onDragStart={startDrag}
          />
        ))}
      </div>
    </div>
  );
}

export const useRelationshipMapRegistration = (context) => {
  const normalized = useMemo(() => normalizeContext(context), [
    context?.enabled,
    context?.objectType,
    context?.docEntry,
    context?.header,
    context?.total,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if (normalized.enabled) {
      window[RELATIONSHIP_CONTEXT_KEY] = normalized;
    } else if (
      window[RELATIONSHIP_CONTEXT_KEY]?.objectType === normalized.objectType &&
      window[RELATIONSHIP_CONTEXT_KEY]?.docEntry === normalized.docEntry
    ) {
      window[RELATIONSHIP_CONTEXT_KEY] = null;
    }

    return () => {
      const active = window[RELATIONSHIP_CONTEXT_KEY];
      if (
        active?.objectType === normalized.objectType &&
        active?.docEntry === normalized.docEntry
      ) {
        window[RELATIONSHIP_CONTEXT_KEY] = null;
      }
    };
  }, [normalized]);
};

function RelationshipMapModal({ isOpen, loading, error, data, fallbackContext, onClose }) {
  if (!isOpen) return null;

  const fallbackHeader = fallbackContext?.header || {};
  const nodes = Array.isArray(data?.nodes) ? data.nodes : [];
  const bpNode = nodes.find((node) => node.type === 'businessPartner') || {
    id: `bp-${fallbackHeader.vendor || fallbackHeader.customerCode || fallbackHeader.cardCode || fallbackHeader.businessPartnerCode || 'fallback'}`,
    type: 'businessPartner',
    label: 'Business Partners',
    cardCode: fallbackHeader.vendor || fallbackHeader.customerCode || fallbackHeader.cardCode || fallbackHeader.businessPartnerCode || '',
    cardName: fallbackHeader.name || fallbackHeader.customerName || fallbackHeader.cardName || fallbackHeader.businessPartnerName || '',
  };
  const documentNodes = nodes.filter((node) => node.type !== 'businessPartner');
  const fallbackDocument = documentNodes.length ? null : {
    id: `${fallbackContext?.objectType || 'document'}-${fallbackContext?.docEntry || 'fallback'}`,
    objectType: fallbackContext?.objectType,
    label: getFallbackSalesLabel(fallbackContext?.objectType),
    docNum: fallbackHeader.docNo || fallbackHeader.docNum || fallbackHeader.documentNumber || fallbackHeader.number || fallbackHeader.transNo || fallbackContext?.docEntry,
    documentDate: fallbackHeader.documentDate || fallbackHeader.postingDate,
    postingDate: fallbackHeader.postingDate,
    customerRefNo: fallbackHeader.customerRefNo || fallbackHeader.salesContractNo || fallbackHeader.vendorRefNo || fallbackHeader.referenceNumber || fallbackHeader.remarks || fallbackHeader.journalRemarks || '',
    total: fallbackContext?.total || fallbackHeader.totalPaymentDue || fallbackHeader.totalAmountDue || fallbackHeader.totalAmount || fallbackHeader.total || 0,
    currency: fallbackHeader.currency || fallbackHeader.docCurrency || 'INR',
  };
  const visibleDocuments = fallbackDocument ? [fallbackDocument] : documentNodes;
  const visibleNodes = [bpNode, ...visibleDocuments];
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
  const visibleEdges = Array.isArray(data?.edges)
    ? data.edges.filter((edge) => visibleNodeIds.has(edge.from) && visibleNodeIds.has(edge.to))
    : [];
  const mapEdges = visibleEdges.length
    ? visibleEdges
    : visibleDocuments.length
      ? [{ from: bpNode.id, to: visibleDocuments[0].id, type: 'bp-to-document' }]
      : [];

  return (
    <div className="rm-overlay" role="dialog" aria-modal="true" aria-label="Relationship Map">
      <div className="rm-window" onClick={(event) => event.stopPropagation()}>
        <div className="rm-titlebar">
          <span>Relationship Map</span>
          <div className="rm-window-controls" aria-hidden="true">
            <span />
            <span />
            <button type="button" onClick={onClose} aria-label="Close">x</button>
          </div>
        </div>
        <div className="rm-accent" />
        {loading ? (
          <div className="rm-canvas">
            <div className="rm-state">Loading relationship map...</div>
          </div>
        ) : error ? (
          <div className="rm-canvas">
            <div className="rm-state rm-state--error">{error}</div>
          </div>
        ) : (
          <RelationshipMapTree nodes={visibleNodes} edges={mapEdges} />
        )}
        <div className="rm-footer">
          <div className="rm-selector">Marketing Document: Document Tree</div>
          <button type="button" className="rm-ok" onClick={onClose}>OK</button>
          <button type="button" className="rm-btn" disabled>Go Back</button>
          <button type="button" className="rm-btn" disabled>Go Forward</button>
          <label className="rm-checkbox">
            <input type="checkbox" />
            Referenced Documents
          </label>
        </div>
      </div>
    </div>
  );
}

export default function RelationshipMapHost() {
  const [menu, setMenu] = useState({ open: false, x: 0, y: 0, context: null });
  const [modal, setModal] = useState({ open: false, loading: false, error: '', data: null, context: null });

  const closeMenu = useCallback(() => {
    setMenu((prev) => (prev.open ? { ...prev, open: false } : prev));
  }, []);

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false, loading: false }));
  }, []);

  const openMap = useCallback(async () => {
    const context = menu.context;
    if (!context?.enabled) return;

    setMenu((prev) => ({ ...prev, open: false }));
    setModal({ open: true, loading: true, error: '', data: null, context });

    try {
      const response = await fetchRelationshipMap({
        objectType: context.objectType,
        docEntry: context.docEntry,
      });
      setModal({
        open: true,
        loading: false,
        error: '',
        data: response.data?.relationshipMap || null,
        context,
      });
    } catch (error) {
      setModal({
        open: true,
        loading: false,
        error: error?.response?.data?.detail || error?.message || 'Failed to load relationship map.',
        data: null,
        context,
      });
    }
  }, [menu.context]);

  useEffect(() => {
    const handleContextMenu = (event) => {
      const context = typeof window !== 'undefined' ? window[RELATIONSHIP_CONTEXT_KEY] : null;
      if (!context?.enabled) return;
      if (!event.target?.closest?.('.sap-document-page')) return;
      if (event.target?.closest?.('.rm-overlay, .rm-context-menu')) return;

      event.preventDefault();
      const viewportWidth = window.innerWidth || 1024;
      const viewportHeight = window.innerHeight || 768;
      const menuWidth = 210;
      const menuHeight = 38;
      const x = Math.min(event.clientX, Math.max(8, viewportWidth - menuWidth - 8));
      const y = Math.min(event.clientY, Math.max(8, viewportHeight - menuHeight - 8));

      setMenu({ open: true, x, y, context });
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  useEffect(() => {
    if (!menu.open) return undefined;

    const close = () => closeMenu();
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') closeMenu();
    };

    document.addEventListener('click', close);
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    document.addEventListener('keydown', closeOnEscape);

    return () => {
      document.removeEventListener('click', close);
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [menu.open, closeMenu]);

  return (
    <>
      {menu.open && (
        <div
          className="rm-context-menu"
          style={{ left: menu.x, top: menu.y }}
          onClick={(event) => event.stopPropagation()}
          data-document-dirty-ignore="true"
        >
          <button type="button" onClick={openMap}>
            Relationship Map...
          </button>
        </div>
      )}
      <RelationshipMapModal
        isOpen={modal.open}
        loading={modal.loading}
        error={modal.error}
        data={modal.data}
        fallbackContext={modal.context}
        onClose={closeModal}
      />
    </>
  );
}
