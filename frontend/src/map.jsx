import { useEffect, useState } from 'react'

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'
import axiosClient from './axios.js'


// ==============================
// MAP CONTROLLER
// ==============================

function MapController({ location }) {
  const map = useMap()

  useEffect(() => {
    if (location) {
      map.flyTo(
        [location.lat, location.lon],
        15,
        {
          duration: 1.5
        }
      )
    }
  }, [location, map])

  return null
}


// ==============================
// MAIN MAP
// ==============================

function Map() {

  const [incidents, setIncidents] = useState([])

  const [searchQuery, setSearchQuery] = useState('')

  const [searchedLocation, setSearchedLocation] = useState(null)

  const [searching, setSearching] = useState(false)


  // ==============================
  // FETCH INCIDENTS
  // ==============================

  const fetchIncidents = async () => {

    try {

      const res = await axiosClient.get('/incidents')

      console.log("res", res)

      if (res.status === 200) {

        setIncidents(res?.data?.incidents || [])

      } else {

        console.log("err in fetchIncidents")

      }

    } catch (err) {

      console.log("err in fetchIncidents-->", err)

    }

  }


  useEffect(() => {

    fetchIncidents()

  }, [])


  // ==============================
  // SEARCH LOCATION
  // ==============================

  const searchLocation = async () => {

    if (!searchQuery.trim()) {
      return
    }

    try {

      setSearching(true)

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )

      const data = await response.json()

      if (data.length === 0) {

        alert("Location not found")

        return

      }

      const location = data[0]

      setSearchedLocation({
        lat: parseFloat(location.lat),
        lon: parseFloat(location.lon),
        name: location.display_name
      })

    } catch (error) {

      console.error("Location search failed:", error)

      alert("Unable to search for this location")

    } finally {

      setSearching(false)

    }

  }


  // ==============================
  // ENTER KEY
  // ==============================

  const handleKeyDown = (event) => {

    if (event.key === 'Enter') {
      searchLocation()
    }

  }


  return (

    <div
      style={{
        position: 'relative',
        height: '100%',
        width: '100%'
      }}
    >

      {/* =========================
          SEARCH BAR
          ========================= */}

      <div
        style={{
          position: 'absolute',
          top: '15px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,

          display: 'flex',
          gap: '8px',

          background: 'white',
          padding: '8px',
          borderRadius: '10px',

          boxShadow: '0 3px 12px rgba(0,0,0,0.25)',

          width: 'min(500px, 80%)'
        }}
      >

        <input

          type="text"

          placeholder="Search for a location..."

          value={searchQuery}

          onChange={(event) =>
            setSearchQuery(event.target.value)
          }

          onKeyDown={handleKeyDown}

          style={{
            flex: 1,

            border: 'none',
            outline: 'none',

            padding: '10px 12px',

            fontSize: '15px',

            borderRadius: '7px'
          }}

        />


        <button

          onClick={searchLocation}

          disabled={searching}

          style={{
            border: 'none',

            borderRadius: '7px',

            padding: '0 16px',

            cursor: searching
              ? 'default'
              : 'pointer',

            background: '#1D546D',

            color: 'white',

            fontWeight: '600'
          }}

        >

          {searching ? 'Searching...' : 'Search'}

        </button>

      </div>


      {/* =========================
          MAP
          ========================= */}

      <MapContainer

        center={[28.6139, 77.2090]}

        zoom={13}

        style={{
          height: '100%',
          width: '100%'
        }}

      >

        <TileLayer

          attribution='&copy; OpenStreetMap contributors'

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

        />


        {/* =========================
            MOVE MAP AFTER SEARCH
            ========================= */}

        <MapController
          location={searchedLocation}
        />


        {/* =========================
            SEARCH RESULT MARKER
            ========================= */}

        {searchedLocation && (

          <Marker
            position={[
              searchedLocation.lat,
              searchedLocation.lon
            ]}
          >

            <Popup>

              <strong>
                {searchedLocation.name}
              </strong>

            </Popup>

          </Marker>

        )}


        {/* =========================
            BACKEND INCIDENT MARKERS
            ========================= */}

        {incidents?.length > 0 &&
          incidents.map((incident, index) => (

            <Marker

              key={incident?.id || index}

              position={[
                incident?.latitude,
                incident?.longitude
              ]}

            >

              <Popup>

                <strong>
                  {incident?.hazard_type || 'Hazard'}
                </strong>

                <br />

                Severity: {incident?.severity}

                <br />

                Status: {incident?.status}

              </Popup>

            </Marker>

          ))
        }

      </MapContainer>

    </div>

  )

}


export default Map