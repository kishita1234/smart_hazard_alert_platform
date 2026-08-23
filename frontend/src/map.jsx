import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

if (L.Icon.Default.prototype._getIconUrl) {
  delete L.Icon.Default.prototype._getIconUrl
}
L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const SEVERITY_COLORS = {
  1: '#5d9270',
  2: '#c5a84b',
  3: '#d4a056',
  4: '#d98585',
  5: '#b85c5c',
}

const getCoords = (inc) => {
  const lat = parseFloat(inc?.latitude ?? inc?.lat)
  const lng = parseFloat(inc?.longitude ?? inc?.lng)
  return Number.isNaN(lat) || Number.isNaN(lng) ? null : { lat, lng }
}

const groupIncidentsByLocation = (incidents) => {
  const groups = new Map()

  for (const inc of incidents) {
    const coords = getCoords(inc)
    if (!coords) continue

    const key = `${coords.lat.toFixed(5)},${coords.lng.toFixed(5)}`
    if (!groups.has(key)) {
      groups.set(key, { ...coords, incidents: [] })
    }
    groups.get(key).incidents.push(inc)
  }

  return [...groups.values()]
}

const getSeverityColor = (severity) => {
  const level = Math.min(5, Math.max(1, Number(severity) || 1))
  return SEVERITY_COLORS[level]
}

const createSeverityIcon = (severity, count = 1) => {
  const color = getSeverityColor(severity)
  const badge = count > 1
    ? `<span style="
        position:absolute;top:-6px;right:-8px;min-width:18px;height:18px;
        padding:0 5px;border-radius:999px;background:#1d546d;color:#fff;
        font-size:11px;font-weight:700;line-height:18px;text-align:center;
        border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.35);
      ">${count}</span>`
    : ''

  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:28px;height:36px;">
        <div style="
          width:28px;height:28px;border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);background:${color};
          border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35);
        "></div>
        ${badge}
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -32],
  })
}

function boundsFromRadius(lat, lng, radiusM) {
  const latDelta = radiusM / 111320
  const lngDelta = radiusM / (111320 * Math.cos((lat * Math.PI) / 180))
  return L.latLngBounds(
    [lat - latDelta, lng - lngDelta],
    [lat + latDelta, lng + lngDelta]
  )
}

const RADIUS_FALLBACK = 5000

function MapController({ location, activeTab, radius, markerGroups, isSearchActive, searchRadius }) {
  const map = useMap()

  useEffect(() => {
    if (!location) {
      if (activeTab === 'live' && markerGroups.length > 0 && !isSearchActive) {
        const bounds = L.latLngBounds(markerGroups.map((g) => [g.lat, g.lng]))
        map.flyToBounds(bounds.pad(0.2), { duration: 1.2 })
      }
      return
    }

    if (isSearchActive) {
      const r = searchRadius || radius || RADIUS_FALLBACK
      map.flyToBounds(boundsFromRadius(location.lat, location.lng, r), {
        duration: 1.2,
        padding: [30, 30],
      })
      return
    }

    if (activeTab === 'live') {
      map.flyTo([location.lat, location.lng], 15, { duration: 1.2 })
      return
    }

    if (radius) {
      map.flyToBounds(boundsFromRadius(location.lat, location.lng, radius), {
        duration: 1.2,
        padding: [30, 30],
      })
    }
  }, [location, activeTab, radius, markerGroups, map, isSearchActive, searchRadius])

  return null
}

function HazardMap({
  incidents,
  center,
  activeTab = 'live',
  radius = null,
  searchedLocation = null,
  onSearchLocation,
  searchRadius = RADIUS_FALLBACK,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

  const safeIncidents = Array.isArray(incidents) ? incidents : []

  const markerGroups = useMemo(() => {
    return safeIncidents.length > 0 ? groupIncidentsByLocation(safeIncidents) : []
  }, [incidents])

  const flyTarget = searchedLocation
    ? { lat: searchedLocation.lat, lng: searchedLocation.lng }
    : center
      ? { lat: center.lat, lng: center.lng }
      : null

  const clearSearch = () => {
    setSearchQuery('')
    onSearchLocation?.(null)
  }

  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      clearSearch()
      return
    }
    try {
      setSearching(true)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await res.json()
      if (data.length === 0) { alert('Location not found'); return }
      const loc = data[0]
      onSearchLocation?.({
        lat: parseFloat(loc.lat),
        lng: parseFloat(loc.lon),
        name: loc.display_name,
      })
    } catch (err) {
      console.error('Location search failed:', err)
      alert('Unable to search for this location')
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e) => { if (e.key === 'Enter') searchLocation() }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>

      <div style={{
        position: 'absolute', top: '15px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 1000, display: 'flex', gap: '8px', background: 'white', padding: '8px',
        borderRadius: '10px', boxShadow: '0 3px 12px rgba(0,0,0,0.25)', width: 'min(500px, 80%)',
      }}>
        <input
          type="text"
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 12px', fontSize: '15px', borderRadius: '7px' }}
        />
        <button
          onClick={searchLocation}
          disabled={searching}
          style={{
            border: 'none', borderRadius: '7px', padding: '0 16px',
            cursor: searching ? 'default' : 'pointer', background: '#1D546D', color: 'white', fontWeight: 600,
          }}
        >
          {searching ? 'Searching...' : 'Search'}
        </button>
        {searchedLocation ? (
          <button
            onClick={clearSearch}
            title="Clear search"
            style={{
              border: 'none', borderRadius: '7px', padding: '0 12px',
              cursor: 'pointer', background: '#eee', color: '#333', fontWeight: 600,
            }}
          >
            ✕
          </button>
        ) : null}
      </div>

      <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController
          location={flyTarget}
          activeTab={activeTab}
          radius={radius}
          markerGroups={markerGroups}
          isSearchActive={searchedLocation !== null}
          searchRadius={searchRadius}
        />

        {searchedLocation?.lat != null && searchedLocation?.lng != null ? (
          <Marker position={[searchedLocation.lat, searchedLocation.lng]}>
            <Popup><strong>{searchedLocation.name}</strong></Popup>
          </Marker>
        ) : null}

        {markerGroups.length > 0
          ? markerGroups.map((group) => {
              const list = Array.isArray(group?.incidents) ? group.incidents : []
              const maxSeverity = list.length > 0
                ? Math.max(...list.map((inc) => Number(inc?.severity) || 1))
                : 1
              const groupKey = list.length > 0
                ? list.map((inc) => inc?.id || inc?.incident_id).join('-')
                : `${group.lat}-${group.lng}`

              return list.length > 0 ? (
                <Marker
                  key={groupKey}
                  position={[group.lat, group.lng]}
                  icon={createSeverityIcon(maxSeverity, list.length)}
                >
                  <Popup>
                    {list.length > 1 ? (
                      <>
                        <strong>{list.length} hazards at this location</strong>
                        <hr style={{ margin: '8px 0' }} />
                        {list.map((inc) => (
                          <div key={inc?.id || inc?.incident_id} style={{ marginBottom: '8px' }}>
                            <strong>{inc?.hazard_type || 'Hazard'}</strong><br />
                            Severity: {inc?.severity}<br />
                            Status: {inc?.status}<br />
                            ID: {inc?.id || inc?.incident_id}
                          </div>
                        ))}
                      </>
                    ) : (
                      <>
                        <strong>{list[0]?.hazard_type || 'Hazard'}</strong><br />
                        Severity: {list[0]?.severity}<br />
                        Status: {list[0]?.status}
                      </>
                    )}
                  </Popup>
                </Marker>
              ) : null
            })
          : null}
      </MapContainer>
    </div>
  )
}

export default HazardMap
