const EARTH_RADIUS_KM = 6371

function radians(degrees) {
  return (degrees * Math.PI) / 180
}

export function haversineKm(latitude1, longitude1, latitude2, longitude2) {
  const latitudeDelta = radians(latitude2 - latitude1)
  const longitudeDelta = radians(longitude2 - longitude1)
  const a =
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(latitude1))
      * Math.cos(radians(latitude2))
      * Math.sin(longitudeDelta / 2) ** 2

  return EARTH_RADIUS_KM * 2 * Math.asin(Math.sqrt(Math.min(1, a)))
}
