import { useState } from 'react'
import './App.css'
import Map from './Map'
import ProfileDropdown from './components/ProfileDropdown'

function App() {

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


  /* =========================
     REPORT MODAL
     ========================= */

  const openReport = () => {
    setReportOpen(true)
  }

  const closeReport = () => {
    setReportOpen(false)
  }


  /* =========================
     CREATE REPORT ID
     ========================= */

  const generateReportId = () => {

    const randomNumber = Math.floor(
      100000 + Math.random() * 900000
    )

    return `DRS-${randomNumber}`
  }


  /* =========================
     SUBMIT REPORT
     ========================= */

  const handleSubmit = (e) => {

    e.preventDefault()

    const formData = new FormData(e.target)

    const issueType = formData.get('issueType')
    const location = formData.get('location')
    const description = formData.get('description')

    const newReport = {

      id: generateReportId(),

      issueType,

      location,

      description,

      status: 'UNDER REVIEW',

      date: new Date().toLocaleString(),

    }


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


    alert(
      `Report submitted successfully!\n\nYour Report ID is:\n${newReport.id}\n\nPlease save this ID to check your report status.`
    )

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


  const checkStatus = (e) => {

    e.preventDefault()

    const report = reports.find(
      (item) =>
        item.id.toLowerCase() ===
        statusSearch.trim().toLowerCase()
    )


    if (report) {

      setStatusResult(report)

    } else {

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
          MAIN
         ========================= */}

      <main>


        {/* ALERT TABS */}

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


        {/* MAP + ALERTS */}

        <div className="content">

          <section className="map-section">

            <div className="map-placeholder">
              <Map />
            </div>

          </section>


          <aside
            className="alerts"
            id="alerts"
          >

            <h2>
              ALERT LIST
            </h2>


            <div className="alert critical">

              <strong>
                Critical (Red)
              </strong>

              <p>
                Road collapse on Sect. 18 Main Rd
              </p>

            </div>


            <div className="alert caution">

              <strong>
                Caution (Yellow)
              </strong>

              <p>
                Minor waterlogging on Sect. 29 Service Rd
              </p>

            </div>


            <div className="alert resolved">

              <strong>
                Resolved (Green)
              </strong>

              <p>
                Cleared debris on Sect. 18 Main Rd
              </p>

            </div>

          </aside>

        </div>


        {/* REPORT BUTTON */}

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


            <form onSubmit={handleSubmit}>


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


              <div className="form-group">

                <label>
                  Location
                </label>

                <input
                  name="location"
                  type="text"
                  placeholder="Enter location"
                  required
                />

              </div>


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


            <form onSubmit={checkStatus}>

              <div className="form-group">

                <label>
                  Report ID
                </label>

                <input
                  type="text"
                  placeholder="Example: DRS-123456"
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
                      {statusResult.issueType}
                    </p>

                    <p>
                      <strong>
                        Location:
                      </strong>{' '}
                      {statusResult.location}
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
                      {statusResult.date}
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