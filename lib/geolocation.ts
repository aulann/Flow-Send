import geoip from "geoip-lite"

interface GeoLocation {
  city: string
  country: string
}

export function lookupLocation(ip: string): GeoLocation {
  const clean = ip.replace(/^::ffff:/, "")
  const result = geoip.lookup(clean)
  if (!result) return { city: "", country: "" }
  return {
    city: result.city ?? "",
    country: result.country ?? "",
  }
}
