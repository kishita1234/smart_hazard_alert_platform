import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Marker.prototype.options.icon = L.icon({ iconUrl, shadowUrl })

// map ko naye center pe le jao (search ya user location)
function MapController({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.flyTo([location.lat, location.lon], 15, { duration: 1.2 })
  }, [location, map])
  return null
}

function Map({ incidents = [], center }) {

  const [searchQuery, setSearchQuery] = useState('')
  const [searchedLocation, setSearchedLocation] = useState(null)
  const [searching, setSearching] = useState(false)

  // priority: search > user location
  const flyTarget = searchedLocation || (center ? { lat: center.lat, lon: center.lng } : null)

  const searchLocation = async () => {
    if (!searchQuery.trim()) return
    try {
      setSearching(true)
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await res.json()
      if (data.length === 0) { alert('Location not found'); return }
      const loc = data[0]
      setSearchedLocation({
        lat: parseFloat(loc.lat),
        lon: parseFloat(loc.lon),
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

      {/* SEARCH BAR */}
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
      </div>

      {/* MAP */}
      <MapContainer center={[28.6139, 77.2090]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController location={flyTarget} />

        {/* SEARCH RESULT MARKER */}
        {searchedLocation && (
          <Marker position={[searchedLocation.lat, searchedLocation.lon]}>
            <Popup><strong>{searchedLocation.name}</strong></Popup>
          </Marker>
        )}

        {/* INCIDENT MARKERS (prop se) */}
        {incidents.map((inc, i) => {
          const lat = inc?.latitude ?? inc?.lat
          const lng = inc?.longitude ?? inc?.lng
          if (lat == null || lng == null) return null
          return (
            <Marker key={inc?.id || inc?.incident_id || i} position={[lat, lng]}>
              <Popup>
                <strong>{inc?.hazard_type || 'Hazard'}</strong><br />
                Severity: {inc?.severity}<br />
                Status: {inc?.status}
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}

export default Map