const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const authDbService = require('./authDbService');
const { appendVirtualMenus } = require('./virtualMenuService');

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isBcryptHash = (value) => /^\$2[aby]\$\d{2}\$/.test(String(value || ''));

const sanitizeUser = (user) => ({
  userId: user.UserId,
  username: user.Username,
  fullName: user.FullName || user.Username,
  email: user.Email || '',
  isActive: Boolean(user.IsActive),
});

const sanitizeCompany = (company) => ({
  companyId: company.CompanyId,
  companyName: company.CompanyName,
  dbName: company.DbName,
  serverName: company.ServerName,
  licenseServer: company.LicenseServer || '',
  sapVersion: company.SAPVersion || '',
  isDefault: Boolean(company.IsDefault),
});

const createToken = (payload, expiresIn) =>
  jwt.sign(payload, env.jwtSecret, { expiresIn });

const comparePassword = async (password, storedHash) => {
  const normalizedHash = String(storedHash || '');
  if (!normalizedHash) return false;

  if (isBcryptHash(normalizedHash)) {
    return bcrypt.compare(password, normalizedHash);
  }

  return password === normalizedHash;
};

const TOP_LEVEL_MENU_PRIORITY = new Map([
  ['dashboard', 0],
  ['sales', 1],
  ['sales a r', 1],
  ['purchase', 2],
  ['purchase a p', 2],
  ['purchasing', 2],
  ['purchasing a p', 2],
  ['reports', 6],
]);

const normalizeMenuPriorityName = (menuName) =>
  String(menuName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getTopLevelMenuPriority = (menu) => {
  if (menu?.parentId) return Number.MAX_SAFE_INTEGER;

  const normalizedName = normalizeMenuPriorityName(menu?.menuName);
  return TOP_LEVEL_MENU_PRIORITY.get(normalizedName) ?? Number.MAX_SAFE_INTEGER;
};

const buildMenuTree = (menus, rightsByMenuId) => {
  const menusById = new Map();

  for (const menu of menus) {
    menusById.set(menu.MenuId, {
      menuId: menu.MenuId,
      menuName: menu.MenuName,
      menuPath: menu.MenuPath || '',
      parentId: menu.ParentId ?? null,
      icon: menu.Icon || '',
      sortOrder: menu.SortOrder ?? 0,
      rights: rightsByMenuId.get(menu.MenuId) || {
        canView: true,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      },
      children: [],
    });
  }

  const tree = [];

  for (const menu of menusById.values()) {
    if (menu.parentId && menusById.has(menu.parentId)) {
      menusById.get(menu.parentId).children.push(menu);
    } else {
      tree.push(menu);
    }
  }

  const sortMenus = (items) => {
    items.sort((a, b) => {
      const topLevelPriorityDiff = getTopLevelMenuPriority(a) - getTopLevelMenuPriority(b);
      if (topLevelPriorityDiff !== 0) return topLevelPriorityDiff;
      if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
      return a.menuId - b.menuId;
    });

    for (const item of items) {
      sortMenus(item.children);
    }
  };

  sortMenus(tree);
  return tree;
};

const buildAuthorizedMenus = async (roleId) => {
  const [allMenus, roleRights] = await Promise.all([
    authDbService.getAllMenus(),
    authDbService.getRoleRights(roleId),
  ]);

  const visibleRights = roleRights.filter((right) => Boolean(right.CanView));
  const visibleIds = new Set(visibleRights.map((right) => right.MenuId));
  const menuLookup = new Map(allMenus.map((menu) => [menu.MenuId, menu]));

  for (const right of visibleRights) {
    let current = menuLookup.get(right.MenuId);
    while (current?.ParentId && menuLookup.has(current.ParentId)) {
      visibleIds.add(current.ParentId);
      current = menuLookup.get(current.ParentId);
    }
  }

  const rightsByMenuId = new Map(
    visibleRights.map((right) => [
      right.MenuId,
      {
        canView: Boolean(right.CanView),
        canAdd: Boolean(right.CanAdd),
        canEdit: Boolean(right.CanEdit),
        canDelete: Boolean(right.CanDelete),
      },
    ]),
  );

  const visibleMenus = allMenus.filter((menu) => visibleIds.has(menu.MenuId));
  const menuTree = buildMenuTree(visibleMenus, rightsByMenuId);
  const menuPaths = visibleMenus
    .map((menu) => String(menu.MenuPath || '').trim())
    .filter(Boolean);

  return appendVirtualMenus({
    menus: menuTree,
    menuPaths,
  });
};

const login = async (username, password) => {
  const normalizedUsername = String(username || '').trim();
  const normalizedPassword = String(password || '');

  if (!normalizedUsername || !normalizedPassword) {
    throw createHttpError(400, 'Username and password are required.');
  }

  const user = await authDbService.findUserByUsername(normalizedUsername);

  if (!user || !user.IsActive) {
    throw createHttpError(401, 'Invalid username or password.');
  }

  const isValidPassword = await comparePassword(normalizedPassword, user.PasswordHash);
  if (!isValidPassword) {
    throw createHttpError(401, 'Invalid username or password.');
  }

  const preAuthToken = createToken(
    {
      tokenType: 'pending',
      userId: user.UserId,
      username: user.Username,
    },
    env.pendingJwtExpiresIn,
  );

  return {
    preAuthToken,
    user: sanitizeUser(user),
  };
};

const getActiveCompanies = async () => {
  const companies = await authDbService.getActiveCompanies();
  return companies.map(sanitizeCompany);
};

const getCompaniesForUser = async (userId) => {
  const companies = await authDbService.getUserCompanies(userId);
  return companies.map(sanitizeCompany);
};

const selectCompany = async (userId, companyId) => {
  const [company, role] = await Promise.all([
    authDbService.getAssignedCompanyForUser(userId, companyId),
    authDbService.getUserRoleForCompany(userId, companyId),
  ]);

  if (!company) {
    throw createHttpError(403, 'You do not have access to the selected company.');
  }

  if (!role) {
    throw createHttpError(403, 'No role is assigned for the selected company.');
  }

  const { menus, menuPaths } = await buildAuthorizedMenus(role.RoleId);
  const accessToken = createToken(
    {
      tokenType: 'access',
      userId,
      companyId,
      roleId: role.RoleId,
    },
    env.jwtExpiresIn,
  );

  return {
    token: accessToken,
    userId,
    companyId,
    roleId: role.RoleId,
    roleName: role.RoleName,
    company: sanitizeCompany(company),
    menus,
    menuPaths,
  };
};

const getMenuForRole = async (roleId) => buildAuthorizedMenus(roleId);

module.exports = {
  createHttpError,
  login,
  getActiveCompanies,
  getCompaniesForUser,
  selectCompany,
  getMenuForRole,
};
