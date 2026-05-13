const DEFAULT_RIGHTS = {
  canView: true,
  canAdd: false,
  canEdit: false,
  canDelete: false,
};

const cloneMenuNode = (node) => ({
  ...node,
  rights: { ...(node.rights || DEFAULT_RIGHTS) },
  children: Array.isArray(node.children) ? node.children.map(cloneMenuNode) : [],
});

const normalizeMenuName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const findMatchingChild = (items, template) =>
  items.find((item) => {
    if (template.menuPath) {
      return String(item.menuPath || '').trim().toLowerCase() === String(template.menuPath).trim().toLowerCase();
    }

    return normalizeMenuName(item.menuName) === normalizeMenuName(template.menuName);
  });

const mergeMenuNode = (existingNode, templateNode) => {
  if (!existingNode.menuPath && templateNode.menuPath) {
    existingNode.menuPath = templateNode.menuPath;
  }

  if (!existingNode.icon && templateNode.icon) {
    existingNode.icon = templateNode.icon;
  }

  if (existingNode.sortOrder === undefined || existingNode.sortOrder === null) {
    existingNode.sortOrder = templateNode.sortOrder ?? 0;
  }

  if (!existingNode.rights) {
    existingNode.rights = { ...(templateNode.rights || DEFAULT_RIGHTS) };
  }

  if (!Array.isArray(existingNode.children)) {
    existingNode.children = [];
  }

  for (const childTemplate of templateNode.children || []) {
    upsertMenuNode(existingNode.children, childTemplate, existingNode.menuId);
  }
};

const upsertMenuNode = (items, templateNode, parentId = null) => {
  const existingNode = findMatchingChild(items, templateNode);
  if (existingNode) {
    mergeMenuNode(existingNode, templateNode);
    return existingNode;
  }

  const newNode = cloneMenuNode({
    ...templateNode,
    parentId,
  });
  items.push(newNode);
  return newNode;
};

const appendVirtualMenus = (menuPayload = {}) => {
  const menus = Array.isArray(menuPayload.menus) ? [...menuPayload.menus] : [];
  const menuPaths = Array.isArray(menuPayload.menuPaths) ? [...menuPayload.menuPaths] : [];

  return {
    menus,
    menuPaths,
  };
};

module.exports = {
  appendVirtualMenus,
};
