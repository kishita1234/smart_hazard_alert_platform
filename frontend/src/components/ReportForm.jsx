import { useState } from 'react'
import axiosClient from './axios'   // 👈 NAYA — tumhara existing axios client import kiya

function ReportForm() {
  const [hazardType, setHazardType] = useState('')
  const [severity, setSeverity] = useState(1)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [imageFile, setImageFile] = useState(null)      // 👈 NAYA — selected photo store karega

  // 👈 NAYA — UI ki current state track karne ke liye
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleSubmit = async (e) => {           // 👈 async add kiya (await use karna hai isliye)
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!hazardType || !lat || !lng) {
      setError('Please fill hazard type, latitude and longitude.')
      return
    }

    setLoading(true)

    try {
      let imageUrl = null

      // Step 1: agar photo select ki hai, pehle usko /upload pe bhejo
      if (imageFile) {
        const formData = new FormData()
        formData.append('file', imageFile)   // backend "file" naam ki key expect karta hai (File = File(...))

        const uploadRes = await axiosClient.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

        imageUrl = uploadRes.data.image_url   // backend isi naam se return karta hai
      }

      // Step 2: ab actual report /reports pe bhejo
      const payload = {
        hazard_type: hazardType,
        severity: Number(severity),
        lat: Number(lat),
        lng: Number(lng),
        image_url: imageUrl,   // agar photo nahi thi to null jayega — schema mein optional hai
      }

      const reportRes = await axiosClient.post('/reports', payload)

      setSuccess(reportRes.data)   // response me report ka id/status aayega
    } catch (err) {
      console.error('Submit error:', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // 👈 NAYA — submit hone ke baad success message dikhane ke liye
  if (success) {
    return (
      <div>
        <h2>Report Submitted!</h2>
        <p>Report ID: {success.id}</p>
        <p>Status: {success.status || 'Under Review'}</p>
        <button onClick={() => setSuccess(null)}>Report Another</button>
      </div>
    )
  }

  return (
    <div>
      <h2>Report Hazard</h2>
      <form onSubmit={handleSubmit}>
        <label>Hazard Type</label>
        <select
          value={hazardType}
          onChange={(e) => setHazardType(e.target.value)}
        >
          <option value="">Select hazard</option>
          <option value="fire">Fire</option>
          <option value="waterlogging">Waterlogging</option>
          <option value="accident">Accident</option>
          <option value="road_damage">Road Damage</option>
        </select>
        <br /><br />
        <label>Severity</label>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
        <br /><br />
        <label>Latitude</label>
        <input
          type="number"
          step="any"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
          placeholder="e.g. 28.6139"
        />
        <br /><br />
        <label>Longitude</label>
        <input
          type="number"
          step="any"
          value={lng}
          onChange={(e) => setLng(e.target.value)}
          placeholder="e.g. 77.2090"
        />
        <br /><br />

        {/* 👇 NAYA — photo upload input */}
        <label>Photo (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Report Hazard'}
        </button>

        {error && <p style={{ color: 'red' }}>{error}</p>}   {/* 👈 NAYA */}
      </form>
    </div>
  )
}
export default ReportForm