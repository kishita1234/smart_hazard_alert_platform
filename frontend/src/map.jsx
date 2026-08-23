import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'
import axiosClient from './config/axios'


function Map() {

  const [incidents, setIncidents] = useState([])

  const fetchIncidents = async () => {
    try {
      const res = await axiosClient.get('/incidents')
      console.log("res", res)
      if (res.status == 200) {
        setIncidents(res?.data?.incidents || [])
      } else {
        console.log("err in fetchIncidents")
      }
    } catch (err) {
      console.log("err in fetchIncidents-->", err)
    }
  }
  useEffect(() => {
    fetchIncidents();
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

      {incidents?.length > 0 && incidents?.map((incident, index) => (
        <Marker
          key={incident?.id || index}
          position={[incident?.latitude, incident?.longitude]}
        >
          <Popup>
            <strong>{incident?.hazard_type || 'Hazard'}</strong>
            <br />
            Severity: {incident?.severity} <br />
            Status: {incident?.status}
          </Popup>
        </Marker>
      ))}


    </MapContainer>

  )

}


export default Map