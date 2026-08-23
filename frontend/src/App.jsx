import { useState, useEffect } from 'react'
import './App.css'
import Map from './map'
import ProfileDropdown from './components/ProfileDropdown'
import AdminLogin from './components/AdminLogin'
import LocationPicker from './components/LocationPicker'
import axiosClient from './axios'

const RADIUS = { local: 500, area: 2000, zone: 5000 }
const severityMap = { Critical: 5, Caution: 3, Low: 1 }

function App() {

  if (window.location.pathname === '/admin') {
    return <AdminLogin />
  }

  /* ========== STATE ========== */
  const [incidents, setIncidents] = useState([])
  const [userLoc, setUserLoc] = useState(null)
  const [activeTab, setActiveTab] = useState('live')
  const [nearbyAlert, setNearbyAlert] = useState(null)

  const [reportOpen, setReportOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusSearch, setStatusSearch] = useState('')
  const [statusResult, setStatusResult] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)

  /* ========== USER LOCATION (mount) ========== */
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log('geo err-->', err)
    )
  }, [])

  /* ========== FETCH INCIDENTS (tab-wise) ========== */
  const loadIncidents = async (tab, loc) => {
    try {
      if (tab === 'live') {
        const res = await axiosClient.get('/incidents')
        setIncidents(res?.data?.incidents || [])
      } else {
        if (!loc) return
        const res = await axiosClient.get('/incidents/nearby', {
          params: { lat: loc.lat, lng: loc.lng, radius: RADIUS[tab] },
        })
        setIncidents(res?.data?.incidents || res?.data || [])
      }
    } catch (err) {
      console.log('err in loadIncidents-->', err)
    }
  }

  useEffect(() => {
    loadIncidents(activeTab, userLoc)
  }, [activeTab, userLoc])

  /* ========== NEARBY VERIFIED ALERT (poll 30s) ========== */
  useEffect(() => {
    if (!userLoc) return

    const check = async () => {
      try {
        const res = await axiosClient.get('/incidents/nearby', {
          params: { lat: userLoc.lat, lng: userLoc.lng, radius: RADIUS.area },
        })
        const list = res?.data?.incidents || res?.data || []
        const verified = list.find(
          (inc) => inc.verified === true || inc.status === 'VERIFIED'
        )
        setNearbyAlert(verified || null)
      } catch (err) {
        console.log('nearby check failed:', err)
      }
    }

    check()
    const id = setInterval(check, 30000)
    return () => clearInterval(id)
  }, [userLoc])

  /* ========== REPORT MODAL ========== */
  const openReport = () => setReportOpen(true)
  const closeReport = () => {
    setReportOpen(false)
    setSelectedLocation(null)
  }

  /* ========== SUBMIT ========== */
  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const issueType = formData.get('issueType')
    const hazardLevel = formData.get('hazardLevel')
    const description = formData.get('description')
    const photoFile = formData.get('photo')

    if (!selectedLocation) {
      alert('Please select or detect a location before submitting.')
      return
    }

    try {
      let imageUrl = null
      if (photoFile && photoFile.size > 0) {
        const uploadData = new FormData()
        uploadData.append('file', photoFile)
        const up = await axiosClient.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        imageUrl = up.data.image_url
      }

      const payload = {
        hazard_type: issueType,
        severity: severityMap[hazardLevel] || 1,
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        image_url: imageUrl,
        description,
      }

      const res = await axiosClient.post('/reports', payload)

      alert(`Report submitted successfully!\n\nYour Report ID is:\n${res.data.report_id}\n\nPlease save this ID to check your report status.`)

      setReportOpen(false)
      setSelectedLocation(null)
      e.target.reset()

      await loadIncidents(activeTab, userLoc)
    } catch (err) {
      console.error('Report submit failed:', err)
      alert('Something went wrong while submitting the report. Please try again.')
    }
  }

  /* ========== STATUS ========== */
  const openStatus = () => {
    setStatusOpen(true)
    setStatusSearch('')
    setStatusResult(null)
  }
  const closeStatus = () => setStatusOpen(false)

  const checkStatus = async (e) => {
    e.preventDefault()
    try {
      const res = await axiosClient.get(`/reports/${statusSearch.trim()}`)
      setStatusResult(res.data.report)
    } catch (err) {
      console.log('Status check failed:', err)
      setStatusResult('not-found')
    }
  }

  const handleLogout = () => alert('You have been logged out.')

  /* ========== UI ========== */
  return (
    <div className="app">

      <header className="header">
        <div className="logo">दृष्टि Smart Waterlogging Alert Portal</div>
        <nav>
          <a href="#">HOME</a>
          <button className="nav-button" onClick={openReport}>REPORT AN ISSUE</button>
          <button className="nav-button" onClick={openStatus}>CHECK STATUS</button>
          <a href="#alerts">CHECK ALERTS</a>
          <ProfileDropdown reports={incidents} onLogout={handleLogout} />
        </nav>
      </header>

      {/* NEARBY VERIFIED ALERT */}
      {nearbyAlert && (
        <div className="nearby-alert" style={{
          margin: '10px 16px', padding: '14px 18px', background: '#382629',
          border: '1px solid #b85c5c', borderLeft: '5px solid #b85c5c',
          borderRadius: '6px', color: '#f3f4f4',
        }}>
          <strong>🚨 VERIFIED HAZARD NEARBY</strong>
          <p style={{ margin: '6px 0 0' }}>
            {nearbyAlert.hazard_type || nearbyAlert.issueType || 'Hazard reported nearby'}
          </p>
          {nearbyAlert.severity && <small>Severity: {nearbyAlert.severity}</small>}
        </div>
      )}

      <main>

        {/* TABS */}
        <div className="tabs">
          <button className={activeTab === 'local' ? 'active' : ''} onClick={() => setActiveTab('local')}>
            📍 LOCAL LOCATION HAZARD ALERT
          </button>
          <button className={activeTab === 'area' ? 'active' : ''} onClick={() => setActiveTab('area')}>
            🚩 LOCAL AREA HAZARD ALERT
          </button>
          <button className={activeTab === 'zone' ? 'active' : ''} onClick={() => setActiveTab('zone')}>
            ⚠️ ZONE-WISE HAZARD ALERT
          </button>
          <button className={activeTab === 'live' ? 'active' : ''} onClick={() => setActiveTab('live')}>
            📡 LIVE OVERVIEW
          </button>
        </div>

        <div className="content">

          <section className="map-section">
            <div className="map-placeholder">
              <Map incidents={incidents} center={userLoc} />
            </div>
          </section>

          <aside className="alerts" id="alerts">
            <h2>ALERT LIST</h2>
            <div className="alerts-list">
              {incidents.length === 0 ? (
                <p className="no-reports">No hazard reports yet.</p>
              ) : (
                incidents.map((inc, i) => (
                  <div key={inc?.id || inc?.incident_id || i} className={`alert sev-${inc?.severity}`}>
                    <strong>Severity {inc?.severity}</strong>
                    <p>{inc?.hazard_type}</p>
                    <small>ID: {inc?.id || inc?.incident_id}</small>
                    <br />
                    <small>Status: {inc?.status}</small>
                  </div>
                ))
              )}
            </div>
          </aside>

        </div>

        <button className="report-button" onClick={openReport}>+ REPORT A HAZARD</button>
      </main>

      {/* REPORT MODAL */}
      {reportOpen && (
        <div className="modal-overlay" onClick={closeReport}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>REPORT A HAZARD</h2>
              <button className="modal-close" onClick={closeReport}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Issue Type</label>
                <select name="issueType" required>
                  <option value="">Select an issue</option>
                  <option value="Waterlogging">Waterlogging</option>
                  <option value="Road Collapse">Road Collapse</option>
                  <option value="Blocked Drain">Blocked Drain</option>
                  <option value="Debris / Obstruction">Debris / Obstruction</option>
                  <option value="Flooding">Flooding</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hazard Level</label>
                <select name="hazardLevel" required>
                  <option value="">Select hazard level</option>
                  <option value="Critical">🔴 Critical</option>
                  <option value="Caution">🟡 Caution</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>

              <div className="form-group">
                <LocationPicker onLocationChange={setSelectedLocation} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows="4" placeholder="Describe the hazard..." required />
              </div>

              <div className="form-group">
                <label>Upload Photo</label>
                <input name="photo" type="file" accept="image/*" />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeReport}>CANCEL</button>
                <button type="submit" className="submit-button">SUBMIT REPORT</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* STATUS MODAL */}
      {statusOpen && (
        <div className="modal-overlay" onClick={closeStatus}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>

            <div className="modal-header">
              <h2>CHECK REPORT STATUS</h2>
              <button className="modal-close" onClick={closeStatus}>✕</button>
            </div>

            <form onSubmit={checkStatus}>
              <div className="form-group">
                <label>Report ID</label>
                <input
                  type="text"
                  placeholder="Paste the Report ID here"
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="submit-button status-button">CHECK STATUS</button>
            </form>

            {statusResult && (
              <div className="status-result">
                {statusResult === 'not-found' ? (
                  <>
                    <h3>❌ Report Not Found</h3>
                    <p>We couldn't find a report with that ID.</p>
                  </>
                ) : (
                  <>
                    <h3>Report Found</h3>
                    <p><strong>Report ID:</strong> {statusResult.id}</p>
                    <p><strong>Issue:</strong> {statusResult.hazard_type}</p>
                    <p><strong>Severity:</strong> {statusResult.severity}</p>
                    <p><strong>Description:</strong> {statusResult.description || 'N/A'}</p>
                    <p><strong>Location:</strong> {statusResult.lat}, {statusResult.lng}</p>
                    <p><strong>Status:</strong> {statusResult.status}</p>
                    <p><strong>Submitted:</strong> {statusResult.created_at ? new Date(statusResult.created_at).toLocaleString() : 'N/A'}</p>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}

export default App