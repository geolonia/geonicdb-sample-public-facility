import {
  MapPin,
  Phone,
  Clock,
  Calendar,
  Accessibility,
  Baby,
  Dog,
  ExternalLink,
  X,
  Car,
  Braces,
  Mail,
  Building2,
  Database,
} from 'lucide-react';
import type { PublicFacility } from '../../types/public-facility';
import {
  FACILITY_CATEGORY_COLORS,
  formatOperatingHours,
  getExtraAttributes,
} from '../../types/public-facility';

interface FacilityDetailProps {
  facility: PublicFacility;
  onClose: () => void;
}

const ACCESSIBILITY_ITEMS = [
  { key: 'wheelchair' as const, label: '車椅子可', icon: Accessibility },
  { key: 'wheelchairRental' as const, label: '車椅子貸出', icon: Accessibility },
  { key: 'accessibleToilet' as const, label: 'バリアフリートイレ', icon: Braces },
  { key: 'slopeElevator' as const, label: 'スロープ/エレベーター', icon: Accessibility },
  { key: 'braille' as const, label: '点字・読上支援', icon: Braces },
  { key: 'guideDog' as const, label: '盲導犬同伴可', icon: Dog },
  { key: 'nursingRoom' as const, label: '授乳室', icon: Baby },
  { key: 'diaperChanging' as const, label: 'おむつ替え', icon: Baby },
  { key: 'priorityParking' as const, label: '優先駐車場', icon: Car },
  { key: 'ostomyToilet' as const, label: 'オストメイト対応', icon: Braces },
] as const;

/** Format a postal code with hyphen: "1738501" → "173-8501" */
function formatPostalCode(code: string): string {
  if (code.length === 7 && /^\d+$/.test(code)) {
    return `${code.slice(0, 3)}-${code.slice(3)}`;
  }
  return code;
}

/** Render an attribute value as a displayable string */
function formatAttrValue(value: unknown): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'はい' : 'いいえ';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function FacilityDetail({ facility, onClose }: FacilityDetailProps) {
  const colors = FACILITY_CATEGORY_COLORS[facility.facilityType] ?? FACILITY_CATEGORY_COLORS['その他'];
  const hours = formatOperatingHours(facility);
  const accessibilityEntries = ACCESSIBILITY_ITEMS.filter(
    (item) => facility.accessibility[item.key],
  );
  const extraAttributes = getExtraAttributes(facility);

  return (
    <div className="facility-detail-panel">
      {/* Header */}
      <div className="facility-detail-header">
        <div className="facility-detail-name-block">
          <div className="facility-detail-type-row">
            <span
              className="facility-badge"
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {facility.facilityType}
            </span>
          </div>
          <p className="facility-detail-name">{facility.name}</p>
          {facility.nameKana && (
            <p className="facility-detail-kana">{facility.nameKana}</p>
          )}
        </div>
        <button onClick={onClose} className="facility-detail-close-btn">
          <X style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* Info */}
      <div className="facility-detail-info">
        {facility.postalCode && (
          <div className="facility-detail-row">
            <Mail className="facility-detail-row-icon" />
            <span>〒{formatPostalCode(facility.postalCode)}</span>
          </div>
        )}
        {facility.address && (
          <div className="facility-detail-row">
            <MapPin className="facility-detail-row-icon" />
            <span>{facility.address}</span>
          </div>
        )}
        {facility.municipality && (
          <div className="facility-detail-row">
            <Building2 className="facility-detail-row-icon" />
            <span>{facility.municipality}</span>
          </div>
        )}
        {facility.phone && (
          <div className="facility-detail-row">
            <Phone className="facility-detail-row-icon" />
            <span>{facility.phone}</span>
          </div>
        )}
        {hours && (
          <div className="facility-detail-row">
            <Clock className="facility-detail-row-icon" />
            <span>{hours}</span>
          </div>
        )}
        {facility.openDays && (
          <div className="facility-detail-row">
            <Calendar className="facility-detail-row-icon" />
            <span>{facility.openDays}</span>
          </div>
        )}
        {facility.openTimeNote && (
          <div className="facility-detail-row" style={{ color: 'var(--color-text-dim)' }}>
            <Clock className="facility-detail-row-icon" style={{ opacity: 0.5 }} />
            <span style={{ fontStyle: 'italic' }}>{facility.openTimeNote}</span>
          </div>
        )}
      </div>

      {/* Accessibility */}
      {accessibilityEntries.length > 0 && (
        <div className="facility-detail-section">
          <p className="facility-detail-section-title">バリアフリー対応</p>
          <div className="facility-detail-badges">
            {accessibilityEntries.map(({ key, label, icon: Icon }) => (
              <span key={key} className="accessibility-badge">
                <Icon style={{ width: 12, height: 12 }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {facility.description && (
        <div className="facility-detail-section">
          <p className="facility-detail-description">{facility.description}</p>
        </div>
      )}

      {/* Website link */}
      {facility.websiteUrl && (
        <div className="facility-detail-section">
          <a
            href={facility.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="facility-detail-link"
          >
            <ExternalLink style={{ width: 12, height: 12 }} />
            Webサイト
          </a>
        </div>
      )}

      {/* Extra attributes (not mapped into PublicFacility type) */}
      {extraAttributes.length > 0 && (
        <div className="facility-detail-section">
          <p className="facility-detail-section-title">
            <Database style={{ width: 12, height: 12 }} />
            その他の属性
          </p>
          <dl className="facility-extra-attrs">
            {extraAttributes.map(({ key, type, value }) => (
              <div key={key} className="facility-extra-attr-row">
                <dt className="facility-extra-attr-key">{key}</dt>
                <dd className="facility-extra-attr-val">
                  {formatAttrValue(value)}
                  <span className="facility-extra-attr-type">({type})</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
