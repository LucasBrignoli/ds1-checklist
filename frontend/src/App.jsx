import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';

const CATEGORY_LABELS = {
  Armas: 'Armas y escudos',
  Hechizos: 'Hechizos',
  Milagros: 'Milagros',
  Piromancias: 'Piromancias',
  Pactos: 'Pactos'
};

function useDebouncedSave(value, ready, delay) {
  const timer = useRef(null);
  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        await fetch('/api/progress', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ progress: value })
        });
      } catch (e) {
        console.error('no se pudo guardar el progreso', e);
      }
    }, delay);
    return () => timer.current && clearTimeout(timer.current);
  }, [value, ready, delay]);
}

export default function App() {
  const [dsData, setDsData] = useState([]);
  const [checked, setChecked] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeCat, setActiveCat] = useState('Armas');
  const [query, setQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [missableOnly, setMissableOnly] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [itemsRes, progressRes] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/progress')
        ]);
        const items = await itemsRes.json();
        const progress = await progressRes.json();
        setDsData(items);
        setChecked(progress);
      } catch (e) {
        setLoadError(true);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useDebouncedSave(checked, loaded, 400);

  const toggle = useCallback((id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleAllInCategory = useCallback((categoria, value) => {
    setChecked((prev) => {
      const cat = dsData.find((c) => c.categoria === categoria);
      if (!cat) return prev;
      const next = { ...prev };
      cat.items.forEach((it) => { next[it.id] = value; });
      return next;
    });
  }, [dsData]);

  const totals = useMemo(() => {
    const perCat = {};
    let doneAll = 0;
    let totalAll = 0;
    dsData.forEach(({ categoria, items }) => {
      const done = items.filter((it) => checked[it.id]).length;
      perCat[categoria] = { done, total: items.length };
      doneAll += done;
      totalAll += items.length;
    });
    return { perCat, doneAll, totalAll };
  }, [dsData, checked]);

  const activeItems = useMemo(() => {
    const cat = dsData.find((c) => c.categoria === activeCat);
    if (!cat) return [];
    const q = query.trim().toLowerCase();
    return cat.items.filter((it) => {
      if (missableOnly && !it.missable) return false;
      if (filterMode === 'pending' && checked[it.id]) return false;
      if (filterMode === 'done' && !checked[it.id]) return false;
      if (q && !it.nombre.toLowerCase().includes(q) && !it.ubicacion.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [dsData, activeCat, query, filterMode, missableOnly, checked]);

  const pct = totals.totalAll ? Math.round((totals.doneAll / totals.totalAll) * 100) : 0;
  const activeTotal = totals.perCat[activeCat] || { done: 0, total: 0 };
  const allDoneInCategory = activeTotal.total > 0 && activeTotal.done === activeTotal.total;

  return (
    <div style={S.root}>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        button, li, [role="checkbox"] {
          outline: none !important;
          box-shadow: none !important;
          forced-color-adjust: none;
        }
        button:focus, button:focus-visible, button:active,
        li:focus, li:focus-visible,
        [role="checkbox"]:focus, [role="checkbox"]:focus-visible, [role="checkbox"]:active {
          outline: none !important;
          box-shadow: none !important;
        }
      `}</style>
      <header style={S.header}>
        <div style={S.headerTop}>
          <div>
            <p style={S.eyebrow}>Dark Souls Remastered · checklist de platinado</p>
            <h1 style={S.title}>Bonfire log</h1>
          </div>
          <div style={S.emberWrap}>
            <svg width="46" height="58" viewBox="0 0 46 58" fill="none" aria-hidden="true">
              <path d="M23 2 C10 16 6 26 6 36 C6 48 13.5 56 23 56 C32.5 56 40 48 40 36 C40 26 36 16 23 2 Z"
                fill="none" stroke="#6b4a2e" strokeWidth="1.5" opacity="0.5" />
              <path d="M23 12 C15 22 12 29 12 37 C12 45.5 16.8 51 23 51 C29.2 51 34 45.5 34 37 C34 29 31 22 23 12 Z"
                fill={emberFill(pct)} stroke="#3a2416" strokeWidth="1" style={{ transition: 'fill 0.4s ease' }} />
            </svg>
          </div>
        </div>

        <div style={S.progressRow}>
          <div style={S.progressBarOuter}>
            <div style={{ ...S.progressBarInner, width: `${pct}%` }} />
          </div>
          <span style={S.progressLabel}>{totals.doneAll} / {totals.totalAll} · {pct}%</span>
        </div>

        <nav style={S.tabs}>
          {dsData.map(({ categoria }) => {
            const t = totals.perCat[categoria] || { done: 0, total: 0 };
            const isActive = activeCat === categoria;
            return (
              <button
                key={categoria}
                onClick={() => setActiveCat(categoria)}
                style={{ ...S.tab, ...(isActive ? S.tabActive : {}) }}
              >
                <span style={S.tabName}>{CATEGORY_LABELS[categoria] || categoria}</span>
                <span style={S.tabCount}>{t.done}/{t.total}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <div style={S.controls}>
        <input
          type="text"
          placeholder="Buscar por nombre o ubicacion..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={S.search}
        />
        <div style={S.filterGroup}>
          {[
            { key: 'all', label: 'Todos' },
            { key: 'pending', label: 'Pendientes' },
            { key: 'done', label: 'Conseguidos' }
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterMode(f.key)}
              style={{ ...S.filterBtn, ...(filterMode === f.key ? S.filterBtnActive : {}) }}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={() => setMissableOnly((v) => !v)}
            style={{ ...S.filterBtn, ...(missableOnly ? S.filterBtnMissable : {}) }}
            title="Mostrar solo items con eleccion irreversible"
          >
            Solo missables
          </button>
        </div>
      </div>

      {!loaded && <p style={S.status}>Encendiendo la hoguera...</p>}
      {loaded && loadError && (
        <p style={{ ...S.status, color: '#c97a6a' }}>
          No se pudo conectar con el backend. Corré el servidor FastAPI (ver README) y recargá.
        </p>
      )}

      <ul style={S.list}>
        {loaded && !loadError && activeItems.length === 0 && (
          <li style={S.empty}>Nada por aca con esos filtros.</li>
        )}
        {activeItems.map((it) => (
          <li key={it.id} style={{ ...S.item, ...(checked[it.id] ? S.itemDone : {}) }}>
            <button
              role="checkbox"
              aria-checked={!!checked[it.id]}
              aria-label={`Marcar ${it.nombre} como conseguido`}
              onClick={(e) => { toggle(it.id); e.currentTarget.blur(); }}
              style={{ ...S.checkbox, ...(checked[it.id] ? S.checkboxDone : {}) }}
            >
              {checked[it.id] ? '✓' : ''}
            </button>
            <div style={S.itemBody}>
              <div style={S.itemNameRow}>
                <span style={{ ...S.itemName, ...(checked[it.id] ? S.itemNameDone : {}) }}>{it.nombre}</span>
                {it.missable && <span style={S.missBadge}>elección irreversible</span>}
                {it.coste != null && <span style={S.costBadge}>{it.coste.toLocaleString('es-AR')} almas</span>}
              </div>
              <p style={S.itemLoc}>{it.ubicacion}</p>
            </div>
          </li>
        ))}
      </ul>

      {loaded && !loadError && (
        <div
          role="checkbox"
          aria-checked={allDoneInCategory}
          onClick={(e) => { toggleAllInCategory(activeCat, !allDoneInCategory); e.currentTarget.blur(); }}
          style={{ ...S.item, ...S.totalItem, cursor: 'pointer' }}
        >
          <span style={{ ...S.checkbox, ...(allDoneInCategory ? S.checkboxDone : {}) }}>
            {allDoneInCategory ? '✓' : ''}
          </span>
          <span style={S.itemName}>Total: {activeTotal.done}/{activeTotal.total}</span>
        </div>
      )}
    </div>
  );
}

function emberFill(pct) {
  if (pct >= 100) return '#e8a662';
  if (pct >= 60) return '#c96a34';
  if (pct >= 25) return '#8a4a2a';
  return '#4a2f20';
}

const S = {
  root: {
    fontFamily: "'EB Garamond', Georgia, serif",
    background: '#15130f',
    color: '#ded4c2',
    padding: '28px 24px 40px',
    borderRadius: '10px',
    maxWidth: '720px',
    margin: '0 auto'
  },
  header: { marginBottom: '20px' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' },
  eyebrow: {
    margin: 0,
    fontSize: '12px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#9a8f78'
  },
  title: {
    margin: '4px 0 0',
    fontFamily: "'Cinzel', serif",
    fontWeight: 600,
    fontSize: '28px',
    letterSpacing: '0.02em',
    color: '#e8dcc4'
  },
  emberWrap: { flexShrink: 0, paddingTop: '2px' },
  progressRow: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '18px' },
  progressBarOuter: {
    flex: 1,
    height: '6px',
    background: '#2a2620',
    borderRadius: '3px',
    overflow: 'hidden',
    border: '1px solid #3a352a'
  },
  progressBarInner: {
    height: '100%',
    background: 'linear-gradient(90deg, #6b3a1f, #c96a34)',
    transition: 'width 0.4s ease'
  },
  progressLabel: { fontSize: '14px', color: '#b6a98e', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginTop: '20px',
    borderBottom: '1px solid #322d24',
    paddingBottom: '12px'
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '2px',
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid #3a352a',
    borderRadius: '6px',
    color: '#b6a98e',
    cursor: 'pointer',
    fontFamily: "'EB Garamond', serif"
  },
  tabActive: {
    background: '#241f17',
    borderColor: '#c96a34',
    color: '#e8dcc4'
  },
  tabName: { fontSize: '14px' },
  tabCount: { fontSize: '12px', color: '#8a7d64', fontVariantNumeric: 'tabular-nums' },
  controls: { display: 'flex', flexDirection: 'column', gap: '10px', margin: '18px 0' },
  search: {
    background: '#1c1912',
    border: '1px solid #3a352a',
    borderRadius: '6px',
    padding: '9px 12px',
    color: '#ded4c2',
    fontFamily: "'EB Garamond', serif",
    fontSize: '15px'
  },
  filterGroup: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  filterBtn: {
    padding: '6px 12px',
    background: 'transparent',
    border: '1px solid #3a352a',
    borderRadius: '5px',
    color: '#b6a98e',
    fontSize: '13px',
    cursor: 'pointer',
    fontFamily: "'EB Garamond', serif"
  },
  filterBtnActive: { borderColor: '#c96a34', color: '#e8dcc4', background: '#241f17' },
  filterBtnMissable: { borderColor: '#8a3a3a', color: '#e0b0a8', background: '#2a1a17' },
  status: { color: '#8a7d64', fontSize: '14px', fontStyle: 'italic', padding: '8px 0' },
  list: { listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  empty: { color: '#8a7d64', fontStyle: 'italic', padding: '20px 0', textAlign: 'center' },
  item: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    padding: '12px',
    background: '#1c1912',
    border: '1px solid #2e2a20',
    borderRadius: '7px'
  },
  itemDone: { background: '#181510', borderColor: '#2a2620', opacity: 0.7 },
  totalItem: { marginTop: '8px', borderColor: '#4a3f2a' },
  checkbox: {
    flexShrink: 0,
    width: '22px',
    height: '22px',
    borderRadius: '4px',
    border: '1px solid #6b6250',
    appearance: 'none',
    WebkitAppearance: 'none',
    outline: 'none',
    background: 'transparent',
    color: '#e8dcc4',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    marginTop: '2px',
    padding: 0
  },
  checkboxDone: { background: '#5a3a22', borderColor: '#c96a34' },
  itemBody: { flex: 1, minWidth: 0 },
  itemNameRow: { display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px' },
  itemName: { fontSize: '16px', fontWeight: 600, color: '#e8dcc4' },
  itemNameDone: { textDecoration: 'line-through', color: '#8a7d64' },
  missBadge: {
    fontSize: '11px',
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    color: '#e0b0a8',
    background: '#2a1a17',
    border: '1px solid #5a2f2a',
    borderRadius: '4px',
    padding: '2px 6px'
  },
  costBadge: {
    fontSize: '12px',
    color: '#a89468',
    background: '#241f17',
    border: '1px solid #4a3f2a',
    borderRadius: '4px',
    padding: '2px 6px'
  },
  itemLoc: { margin: '4px 0 0', fontSize: '14px', lineHeight: 1.5, color: '#b6a98e' }
};
