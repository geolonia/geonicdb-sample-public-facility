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
      className={`facility-card${selected ? ' selected' : ''}`}
      onClick={() => onClick?.(facility)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(facility);
        }
      }}
    >
      {/* Header: name + type badge with icon */}
      <div className="facility-card-header">
        <h4 className="facility-card-title">{facility.name}</h4>
        <span
          className="facility-badge"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          <SpriteIcon spriteIcon={colors.spriteIcon} size={16} />
          {facility.facilityType}
        </span>
      </div>

      {/* Address */}
      {facility.address && (
        <div className="facility-card-row">
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} aria-hidden="true" />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {facility.address}
          </span>
        </div>
      )}

      {/* Phone */}
      {facility.phone && (
        <div className="facility-card-row">
          <Phone style={{ width: 12, height: 12, flexShrink: 0 }} aria-hidden="true" />
          <span>{facility.phone}</span>
        </div>
      )}

      {/* Operating hours */}
      {hours && (
        <div className="facility-card-row">
          <Clock style={{ width: 12, height: 12, flexShrink: 0 }} aria-hidden="true" />
          <span>{hours}</span>
          {facility.openDays && (
            <span style={{ marginLeft: 4, opacity: 0.7 }}>({facility.openDays})</span>
          )}
        </div>
      )}

      {/* Accessibility icons + website link */}
      {(hasAccessibility || facility.websiteUrl) && (
        <div className="facility-card-footer">
          {facility.accessibility.wheelchair && (
            <span role="img" aria-label="車椅子可">
              <Accessibility style={{ width: 14, height: 14, color: 'var(--color-accessibility-blue)' }} aria-hidden="true" />
            </span>
          )}
          {facility.accessibility.accessibleToilet && (
            <span role="img" style={{ color: 'var(--color-accessibility-blue)', fontSize: 10, fontWeight: 500 }} aria-label="バリアフリートイレ">BF</span>
          )}
          {facility.accessibility.guideDog && (
            <span role="img" aria-label="盲導犬同伴可">
              <Dog style={{ width: 14, height: 14, color: 'var(--color-accessibility-blue)' }} aria-hidden="true" />
            </span>
          )}
          {facility.accessibility.nursingRoom && (
            <span role="img" aria-label="授乳室">
              <Baby style={{ width: 14, height: 14, color: 'var(--color-accessibility-pink)' }} aria-hidden="true" />
            </span>
          )}
          {facility.accessibility.diaperChanging && (
            <span role="img" aria-label="おむつ替え">
              <Baby style={{ width: 14, height: 14, color: 'var(--color-accessibility-amber)' }} aria-hidden="true" />
            </span>
          )}
          {facility.websiteUrl && (
            <a
              href={facility.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="facility-card-link"
              onClick={(e) => e.stopPropagation()}
              title="Webサイト"
            >
              <ExternalLink style={{ width: 14, height: 14 }} aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
