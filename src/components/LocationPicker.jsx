import { useState } from 'react'
import exifr from 'exifr'
import './LocationPicker.css'

function LocationPicker({ onLocationChange }) {

    const [search, setSearch] = useState('')
    const [location, setLocation] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [source, setSource] = useState('')

    /* =========================
       UPDATE LOCATION
       ========================= */

    const updateLocation = (lat, lng, locationSource, accuracy = null) => {

        const newLocation = {
            latitude: lat,
            longitude: lng,
            source: locationSource,
            accuracy
        }

        setLocation(newLocation)
        setSource(locationSource)
        setError('')

        if (onLocationChange) {
            onLocationChange(newLocation)
        }
    }


    /* =========================
       CURRENT LOCATION
       ========================= */

    const getCurrentLocation = () => {

        setLoading(true)
        setError('')

        if (!navigator.geolocation) {

            setError(
                'Geolocation is not supported by your browser.'
            )

            setLoading(false)

            return
        }


        navigator.geolocation.getCurrentPosition(

            (position) => {

                updateLocation(
                    position.coords.latitude,
                    position.coords.longitude,
                    'device',
                    position.coords.accuracy
                )

                setLoading(false)
            },

            (error) => {

                console.error(error)

                setError(
                    'Unable to get your location. Please allow location access or use manual search.'
                )

                setLoading(false)
            },

            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }

        )
    }


    /* =========================
       MANUAL SEARCH
       ========================= */

    const searchLocation = async () => {

        if (!search.trim()) {

            setError('Please enter a location.')

            return
        }

        setLoading(true)
        setError('')


        try {

            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`
            )


            if (!response.ok) {
                throw new Error('Geocoding request failed.')
            }


            const data = await response.json()


            if (!data.length) {

                setError(
                    'Location not found. Try a more specific location.'
                )

                setLoading(false)

                return
            }


            const result = data[0]

            const latitude = parseFloat(result.lat)
            const longitude = parseFloat(result.lon)


            updateLocation(
                latitude,
                longitude,
                'manual'
            )

            setLoading(false)

        } catch (error) {

            console.error(error)

            setError(
                'Unable to search for this location.'
            )

            setLoading(false)
        }
    }


    /* =========================
       EXIF GPS
       ========================= */

    const handleImageUpload = async (event) => {

        const file = event.target.files[0]

        if (!file) return

        setLoading(true)
        setError('')


        try {

            const gps = await exifr.gps(file)


            if (!gps) {

                setError(
                    'This image does not contain GPS EXIF data.'
                )

                setLoading(false)

                return
            }


            updateLocation(
                gps.latitude,
                gps.longitude,
                'exif'
            )

            setLoading(false)

        } catch (error) {

            console.error(error)

            setError(
                'Unable to read GPS data from this image.'
            )

            setLoading(false)
        }
    }


    return (

        <div className="location-picker">

            <label>
                Location
            </label>


            {/* =========================
                MANUAL SEARCH
               ========================= */}

            <div className="location-search">

                <input
                    type="text"
                    placeholder="Search for a location..."
                    value={search}
                    onChange={(e) =>
                        setSearch(e.target.value)
                    }
                    onKeyDown={(e) => {

                        if (e.key === 'Enter') {
                            e.preventDefault()
                            searchLocation()
                        }

                    }}
                />


                <button
                    type="button"
                    onClick={searchLocation}
                    disabled={loading}
                >
                    SEARCH
                </button>

            </div>


            {/* =========================
                CURRENT LOCATION
               ========================= */}

            <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
            >
                📍 USE MY CURRENT LOCATION
            </button>


            {/* =========================
                EXIF
               ========================= */}

            <div className="exif-location">

                <label>
                    Or get location from photo
                </label>

                <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                />

            </div>


            {/* =========================
                ERROR
               ========================= */}

            {error && (

                <p className="location-error">
                    {error}
                </p>

            )}


            {/* =========================
                LOCATION RESULT
               ========================= */}

            {location && (

                <div className="location-result">

                    <strong>
                        Location detected
                    </strong>

                    <p>
                        Latitude: {location.latitude}
                    </p>

                    <p>
                        Longitude: {location.longitude}
                    </p>

                    <p>
                        Source: {source}
                    </p>

                    {location.accuracy && (

                        <p>
                            Accuracy: approximately{' '}
                            {Math.round(location.accuracy)}m
                        </p>

                    )}

                </div>

            )}

        </div>

    )
}

export default LocationPicker