import { useState } from 'react'

function ProfileDropdown({ reports, onLogout }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null)

  const closeModal = () => {
    setActiveModal(null)
  }

  const handleLogout = () => {
    onLogout()
    setProfileOpen(false)
    setActiveModal(null)
  }

  return (
    <>
      <div className="profile-menu">

        <button
          className="profile-button"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          <span className="profile-icon">👤</span>
          USER PROFILE
          <span className="dropdown-arrow">▼</span>
        </button>

        {profileOpen && (
          <div className="profile-dropdown">

            <button
              onClick={() => {
                setActiveModal('login')
                setProfileOpen(false)
              }}
            >
              Login
            </button>

            <button
              onClick={() => {
                setActiveModal('signup')
                setProfileOpen(false)
              }}
            >
              Sign Up
            </button>

            <button
              onClick={() => {
                setActiveModal('reports')
                setProfileOpen(false)
              }}
            >
              Reports Submitted
            </button>

            <button onClick={handleLogout}>
              Log Out
            </button>

          </div>
        )}

      </div>


      {/* LOGIN MODAL */}

      {activeModal === 'login' && (
        <div className="modal-overlay" onClick={closeModal}>

          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <h2>LOGIN</h2>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                alert('Login functionality will be connected to the backend.')
                closeModal()
              }}
            >

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  placeholder="Enter your password"
                  required
                />
              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="submit-button"
                >
                  LOGIN
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* SIGN UP MODAL */}

      {activeModal === 'signup' && (
        <div className="modal-overlay" onClick={closeModal}>

          <div
            className="profile-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <h2>CREATE ACCOUNT</h2>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                alert('Account creation will be connected to the backend.')
                closeModal()
              }}
            >

              <div className="form-group">
                <label>Name</label>

                <input
                  type="text"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>

                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  type="password"
                  placeholder="Create a password"
                  required
                />
              </div>

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-button"
                  onClick={closeModal}
                >
                  CANCEL
                </button>

                <button
                  type="submit"
                  className="submit-button"
                >
                  SIGN UP
                </button>

              </div>

            </form>

          </div>

        </div>
      )}


      {/* REPORTS SUBMITTED MODAL */}

      {activeModal === 'reports' && (
        <div className="modal-overlay" onClick={closeModal}>

          <div
            className="profile-modal reports-modal"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="modal-header">
              <h2>REPORTS SUBMITTED</h2>

              <button
                className="modal-close"
                onClick={closeModal}
              >
                ✕
              </button>
            </div>


            <div className="reports-list">

              {reports.length === 0 ? (

                <div className="no-reports">
                  <p>You haven't submitted any reports yet.</p>

                  <p>
                    Reports you submit will appear here.
                  </p>
                </div>

              ) : (

                reports.map((report) => (
                  <div
                    className="submitted-report"
                    key={report.id}
                  >

                    <div className="report-top">

                      <strong>
                        {report.id}
                      </strong>

                      <span className="report-status">
                        {report.status}
                      </span>

                    </div>

                    <p>
                      <strong>Issue:</strong>{' '}
                      {report.issueType}
                    </p>

                    <p>
                      <strong>Location:</strong>{' '}
                      {report.location}
                    </p>

                    <p>
                      <strong>Submitted:</strong>{' '}
                      {report.date}
                    </p>

                  </div>
                ))

              )}

            </div>

          </div>

        </div>
      )}

    </>
  )
}

export default ProfileDropdown