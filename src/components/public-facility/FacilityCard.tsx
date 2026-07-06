import {
  MapPin,
  Phone,
  Clock,
  Accessibility,
  Baby,
  Dog,
  ExternalLink,
} from 'lucide-react';
import type { PublicFacility } from '../../types/public-facility';
import {
  FACILITY_CATEGORY_COLORS,
  formatOperatingHours,
  hasAnyAccessibility,
} from '../../types/public-facility';
import { SpriteIcon } from './SpriteIcon';

interface FacilityCardProps {
  facility: PublicFacility;
  selected?: boolean;
  onClick?: (facility: PublicFacility) => void;
}

export function FacilityCard({ facility, selected, onClick }: FacilityCardProps) {
  const colors = FACILITY_CATEGORY_COLORS[facility.facilityType] ?? FACILITY_CATEGORY_COLORS['その他'];
  const hours = formatOperatingHours(facility);
  const hasAccessibility = hasAnyAccessibility(facility.accessibility);

  return (
    <div
      id={`facility-${facility.id}`}
      role="button"
      tabIndex={0}
      className={`bg-white rounded-lg border-2 p-3 transition-colors cursor-pointer ${
        selected
          ? 'border-brand-400 ring-2 ring-brand-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={() => onClick?.(facility)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(facility);
        }
      }}
    >
      {/* Header: name + type badge with icon */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-gray-800 leading-tight">{facility.name}</h4>
        <span className={`shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
          <SpriteIcon spriteIcon={colors.spriteIcon} size={16} />
          {facility.facilityType}
        </span>
      </div>

      {/* Address */}
      {facility.address && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{facility.address}</span>
        </div>
      )}

      {/* Phone */}
      {facility.phone && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <Phone className="w-3 h-3 shrink-0" />
          <span>{facility.phone}</span>
        </div>
      )}

      {/* Operating hours */}
      {hours && (
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
          <Clock className="w-3 h-3 shrink-0" />
          <span>{hours}</span>
          {facility.openDays && (
            <span className="text-gray-300 ml-1">({facility.openDays})</span>
          )}
        </div>
      )}

      {/* Accessibility icons + website link */}
      {(hasAccessibility || facility.websiteUrl) && (
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          {facility.accessibility.wheelchair && (
            <span title="車椅子可"><Accessibility className="w-3.5 h-3.5 text-blue-400" /></span>
          )}
          {facility.accessibility.accessibleToilet && (
            <span className="text-blue-400 text-[10px] font-medium" title="バリアフリートイレ">BF</span>
          )}
          {facility.accessibility.guideDog && (
            <span title="盲導犬同伴可"><Dog className="w-3.5 h-3.5 text-blue-400" /></span>
          )}
          {facility.accessibility.nursingRoom && (
            <span title="授乳室"><Baby className="w-3.5 h-3.5 text-pink-400" /></span>
          )}
          {facility.accessibility.diaperChanging && (
            <span title="おむつ替え"><Baby className="w-3.5 h-3.5 text-amber-400" /></span>
          )}
          {facility.websiteUrl && (
            <a
              href={facility.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-gray-300 hover:text-brand-500 transition-colors"
              onClick={(e) => e.stopPropagation()}
              title="Webサイト"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
