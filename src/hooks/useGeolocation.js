import { useState, useEffect } from "react";

const DEFAULT_COORDS = { latitude: 13.133, longitude: 78.133, accuracy: 5.0 };

export function useGeolocation() {
  const [coords, setCoords] = useState(DEFAULT_COORDS);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setError("Geolocation not supported by this browser.");
      return;
    }

    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        console.warn(
          "Geolocation sensor error, using benchmark fallback:",
          err.message,
        );
        setError(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  return { coords, setCoords, error };
}
