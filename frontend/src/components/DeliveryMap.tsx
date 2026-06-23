import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import polylineDecode from '@mapbox/polyline';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Location { lat: number; lng: number; }
interface DeliveryMapProps {
  sellerLocation: Location;
  buyerLocation: Location;
  progress: number;
}

const sellerIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;">📦</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
});
const buyerIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;background:#6366f1;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(99,102,241,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;">🏠</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
});
const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:30px;height:30px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(16,185,129,0.5);display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`,
  iconSize: [30, 30], iconAnchor: [15, 15],
});
const truckIcon = L.divIcon({
  className: '',
  html: `<div style="width:36px;height:36px;background:linear-gradient(135deg,#3b82f6,#6366f1);border:3px solid white;border-radius:50%;box-shadow:0 4px 12px rgba(59,130,246,0.5);display:flex;align-items:center;justify-content:center;font-size:18px;">🚚</div>`,
  iconSize: [36, 36], iconAnchor: [18, 18],
});

function getPositionAlongRoute(coords: [number, number][], progress: number): Location {
  if (coords.length < 2) return { lat: coords[0]?.[0] ?? 0, lng: coords[0]?.[1] ?? 0 };
  const t = Math.max(0, Math.min(1, progress / 100));
  const targetF = t * (coords.length - 1);
  const i = Math.floor(targetF);
  const frac = targetF - i;
  const a = coords[Math.min(i, coords.length - 1)];
  const b = coords[Math.min(i + 1, coords.length - 1)];
  return { lat: a[0] + (b[0] - a[0]) * frac, lng: a[1] + (b[1] - a[1]) * frac };
}

function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (coords.length < 2 || fitted.current) return;
    fitted.current = true;
    map.fitBounds(L.latLngBounds(coords), { padding: [48, 48], maxZoom: 15, animate: true });
  }, [coords, map]);
  return null;
}

function UserLocationCenter({ onFound }: { onFound: (loc: Location) => void }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || !('geolocation' in navigator)) return;
    done.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        onFound(loc);
        map.setView([loc.lat, loc.lng], 14, { animate: true });
      },
      (err) => console.warn('Geolocation denied:', err.message),
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
    );
  }, [map, onFound]);
  return null;
}

export default function DeliveryMap({ sellerLocation, buyerLocation, progress }: DeliveryMapProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeReady, setRouteReady] = useState(false);
  const [userLoc, setUserLoc] = useState<Location | null>(null);
  const [statusMsg, setStatusMsg] = useState('Fetching route…');

  const handleUserFound = useCallback((loc: Location) => setUserLoc(loc), []);

  useEffect(() => {
    let cancelled = false;
    const { lat: slat, lng: slng } = sellerLocation;
    const { lat: blat, lng: blng } = buyerLocation;

    const finish = (coords: [number, number][], msg = '') => {
      if (cancelled) return;
      setRouteCoords(coords);
      setRouteReady(true);
      setStatusMsg(msg);
    };

    const fetchRoute = async () => {
      setStatusMsg('Fetching road route…');

      // Strategy 1 – OSRM encoded polyline
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${slng},${slat};${blng},${blat}?overview=full&geometries=polyline`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const json = await res.json();
        if (json.code === 'Ok' && json.routes?.[0]?.geometry) {
          const decoded = polylineDecode.decode(json.routes[0].geometry) as [number, number][];
          if (decoded.length >= 2) {
            console.log(`✅ OSRM polyline: ${decoded.length} pts`);
            finish(decoded);
            return;
          }
        }
      } catch (e) { console.warn('OSRM polyline failed:', e); }

      if (cancelled) return;

      // Strategy 2 – OSRM GeoJSON
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${slng},${slat};${blng},${blat}?overview=full&geometries=geojson`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const json = await res.json();
        if (json.code === 'Ok' && json.routes?.[0]?.geometry?.coordinates) {
          const coords: [number, number][] = json.routes[0].geometry.coordinates.map(
            (c: number[]) => [c[1], c[0]] as [number, number]
          );
          if (coords.length >= 2) {
            console.log(`✅ OSRM GeoJSON: ${coords.length} pts`);
            finish(coords);
            return;
          }
        }
      } catch (e) { console.warn('OSRM GeoJSON failed:', e); }

      if (cancelled) return;

      // Fallback – straight line
      console.warn('⚠️ Routing failed, using straight line fallback');
      finish([[slat, slng], [blat, blng]], 'Estimated route');
    };

    fetchRoute();
    return () => { cancelled = true; };
  }, [sellerLocation.lat, sellerLocation.lng, buyerLocation.lat, buyerLocation.lng]);

  const vehiclePos =
    routeCoords.length >= 2 && progress > 0 && progress < 100
      ? getPositionAlongRoute(routeCoords, progress)
      : null;

  const doneCoords =
    routeCoords.length >= 2 && progress > 0
      ? routeCoords.slice(0, Math.max(2, Math.ceil((progress / 100) * routeCoords.length)))
      : [];

  const initialCenter: [number, number] = [
    (sellerLocation.lat + buyerLocation.lat) / 2,
    (sellerLocation.lng + buyerLocation.lng) / 2,
  ];

  return (
    <MapContainer center={initialCenter} zoom={12} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Step 1: try to center on user's actual location */}
      <UserLocationCenter onFound={handleUserFound} />

      {/* Step 2: once route is ready, fit bounds to show full route */}
      {routeReady && <FitBounds coords={routeCoords} />}

      {/* Full route — solid grey base */}
      {routeCoords.length >= 2 && (
        <Polyline positions={routeCoords} pathOptions={{ color: '#94a3b8', weight: 6, opacity: 1, dashArray: undefined }} />
      )}

      {/* Completed portion — solid indigo */}
      {doneCoords.length >= 2 && (
        <Polyline positions={doneCoords} pathOptions={{ color: '#6366f1', weight: 6, opacity: 1, dashArray: undefined }} />
      )}

      <Marker position={[sellerLocation.lat, sellerLocation.lng]} icon={sellerIcon}>
        <Popup><b>📦 Seller</b> — Pickup point</Popup>
      </Marker>

      <Marker position={[buyerLocation.lat, buyerLocation.lng]} icon={buyerIcon}>
        <Popup><b>🏠 Delivery Destination</b></Popup>
      </Marker>

      {userLoc && (
        <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
          <Popup><b>📍 Your Current Location</b></Popup>
        </Marker>
      )}

      {vehiclePos && (
        <Marker position={[vehiclePos.lat, vehiclePos.lng]} icon={truckIcon}>
          <Popup><b>🚚 In Transit</b> — {Math.round(progress)}% complete</Popup>
        </Marker>
      )}

      {statusMsg && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'white', padding: '5px 14px', borderRadius: 20,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)', fontSize: 12, fontWeight: 600,
          color: '#3b82f6', pointerEvents: 'none',
        }}>
          {statusMsg}
        </div>
      )}
    </MapContainer>
  );
}
