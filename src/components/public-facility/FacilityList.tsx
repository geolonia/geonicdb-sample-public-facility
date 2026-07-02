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
  selectedFacilityId: string | null;
  onFacilityClick: (facility: PublicFacility) => void;
}

/** Accessibility filter keys */
type AccessibilityFilter = 'wheelchair' | 'nursingRoom';

export function FacilityList({ facilities, selectedFacilityId, onFacilityClick }: FacilityListProps) {
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
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            data-testid="facility-search-input"
            placeholder="施設名・住所で検索"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-400"
          />
        </div>
      </div>

      {/* Type filter */}
      <div className="px-4 pb-2 flex gap-1 flex-wrap">
        <button
          data-testid="facility-filter-all"
          onClick={() => setTypeFilter('all')}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
            typeFilter === 'all'
              ? 'bg-brand-100 text-brand-700'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          すべて
          <span className="ml-1 opacity-60">{facilities.length}</span>
        </button>
        {typeCounts.map(({ type, count }) => {
          const colors = FACILITY_CATEGORY_COLORS[type] ?? FACILITY_CATEGORY_COLORS['その他'];
          return (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                typeFilter === type
                  ? `${colors.bg} ${colors.text}`
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {type}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Accessibility & open now filters */}
      <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
        <button
          onClick={() => toggleAccessibility('wheelchair')}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            accessibilityFilters.has('wheelchair')
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
        >
          車椅子
        </button>
        <button
          onClick={() => toggleAccessibility('nursingRoom')}
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            accessibilityFilters.has('nursingRoom')
              ? 'bg-pink-100 text-pink-700'
              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
        >
          授乳室
        </button>
        <button
          onClick={() => setOpenNowFilter((v) => !v)}
          className={`flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            openNowFilter
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
          }`}
        >
          <Clock className="w-2.5 h-2.5" />
          営業中
        </button>
      </div>

      {/* Results count */}
      <div className="px-4 pb-2">
        <span data-testid="facility-count" data-count={filteredFacilities.length} className="text-[10px] text-gray-400">
          {filteredFacilities.length}件
          {filteredFacilities.length !== facilities.length && ` / 全${facilities.length}件`}
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {filteredFacilities.length === 0 ? (
          <p data-testid="facility-no-results" className="text-xs text-gray-400 text-center py-4">該当する施設がありません</p>
        ) : (
          filteredFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              selected={selectedFacilityId === facility.id}
              onClick={onFacilityClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
