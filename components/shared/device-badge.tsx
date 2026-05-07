import { DeviceMobile, Monitor, DeviceTablet } from "@phosphor-icons/react"
import type { DeviceInfo } from "@/types/session"

const iconMap = {
  phone: DeviceMobile,
  tablet: DeviceTablet,
  desktop: Monitor,
}

interface DeviceBadgeProps {
  device: DeviceInfo
  label: string
}

export function DeviceBadge({ device, label }: DeviceBadgeProps) {
  const Icon = iconMap[device.deviceType]
  const location = [device.location.city, device.location.country]
    .filter(Boolean)
    .join(", ")

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 w-full"
      style={{
        background: "var(--accent-primary-dim)",
        border: "2px solid var(--accent-primary)",
        borderRadius: "10px 11px 10px 10px",
      }}
    >
      <Icon size={20} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />
      <div className="flex flex-col min-w-0">
        <span className="text-xs" style={{ color: "var(--accent-primary)" }}>
          {label}
        </span>
        <span
          className="text-sm font-semibold truncate"
          style={{ color: "var(--text-primary)" }}
        >
          {device.deviceName}
        </span>
        {location && (
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {location}
          </span>
        )}
      </div>
    </div>
  )
}
