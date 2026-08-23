import { useState, useEffect } from 'react'
import './App.css'
import HazardMap from './map'
import ProfileDropdown from './components/ProfileDropdown'
import AdminLogin from './components/AdminLogin'
import LocationPicker from './components/LocationPicker'
import axiosClient from './axios'

const RADIUS = { local: 500, area: 2000, zone: 5000 }

const RADIUS_LABEL = {
  local: 'Within 500m of your location',
  area: 'Within 2km of your location',
  zone: 'Within 5km of your location',
}

// AI se jo bhi severity word/number aaye, usko backend ke number (1-5) me convert karo
const toSeverityInt = (sev) => {
  if (typeof sev === 'number') { return Math.min(5, Math.max(1, sev)) }
  if (!sev) return 1
  const map = { low: 1, caution: 2, moderate: 3, medium: 3, high: 4, critical: 5, severe: 5 }
  return map[String(sev).toLowerCase()] || 1
}

function App() {

  if (window.location.pathname === '/admin') {
    return <AdminLogin />
  }

  /* ========== STATE ========== */
  const [incidents, setIncidents] = useState([])
  const [searchIncidents, setSearchIncidents] = useState([])
  const [searchedLocation, setSearchedLocation] = useState(null)
  const [userLoc, setUserLoc] = useState(null)
  const [activeTab, setActiveTab] = useState('live')
  const [nearbyAlert, setNearbyAlert] = useState(null)

  const [reportOpen, setReportOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)
  const [statusSearch, setStatusSearch] = useState('')
  const [statusResult, setStatusResult] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)

  /* ========== PHOTO + AI CLASSIFY STATE ========== */
  const [imageUploading, setImageUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState(null)
  const [detecting, setDetecting] = useState(false)
  const [detectedType, setDetectedType] = useState(null)
  const [detectedSeverity, setDetectedSeverity] = useState(null)
  const [classifyError, setClassifyError] = useState(null)

  /* ========== USER LOCATION (mount) ========== */
  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.log('geo err-->', err)
    )
  }, [])

  /* ========== FETCH INCIDENTS (tab-wise) ========== */
  const loadIncidents = async (tab, loc, signal) => {
    try {
      if (tab === 'live') {
        const res = await axiosClient.get('/incidents', { signal })
        setIncidents(res?.data?.incidents || [])
      } else {
        if (!loc) return
        const res = await axiosClient.get('/incidents/nearby', {
          params: { lat: loc.lat, lng: loc.lng, radius: RADIUS[tab] },
          signal,
        })
        setIncidents(res?.data?.incidents || res?.data || [])
      }
    } catch (err) {
      if (err?.code === 'ERR_CANCELED') return
      console.log('err in loadIncidents-->', err)
    }
  }

  // live tab: sirf tab change pe fetch — userLoc change pe dobara nahi
  useEffect(() => {
    if (activeTab !== 'live') return
    const controller = new AbortController()
    loadIncidents('live', null, controller.signal)
    return () => controller.abort()
  }, [activeTab])

  // nearby tabs: tab ya location change pe fetch
  useEffect(() => {
    if (activeTab === 'live' || !userLoc) return
    const controller = new AbortController()
    loadIncidents(activeTab, userLoc, controller.signal)
    return () => controller.abort()
  }, [activeTab, userLoc])

  /* ========== SEARCH LOCATION — radius ke andar filter ========== */
  const searchRadius = activeTab === 'live' ? RADIUS.zone : RADIUS[activeTab]

  useEffect(() => {
    if (!searchedLocation) {
      setSearchIncidents([])
      return
    }

    const controller = new AbortController()

    const fetchSearchArea = async () => {
      try {
        const res = await axiosClient.get('/incidents/nearby', {
          params: {
            lat: searchedLocation.lat,
            lng: searchedLocation.lng,
            radius: searchRadius,
          },
          signal: controller.signal,
        })
        setSearchIncidents(res?.data?.incidents || res?.data || [])
      } catch (err) {
        if (err?.code === 'ERR_CANCELED') return
        console.log('search area fetch failed:', err)
        setSearchIncidents([])
      }
    }

    fetchSearchArea()
    return () => controller.abort()
  }, [searchedLocation, searchRadius])

  const isSearchActive = searchedLocation !== null
  const visibleIncidents = isSearchActive ? searchIncidents : incidents

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
    setImageUrl(null)
    setDetectedType(null)
    setDetectedSeverity(null)
    setClassifyError(null)
  }

  /* ========== PHOTO SELECT -> UPLOAD -> AI CLASSIFY ========== */
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImageUrl(null)
    setDetectedType(null)
    setDetectedSeverity(null)
    setClassifyError(null)

    setImageUploading(true)

    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      const uploadRes = await axiosClient.post('/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploadedUrl = uploadRes.data.image_url
      setImageUrl(uploadedUrl)

      setDetecting(true)
      const classifyRes = await axiosClient.post('/classify', { image_url: uploadedUrl })
      console.log('CLASSIFY RAW RESULT:', classifyRes.data)

      const raw = classifyRes.data?.result

      const hazardType =
        raw?.hazard_type || raw?.label || raw?.class || raw?.prediction || raw?.type || 'Unknown'

      const severity =
        raw?.severity ?? raw?.severity_level ?? raw?.confidence_level ?? null

      setDetectedType(hazardType)
      setDetectedSeverity(severity)

    } catch (err) {
      console.error('Photo upload/classify failed:', err)
      setClassifyError('Could not analyze this photo automatically. Please try another photo.')
    } finally {
      setImageUploading(false)
      setDetecting(false)
    }
  }

  /* ========== SUBMIT ========== */
  const handleSubmit = async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)
    const description = formData.get('description')

    if (!selectedLocation) {
      alert('Please select or detect a location before submitting.')
      return
    }
    if (!imageUrl) {
      alert('Please upload a photo first.')
      return
    }
    if (!detectedType) {
      alert('Still analyzing the photo, please wait a moment and try again.')
      return
    }

    try {
      const payload = {
        hazard_type: detectedType,
        severity: toSeverityInt(detectedSeverity),
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        image_url: imageUrl,
        description,
      }

      const res = await axiosClient.post('/reports', payload)

      alert(`Report submitted successfully!\n\nDetected: ${detectedType}\n\nYour Report ID is:\n${res.data.report_id}\n\nPlease save this ID to check your report status.`)

      setReportOpen(false)
      setSelectedLocation(null)
      setImageUrl(null)
      setDetectedType(null)
      setDetectedSeverity(null)
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

  /* ========== DERIVED: severity-wise sorted list ========== */
  const sortedIncidents = [...visibleIncidents].sort(
    (a, b) => (b?.severity || 0) - (a?.severity || 0)
  )

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
              <HazardMap
                incidents={visibleIncidents}
                center={userLoc}
                activeTab={activeTab}
                radius={activeTab !== 'live' ? RADIUS[activeTab] : null}
                searchedLocation={searchedLocation}
                onSearchLocation={setSearchedLocation}
                searchRadius={searchRadius}
              />
            </div>
          </section>

          <aside className="alerts" id="alerts">
            {/* HEADER — tab ke hisaab se count + radius */}
            <h2>
              {activeTab === 'live' && !isSearchActive
                ? 'ALL HAZARDS'
                : `NEARBY HAZARDS (${sortedIncidents.length})`}
            </h2>

            {isSearchActive ? (
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#9aa' }}>
                Within {searchRadius >= 1000 ? `${searchRadius / 1000}km` : `${searchRadius}m`} of searched location
              </p>
            ) : activeTab !== 'live' ? (
              <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#9aa' }}>
                {RADIUS_LABEL[activeTab]}
              </p>
            ) : null}

            <div className="alerts-list">
              {sortedIncidents.length === 0 ? (
                <p className="no-reports">
                  {isSearchActive
                    ? 'No data as of now.'
                    : activeTab === 'live'
                      ? 'No hazard reports yet.'
                      : 'No hazards in this area.'}
                </p>
              ) : (
                sortedIncidents.map((inc, i) => (
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
                <label>Upload Photo</label>
                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  required
                />
              </div>

              {imageUploading && <p style={{ color: '#9aa' }}>Uploading photo...</p>}
              {detecting && <p style={{ color: '#9aa' }}>Analyzing photo, please wait...</p>}
              {classifyError && <p style={{ color: '#e07b7b' }}>{classifyError}</p>}

              {detectedType && !detecting && (
                <div className="form-group" style={{
                  background: '#1e2a2f', padding: '10px 14px',
                  borderRadius: '6px', border: '1px solid #3a5a5a',
                }}>
                  <p style={{ margin: 0 }}>
                    <strong>Detected Hazard Type:</strong> {detectedType}
                  </p>
                  <p style={{ margin: '4px 0 0' }}>
                    <strong>Detected Severity:</strong> {detectedSeverity ?? 'N/A'}
                  </p>
                </div>
              )}

              <div className="form-group">
                <LocationPicker onLocationChange={setSelectedLocation} />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea name="description" rows="4" placeholder="Describe the hazard..." required />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-button" onClick={closeReport}>CANCEL</button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={imageUploading || detecting || !detectedType}
                >
                  SUBMIT REPORT
                </button>
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