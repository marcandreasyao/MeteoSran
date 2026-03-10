import { useState, useEffect, useCallback } from 'react';

export interface LocationData {
  lat: number;
  lon: number;
}

export type PermissionState = 'granted' | 'prompt' | 'denied' | 'unknown';

export interface GeolocationState {
  location: LocationData | null;
  error: string | null;
  isLoading: boolean;
  permissionState: PermissionState;
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true, // Prioritize GPS over IP/Wi-Fi for high precision
  timeout: 10000,           // 10 second timeout if sensors are unresponsive
  maximumAge: 300000        // Cache location for 5 minutes (300,000 ms) to save battery
};

export const useGeolocation = (startAcquisition = true) => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    isLoading: startAcquisition,
    permissionState: 'unknown'
  });

  // Check initial permission state
  useEffect(() => {
    if (!navigator.permissions) {
      // Fallback for browsers that don't support Permissions API (like some versions of Safari)
      setState(prev => ({ ...prev, permissionState: 'prompt' }));
      return;
    }

    navigator.permissions.query({ name: 'geolocation' }).then((status) => {
      setState(prev => ({ ...prev, permissionState: status.state as PermissionState }));

      status.onchange = () => {
        setState(prev => ({ ...prev, permissionState: status.state as PermissionState }));
      };
    }).catch((err) => {
      console.warn("Permissions API not completely supported", err);
      setState(prev => ({ ...prev, permissionState: 'prompt' }));
    });
  }, []);

  const getLocation = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser.',
        isLoading: false
      }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          },
          error: null,
          isLoading: false
        }));
      },
      (error) => {
        let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enter your location manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out. Sensors might be unresponsive.';
            break;
        }
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false
        }));
      },
      GEOLOCATION_OPTIONS
    );
  }, []);

  useEffect(() => {
    if (startAcquisition) {
      getLocation();
    }
  }, [startAcquisition, getLocation]);

  return { ...state, getLocation };
};
