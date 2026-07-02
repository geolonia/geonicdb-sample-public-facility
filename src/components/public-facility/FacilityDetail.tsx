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
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:top-4 md:bottom-auto md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-10 max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-4 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
              {facility.facilityType}
            </span>
          </div>
          <h3 className="text-sm font-bold text-gray-800">{facility.name}</h3>
          {facility.nameKana && (
            <p className="text-[10px] text-gray-400 mt-0.5">{facility.nameKana}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Info */}
      <div className="px-4 pb-3 space-y-2">
        {facility.postalCode && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>〒{formatPostalCode(facility.postalCode)}</span>
          </div>
        )}
        {facility.address && (
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
            <span>{facility.address}</span>
          </div>
        )}
        {facility.municipality && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{facility.municipality}</span>
          </div>
        )}
        {facility.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{facility.phone}</span>
          </div>
        )}
        {hours && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{hours}</span>
          </div>
        )}
        {facility.openDays && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{facility.openDays}</span>
          </div>
        )}
        {facility.openTimeNote && (
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
            <span className="italic">{facility.openTimeNote}</span>
          </div>
        )}
      </div>

      {/* Accessibility */}
      {accessibilityEntries.length > 0 && (
        <div className="px-4 pb-3 pt-2 border-t border-gray-100">
          <h4 className="text-[10px] font-medium text-gray-400 mb-2">バリアフリー対応</h4>
          <div className="flex flex-wrap gap-1.5">
            {accessibilityEntries.map(({ key, label, icon: Icon }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]"
              >
                <Icon className="w-3 h-3" />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {facility.description && (
        <div className="px-4 pb-3 pt-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">{facility.description}</p>
        </div>
      )}

      {/* Website link */}
      {facility.websiteUrl && (
        <div className="px-4 pb-3 pt-2 border-t border-gray-100">
          <a
            href={facility.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Webサイト
          </a>
        </div>
      )}

      {/* Extra attributes (not mapped into PublicFacility type) */}
      {extraAttributes.length > 0 && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <h4 className="text-[10px] font-medium text-gray-400 mb-2 flex items-center gap-1">
            <Database className="w-3 h-3" />
            その他の属性
          </h4>
          <dl className="space-y-1.5">
            {extraAttributes.map(({ key, type, value }) => (
              <div key={key} className="flex items-baseline gap-2">
                <dt className="text-[10px] font-mono text-gray-500 shrink-0">{key}</dt>
                <dd className="text-[10px] text-gray-700 break-all">
                  {formatAttrValue(value)}
                  <span className="ml-1 text-gray-300">({type})</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
