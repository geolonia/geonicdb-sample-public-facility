import { Search, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import type { PublicFacility, FacilityCategory } from '../../types/public-facility';
import {
  FACILITY_CATEGORY_COLORS,
  getFacilityTypeCounts,
  isCurrentlyOpen,
} from '../../types/public-facility';
import { FacilityCard } from './FacilityCard';

interface FacilityListProps {
  facilities: PublicFacility[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

/** Accessibility filter keys */
type AccessibilityFilter = 'wheelchair' | 'nursingRoom';

export function FacilityList({ facilities, selectedId, onSelect }: FacilityListProps) {
  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<FacilityCategory | 'all'>('all');
  const [accessibilityFilters, setAccessibilityFilters] = useState<Set<AccessibilityFilter>>(new Set());
  const [openNowFilter, setOpenNowFilter] = useState(false);

  const typeCounts = useMemo(() => getFacilityTypeCounts(facilities), [facilities]);

  const filteredFacilities = useMemo(() => {
    let result = facilities;

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter((f) => f.facilityType === typeFilter);
    }

    // Text search
    if (searchText) {
      const lower = searchText.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(lower) ||
          f.nameKana.toLowerCase().includes(lower) ||
          f.address.toLowerCase().includes(lower),
      );
    }

    // Accessibility filters
    if (accessibilityFilters.size > 0) {
      result = result.filter((f) => {
        for (const key of accessibilityFilters) {
          if (!f.accessibility[key]) return false;
        }
        return true;
      });
    }

    // Open now filter
    if (openNowFilter) {
      result = result.filter((f) => isCurrentlyOpen(f) === true);
    }

    return result;
  }, [facilities, typeFilter, searchText, accessibilityFilters, openNowFilter]);

  const toggleAccessibility = (key: AccessibilityFilter) => {
    setAccessibilityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="facility-list-root">
      {/* Search */}
      <div className="facility-list-search">
        <div className="facility-search-wrapper">
          <Search className="facility-search-icon" />
          <input
            type="text"
            data-testid="facility-search-input"
            placeholder="施設名・住所で検索"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="facility-search-input"
          />
        </div>
      </div>

      {/* Type filter */}
      <div className="facility-filter-row">
        <button
          data-testid="facility-filter-all"
          onClick={() => setTypeFilter('all')}
          className={`filter-chip${typeFilter === 'all' ? ' active' : ''}`}
          aria-pressed={typeFilter === 'all'}
        >
          すべて
          <span style={{ marginLeft: 4, opacity: 0.6 }}>{facilities.length}</span>
        </button>
        {typeCounts.map(({ type, count }) => {
          const colors = FACILITY_CATEGORY_COLORS[type] ?? FACILITY_CATEGORY_COLORS['その他'];
          const isActive = typeFilter === type;
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className="filter-chip"
              aria-pressed={isActive}
              style={isActive ? { backgroundColor: colors.bg, color: colors.text } : undefined}
            >
              {type}
              <span style={{ marginLeft: 4, opacity: 0.6 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Accessibility & open now filters */}
      <div className="facility-filter-row-2">
        <button
          onClick={() => toggleAccessibility('wheelchair')}
          className={`filter-chip-sq${accessibilityFilters.has('wheelchair') ? ' active' : ''}`}
          aria-pressed={accessibilityFilters.has('wheelchair')}
        >
          車椅子
        </button>
        <button
          onClick={() => toggleAccessibility('nursingRoom')}
          className={`filter-chip-sq${accessibilityFilters.has('nursingRoom') ? ' active' : ''}`}
          aria-pressed={accessibilityFilters.has('nursingRoom')}
        >
          授乳室
        </button>
        <button
          onClick={() => setOpenNowFilter((v) => !v)}
          className={`filter-chip-sq${openNowFilter ? ' active' : ''}`}
          aria-pressed={openNowFilter}
        >
          <Clock style={{ width: 10, height: 10 }} />
          営業中
        </button>
      </div>

      {/* Results count */}
      <div className="facility-count-row">
        <span
          data-testid="facility-count"
          data-count={filteredFacilities.length}
          className="facility-count-text"
        >
          {filteredFacilities.length}件
          {filteredFacilities.length !== facilities.length && ` / 全${facilities.length}件`}
        </span>
      </div>

      {/* List */}
      <div className="facility-list-scroll">
        {filteredFacilities.length === 0 ? (
          <p data-testid="facility-no-results" className="facility-no-results">
            該当する施設がありません
          </p>
        ) : (
          filteredFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              selected={selectedId === facility.id}
              onClick={(f) => onSelect?.(f.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
