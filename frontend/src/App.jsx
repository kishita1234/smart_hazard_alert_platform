import { useState, useEffect } from 'react'
import './App.css'
import Map from './map'
import ProfileDropdown from './components/ProfileDropdown'
import AdminLogin from './components/AdminLogin'
import LocationPicker from './components/LocationPicker'
import { checkHealth } from "./api";
import axiosClient from './axios'

function App() {
    useEffect(() => {
    checkHealth()
        .then(data => {
            console.log("BACKEND CONNECTED:", data);
        })
        .catch(error => {
            console.error("BACKEND CONNECTION FAILED:", error);
        });
}, []);

  /* =========================
     REPORTS
     ========================= */

  const [reports, setReports] = useState(() => {

    const savedReports = localStorage.getItem('drishtiReports')

    return savedReports
      ? JSON.parse(savedReports)
      : []

  })


  /* =========================
     MODALS
     ========================= */

  const [reportOpen, setReportOpen] = useState(false)
  const [statusOpen, setStatusOpen] = useState(false)

  const [statusSearch, setStatusSearch] = useState('')
  const [statusResult, setStatusResult] = useState(null)

  const [selectedLocation, setSelectedLocation] = useState(null)


  /* =========================
     NEARBY INCIDENT ALERT
     ========================= */

  const [nearbyAlert, setNearbyAlert] = useState(null)


  useEffect(() => {

    const checkNearbyIncidents = async () => {

      try {

        console.log('Checking for nearby incidents...')

        const response = await axiosClient.get('/incidents/nearby')

        const incidents = response.data

        console.log(
          'Nearby incidents received:',
          incidents
        )


        const verifiedIncident = incidents.find(
          (incident) =>
            incident.verified === true ||
            incident.status === 'VERIFIED'
        )


        if (verifiedIncident) {

          setNearbyAlert(verifiedIncident)

        } else {

          setNearbyAlert(null)

        }

      } catch (error) {

        console.log(
          'Nearby incident check failed:',
          error
        )

      }

    }


    // Check immediately when homepage loads
    checkNearbyIncidents()


    // Check again every 30 seconds
    const interval = setInterval(
      checkNearbyIncidents,
      30000
    )


    return () => clearInterval(interval)

  }, [])


  /* =========================
     ADMIN PAGE
     ========================= */

  if (window.location.pathname === '/admin') {
    return <AdminLogin />
  }


  /* =========================
     REPORT MODAL
     ========================= */

  const openReport = () => {

    setReportOpen(true)

  }


  const closeReport = () => {

    setReportOpen(false)

    setSelectedLocation(null)

  }


  /* =========================
     SUBMIT REPORT
     ========================= */

  const handleSubmit = async (e) => {

    e.preventDefault()

    const formData = new FormData(e.target)

    const issueType = formData.get('issueType')
    const hazardLevel = formData.get('hazardLevel')
    const description = formData.get('description')
    const photoFile = formData.get('photo')


    /* =========================
       LOCATION VALIDATION
       ========================= */

    if (!selectedLocation) {

      alert(
        'Please select or detect a location before submitting.'
      )

      return

    }


    try {

      let imageUrl = null

      // Agar photo select ki hai, pehle usko upload karo
      if (photoFile && photoFile.size > 0) {

        const uploadData = new FormData()
        uploadData.append('file', photoFile)

        const uploadRes = await axiosClient.post(
          '/upload',
          uploadData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )

        imageUrl = uploadRes.data.image_url

      }

      // Hazard level ko backend ke severity number me convert karo
      const severityMap = { Critical: 5, Caution: 3, Low: 1 }

      const payload = {
        hazard_type: issueType,
        severity: severityMap[hazardLevel] || 1,
        lat: selectedLocation.latitude,
        lng: selectedLocation.longitude,
        image_url: imageUrl,
        description: description,
      }

      const reportRes = await axiosClient.post('/reports', payload)


      /* =========================
         CREATE REPORT (backend response se)
         ========================= */

      const newReport = {

        id: reportRes.data.report_id,   // 👈 FIXED — backend "report_id" bhejta hai, "id" nahi

        issueType,

        hazardLevel,

        location: selectedLocation,

        description,

        status: 'UNDER REVIEW',   // POST response status nahi bhejta, isliye placeholder

        date: new Date().toLocaleString(),

      }


      /* =========================
         UPDATE REPORTS
         ========================= */

      const updatedReports = [
        ...reports,
        newReport
      ]


      setReports(updatedReports)


      localStorage.setItem(
        'drishtiReports',
        JSON.stringify(updatedReports)
      )


      setReportOpen(false)

      setSelectedLocation(null)


      /* =========================
         SUCCESS MESSAGE
         ========================= */

      alert(
        `Report submitted successfully!\n\nYour Report ID is:\n${newReport.id}\n\nPlease save this ID to check your report status.`
      )

    } catch (error) {

      console.error('Report submit failed:', error)

      alert('Something went wrong while submitting the report. Please try again.')

    }

  }


  /* =========================
     CHECK STATUS
     ========================= */

  const openStatus = () => {

    setStatusOpen(true)

    setStatusSearch('')

    setStatusResult(null)

  }


  const closeStatus = () => {

    setStatusOpen(false)

  }


  const checkStatus = async (e) => {

    e.preventDefault()

    try {

      // Backend se seedha uss report_id ka detail maango
      const res = await axiosClient.get(`/reports/${statusSearch.trim()}`)

      setStatusResult(res.data.report)   // backend { report: {...} } shape me bhejta hai

    } catch (error) {

      console.log('Status check failed:', error)

      setStatusResult('not-found')

    }

  }


  /* =========================
     LOGOUT
     ========================= */

  const handleLogout = () => {

    alert('You have been logged out.')

  }


  return (

    <div className="app">


      {/* =========================
          HEADER
         ========================= */}

      <header className="header">

        <div className="logo">
          दृष्टि Smart Waterlogging Alert Portal
        </div>


        <nav>

          <a href="#">
            HOME
          </a>


          <button
            className="nav-button"
            onClick={openReport}
          >
            REPORT AN ISSUE
          </button>


          <button
            className="nav-button"
            onClick={openStatus}
          >
            CHECK STATUS
          </button>


          <a href="#alerts">
            CHECK ALERTS
          </a>


          <ProfileDropdown
            reports={reports}
            onLogout={handleLogout}
          />

        </nav>

      </header>


      {/* =========================
          NEARBY VERIFIED ALERT
         ========================= */}

      {nearbyAlert && (

        <div
          className="nearby-alert"
          style={{
            margin: '10px 16px',
            padding: '14px 18px',
            background: '#382629',
            border: '1px solid #b85c5c',
            borderLeft: '5px solid #b85c5c',
            borderRadius: '6px',
            color: '#f3f4f4'
          }}
        >

          <strong>
            🚨 VERIFIED HAZARD NEARBY
          </strong>


          <p style={{ margin: '6px 0 0' }}>
            {nearbyAlert.hazard_type ||
              nearbyAlert.issueType ||
              'Hazard reported nearby'}
          </p>


          {nearbyAlert.severity && (

            <small>
              Severity: {nearbyAlert.severity}
            </small>

          )}

        </div>

      )}


      {/* =========================
          MAIN
         ========================= */}

      <main>


        {/* =========================
            ALERT TABS
           ========================= */}

        <div className="tabs">

          <button>
            📍 LOCAL LOCATION HAZARD ALERT
          </button>

          <button>
            🚩 LOCAL AREA HAZARD ALERT
          </button>

          <button>
            ⚠️ ZONE-WISE HAZARD ALERT
          </button>

          <button>
            📡 LIVE OVERVIEW
          </button>

        </div>


        {/* =========================
            MAP + ALERTS
           ========================= */}

        <div className="content">


          {/* MAP */}

          <section className="map-section">

            <div className="map-placeholder">

              <Map />

            </div>

          </section>


          {/* ALERT SIDEBAR */}

          <aside
            className="alerts"
            id="alerts"
          >

            <h2>
              ALERT LIST
            </h2>


            {/* SCROLLABLE REPORT AREA */}

            <div className="alerts-list">

              {reports.length === 0 ? (

                <p className="no-reports">
                  No hazard reports yet.
                </p>

              ) : (

                reports.map((report) => (

                  <div
                    key={report.id}
                    className={`alert ${(report.hazardLevel || 'Caution').toLowerCase()}`}
                  >

                    <strong>
                      {report.hazardLevel || 'Caution'}
                    </strong>


                    <p>
                      {report.issueType}
                    </p>


                    <p>
                      {report.description}
                    </p>


                    <small>
                      Report ID: {report.id}
                    </small>


                    <small>
                      Status: {report.status}
                    </small>

                  </div>

                ))

              )}

            </div>

          </aside>

        </div>


        {/* =========================
            REPORT BUTTON
           ========================= */}

        <button
          className="report-button"
          onClick={openReport}
        >
          + REPORT A HAZARD
        </button>

      </main>


      {/* =========================
          REPORT MODAL
         ========================= */}

      {reportOpen && (

        <div
          className="modal-overlay"
          onClick={closeReport}
        >

          <div
            className="report-modal"
            onClick={(e) => e.stopPropagation()}
          >


            {/* MODAL HEADER */}

            <div className="modal-header">

              <h2>
                REPORT A HAZARD
              </h2>


              <button
                className="modal-close"
                onClick={closeReport}
              >
                ✕
              </button>

            </div>


            {/* REPORT FORM */}

            <form onSubmit={handleSubmit}>


              {/* ISSUE TYPE */}

              <div className="form-group">

                <label>
                  Issue Type
                </label>


                <select
                  name="issueType"
                  required
                >

                  <option value="">
                    Select an issue
                  </option>


                  <option value="Waterlogging">
                    Waterlogging
                  </option>


                  <option value="Road Collapse">
                    Road Collapse
                  </option>


                  <option value="Blocked Drain">
                    Blocked Drain
                  </option>


                  <option value="Debris / Obstruction">
                    Debris / Obstruction
                  </option>


                  <option value="Flooding">
                    Flooding
                  </option>


                  <option value="Other">
                    Other
                  </option>

                </select>

              </div>


              {/* HAZARD LEVEL */}

              <div className="form-group">

                <label>
                  Hazard Level
                </label>


                <select
                  name="hazardLevel"
                  required
                >

                  <option value="">
                    Select hazard level
                  </option>


                  <option value="Critical">
                    🔴 Critical
                  </option>


                  <option value="Caution">
                    🟡 Caution
                  </option>


                  <option value="Low">
                    🟢 Low
                  </option>

                </select>

              </div>


              {/* LOCATION */}

              <div className="form-group">

                <LocationPicker
                  onLocationChange={setSelectedLocation}
                />

              </div>


              {/* DESCRIPTION */}

              <div className="form-group">

                <label>
                  Description
                </label>


                <textarea
                  name="description"
                  rows="4"
                  placeholder="Describe the hazard..."
                  required
                />

              </div>


              {/* PHOTO */}

              <div className="form-group">

                <label>
                  Upload Photo
                </label>


                <input
                  name="photo"
                  type="file"
                  accept="image/*"
                />

              </div>


              {/* ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeReport}
                >
                  CANCEL
                </button>


                <button
                  type="submit"
                  className="submit-button"
                >
                  SUBMIT REPORT
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* =========================
          CHECK STATUS MODAL
         ========================= */}

      {statusOpen && (

        <div
          className="modal-overlay"
          onClick={closeStatus}
        >

          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >


            {/* HEADER */}

            <div className="modal-header">

              <h2>
                CHECK REPORT STATUS
              </h2>


              <button
                className="modal-close"
                onClick={closeStatus}
              >
                ✕
              </button>

            </div>


            {/* SEARCH */}

            <form onSubmit={checkStatus}>

              <div className="form-group">

                <label>
                  Report ID
                </label>


                <input
                  type="text"
                  placeholder="Paste the Report ID here"
                  value={statusSearch}
                  onChange={(e) =>
                    setStatusSearch(e.target.value)
                  }
                  required
                />

              </div>


              <button
                type="submit"
                className="submit-button status-button"
              >
                CHECK STATUS
              </button>

            </form>


            {/* RESULT */}

            {statusResult && (

              <div className="status-result">


                {statusResult === 'not-found' ? (

                  <>

                    <h3>
                      ❌ Report Not Found
                    </h3>


                    <p>
                      We couldn't find a report with that ID.
                    </p>

                  </>

                ) : (

                  <>

                    <h3>
                      Report Found
                    </h3>


                    <p>
                      <strong>
                        Report ID:
                      </strong>{' '}

                      {statusResult.id}
                    </p>


                    <p>
                      <strong>
                        Issue:
                      </strong>{' '}

                      {statusResult.hazard_type}
                    </p>


                    <p>
                      <strong>
                        Severity:
                      </strong>{' '}

                      {statusResult.severity}
                    </p>


                    <p>
                      <strong>
                        Description:
                      </strong>{' '}

                      {statusResult.description || 'N/A'}
                    </p>


                    <p>
                      <strong>
                        Location:
                      </strong>{' '}

                      {statusResult.lat}, {statusResult.lng}
                    </p>


                    <p>
                      <strong>
                        Status:
                      </strong>{' '}

                      {statusResult.status}
                    </p>


                    <p>
                      <strong>
                        Submitted:
                      </strong>{' '}

                      {new Date(statusResult.created_at).toLocaleString()}
                    </p>

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