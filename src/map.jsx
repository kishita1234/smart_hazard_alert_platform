import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

function Map() {
  return (
    <MapContainer
      center={[28.6139, 77.2090]}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[28.6139, 77.2090]}>
        <Popup>
          <strong>Critical Hazard</strong>
          <br />
          Road collapse reported here.
        </Popup>
      </Marker>
    </MapContainer>
  )
}

export default Map