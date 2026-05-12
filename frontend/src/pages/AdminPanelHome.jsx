import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchAdminEntities } from '../api/adminPanelApi';

const GROUP_ORDER = ['Core Setup', 'Security', 'Navigation', 'Reporting'];

const AdminPanelHome = () => {
  const [entities, setEntities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCancelled = false;

    const loadEntities = async () => {
      try {
        setIsLoading(true);
        setError('');
        const response = await fetchAdminEntities();
        if (!isCancelled) {
          setEntities(response.entities || []);
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(loadError.response?.data?.message || loadError.message || 'Unable to load admin sections.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadEntities();
    return () => {
      isCancelled = true;
    };
  }, []);

  const groupedEntities = useMemo(() => {
    const groups = new Map();

    for (const entity of entities) {
      const groupName = entity.group || 'Other';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }

      groups.get(groupName).push(entity);
    }

    return Array.from(groups.entries()).sort((a, b) => {
      const groupIndexA = GROUP_ORDER.indexOf(a[0]);
      const groupIndexB = GROUP_ORDER.indexOf(b[0]);

      if (groupIndexA === -1 && groupIndexB === -1) {
        return a[0].localeCompare(b[0]);
      }

      if (groupIndexA === -1) return 1;
      if (groupIndexB === -1) return -1;
      return groupIndexA - groupIndexB;
    });
  }, [entities]);

  const totalRecords = entities.reduce((sum, entity) => sum + Number(entity.count || 0), 0);

  return (
    <div className="admin-panel-page">
      <section className="admin-panel-hero">
        <div className="admin-panel-hero__copy">
          <div className="admin-panel-hero__eyebrow">Admin Panel</div>
          <h1>Manage the `henny_master` configuration database</h1>
          <p>
            This workspace gives Admin users full CRUD access to the shared setup tables for companies,
            users, roles, menus, reports, parameters, and rights mappings.
          </p>
        </div>

        <div className="admin-panel-hero__stats">
          <div className="admin-panel-stat-card">
            <span>Admin Sections</span>
            <strong>{entities.length}</strong>
          </div>
          <div className="admin-panel-stat-card">
            <span>Tracked Rows</span>
            <strong>{totalRecords}</strong>
          </div>
        </div>
      </section>

      {isLoading ? (
        <div className="admin-panel-empty">Loading admin sections...</div>
      ) : null}

      {error ? (
        <div className="admin-panel-alert admin-panel-alert--error">{error}</div>
      ) : null}

      {!isLoading && !error ? (
        <div className="admin-panel-groups">
          {groupedEntities.map(([groupName, groupEntities]) => (
            <section key={groupName} className="admin-panel-group">
              <div className="admin-panel-group__header">
                <h2>{groupName}</h2>
                <span>{groupEntities.length} sections</span>
              </div>

              <div className="admin-panel-card-grid">
                {groupEntities.map((entity) => (
                  <Link key={entity.key} to={entity.path} className="admin-panel-card">
                    <div className="admin-panel-card__count">{entity.count}</div>
                    <div className="admin-panel-card__title">{entity.title}</div>
                    <div className="admin-panel-card__description">{entity.description}</div>
                    <div className="admin-panel-card__action">Open section</div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default AdminPanelHome;
