import { useState } from 'react'
import './AdminLogin.css'

function AdminLogin() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleLogin = (e) => {
        e.preventDefault()

        // Temporary credentials for testing
        const adminEmail = 'admin@drishti.com'
        const adminPassword = 'admin123'

        if (email === adminEmail && password === adminPassword) {
            setError('')
            localStorage.setItem('isAdminLoggedIn', 'true')

            alert('Admin login successful!')
        } else {
            setError('Invalid admin email or password.')
        }
    }

    return (
        <div className="admin-login-page">

            <div className="admin-login-box">

                <div className="admin-login-header">
                    <div className="admin-icon">🛡️</div>

                    <h1>ADMIN LOGIN</h1>

                    <p>
                        Drishti Smart Waterlogging Alert Portal
                    </p>
                </div>

                <form onSubmit={handleLogin}>

                    <div className="form-group">
                        <label>Admin Email</label>

                        <input
                            type="email"
                            placeholder="Enter admin email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>

                        <input
                            type="password"
                            placeholder="Enter admin password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <p className="admin-error">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="admin-login-button"
                    >
                        LOGIN AS ADMIN
                    </button>

                </form>

                <button
                    className="back-button"
                    onClick={() => window.location.href = '/'}
                >
                    ← BACK TO HOME
                </button>

            </div>

        </div>
    )
}

export default AdminLogin