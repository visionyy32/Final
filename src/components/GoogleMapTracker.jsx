import { useEffect, useRef, useState } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'

// Individual Map component
const Map = ({ center, zoom, locations, trackingPath }) => {
  const ref = useRef(null)
  const [map, setMap] = useState(null)
  const [markers, setMarkers] = useState([])

  useEffect(() => {
    if (ref.current && !map) {
      const newMap = new window.google.maps.Map(ref.current, {
        center,
        zoom,
        mapTypeId: 'roadmap',
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry.fill',
            stylers: [{ color: '#f5f5f5' }]
          },
          {
            featureType: 'road',
            elementType: 'geometry',
            stylers: [{ color: '#ffffff' }]
          }
        ]
      })
      setMap(newMap)
    }
  }, [ref, map, center, zoom])

  // Add markers and tracking path
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    
    const newMarkers = []

    // Add location markers
    locations.forEach((location, index) => {
      const marker = new window.google.maps.Marker({
        position: location.position,
        map,
        title: location.title,
        icon: {
          url: location.type === 'current' 
            ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="white" stroke-width="2"/>
                <circle cx="12" cy="12" r="3" fill="white"/>
              </svg>
            `)
            : location.type === 'origin'
            ? 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#10B981" stroke="white" stroke-width="2"/>
                <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/>
              </svg>
            `)
            : 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#EF4444" stroke="white" stroke-width="2"/>
                <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" fill="none"/>
              </svg>
            `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      })

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-sm">${location.title}</h3>
            <p class="text-xs text-gray-600">${location.description}</p>
            ${location.timestamp ? `<p class="text-xs text-gray-500 mt-1">${location.timestamp}</p>` : ''}
          </div>
        `
      })

      marker.addListener('click', () => {
        infoWindow.open(map, marker)
      })

      newMarkers.push(marker)
    })

    // Add tracking path
    if (trackingPath && trackingPath.length > 1) {
      const path = new window.google.maps.Polyline({
        path: trackingPath,
        geodesic: true,
        strokeColor: '#3B82F6',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        map
      })
    }

    setMarkers(newMarkers)
  }, [map, locations, trackingPath])

  return <div ref={ref} className="w-full h-full" />
}

const GoogleMapTracker = ({ parcelData }) => {
  const [apiKey] = useState(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyBHLett8djBo62dDXj0EjCpF2OK_2-2H8w') // Using Vite env variable syntax

  const render = (status) => {
    switch (status) {
      case Status.LOADING:
        return (
          <div className="flex items-center justify-center h-96 bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading map...</p>
            </div>
          </div>
        )
      case Status.FAILURE:
        return (
          <div className="flex items-center justify-center h-96 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-center">
              <svg className="w-8 h-8 text-red-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600">Failed to load Google Maps</p>
              <p className="text-red-500 text-sm mt-1">Please check your internet connection</p>
            </div>
          </div>
        )
      case Status.SUCCESS:
        return <MapWithData parcelData={parcelData} />
    }
  }

  return (
    <Wrapper apiKey={apiKey} render={render} libraries={['geometry']} />
  )
}

const MapWithData = ({ parcelData }) => {
  // Convert parcel data to map locations
  const locations = []
  const trackingPath = []

  if (parcelData) {
    // Mock coordinates for demonstration - in real app, you'd get these from your backend
    const coordinatesMap = {
      'Nairobi, Kenya': { lat: -1.2921, lng: 36.8219 },
      'Nakuru, Kenya': { lat: -0.3031, lng: 36.0800 },
      'Mombasa, Kenya': { lat: -4.0435, lng: 39.6682 },
      'Eldoret, Kenya': { lat: 0.5143, lng: 35.2698 },
      'Kisumu, Kenya': { lat: -0.0917, lng: 34.7680 }
    }

    // Add origin
    if (parcelData.location && coordinatesMap[parcelData.location]) {
      locations.push({
        position: coordinatesMap[parcelData.location],
        title: 'Origin',
        description: `Package started journey from ${parcelData.location}`,
        type: 'origin'
      })
    }

    // Add current location
    if (parcelData.currentLocation && coordinatesMap[parcelData.currentLocation]) {
      locations.push({
        position: coordinatesMap[parcelData.currentLocation],
        title: 'Current Location',
        description: `Package is currently at ${parcelData.currentLocation}`,
        timestamp: parcelData.lastUpdate,
        type: 'current'
      })
      trackingPath.push(coordinatesMap[parcelData.currentLocation])
    }

    // Add destination
    if (parcelData.destination && coordinatesMap[parcelData.destination]) {
      locations.push({
        position: coordinatesMap[parcelData.destination],
        title: 'Destination',
        description: `Package will be delivered to ${parcelData.destination}`,
        type: 'destination'
      })
    }

    // Add tracking history to path
    if (parcelData.trackingHistory) {
      parcelData.trackingHistory.forEach(event => {
        if (coordinatesMap[event.location]) {
          trackingPath.unshift(coordinatesMap[event.location]) // Add to beginning for chronological order
        }
      })
    }
  }

  // Default center (Nairobi)
  const center = locations.length > 0 
    ? locations.find(loc => loc.type === 'current')?.position || locations[0].position
    : { lat: -1.2921, lng: 36.8219 }

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden shadow-lg">
      <Map 
        center={center}
        zoom={7}
        locations={locations}
        trackingPath={trackingPath}
      />
    </div>
  )
}

export default GoogleMapTracker
