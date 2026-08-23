import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'


function Map() {

  const [incidents, setIncidents] = useState([])


  /* =========================
     GET INCIDENTS FROM BACKEND
     ========================= */

  useEffect(() => {

    fetch('http://192.168.1.2:8000/incidents')

      .then((res) => {

        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`)
        }

        return res.json()

      })

      .then((data) => {

        console.log('FETCHING BACKEND:', data)

        setIncidents(data.incidents || [])

      })

      .catch((err) => {

        console.error('FAILED TO FETCH:', err)

      })

  }, [])


  return (

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
          BACKEND INCIDENT MARKERS
         ========================= */}

      {incidents.map((incident, index) => (
        <Marker
          key={incident.id || index}
          position={[incident.lat, incident.lng]}
        >
          <Popup>
            <strong>{incident.hazard_type || 'Hazard'}</strong>
            <br />
            Severity: {incident.severity} <br />
            Status: {incident.status}
          </Popup>
        </Marker>
      ))}


    </MapContainer>

  )

}


export default Map