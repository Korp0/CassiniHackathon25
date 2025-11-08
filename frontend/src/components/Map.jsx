import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState, useRef } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { FaBullseye } from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pre Leaflet ikony v React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Ikona pre pozíciu hráča - použitím inline Tailwind tried
const playerIcon = L.divIcon({
  className: '',
  html: `
    <div style="position: relative; width: 20px; height: 20px;">
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 16px; height: 16px; background: #2563eb; border: 3px solid white; border-radius: 50%; box-shadow: 0 2px 8px rgba(37, 99, 235, 0.5); z-index: 2;"></div>
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 20px; height: 20px; background: rgba(37, 99, 235, 0.3); border-radius: 50%; animation: pulse 2s ease-out infinite;"></div>
    </div>
    <style>
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
      }
    </style>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Ikona pre quest - use custom icon from public folder (caves.svg)
// Icon cache and factory: choose an icon based on landmark type (fallback to /landmark.svg)
const iconCache = {};
function getIconForType(type, isIndoor = false) {
  const raw = (type || '').toString().toLowerCase();
  const key = `${raw}::${isIndoor ? 'indoor' : 'outdoor'}`;
  if (iconCache[key]) return iconCache[key];

  // Map common type names to actual SVG filenames in public/
  let iconPath = '';
  if (raw.includes('museum')) iconPath = '/museums.svg';
  else if (raw.includes('cave') || raw.includes('caves')) iconPath = '/caves.svg';
  else if (raw.includes('castle') || raw.includes('castles')) iconPath = '/castles.svg';
  else if (raw.includes('landmark') || raw.includes('landmarks')) iconPath = '/landmarks.svg';

  // If no explicit mapping by type, choose fallback based on indoor/outdoor
  if (!iconPath) {
    iconPath = isIndoor ? '/museums.svg' : '/landmarks.svg';
  }

  const ic = L.icon({
    iconUrl: iconPath,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });

  iconCache[key] = ic;
  return ic;
}

// Active quest icon (green) using a simple green circle divIcon
const activeQuestIcon = L.divIcon({
  className: '',
  html: `
    <div style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
      <div style="width:34px;height:34px;border-radius:9999px;background:#16a34a;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.15);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;">✓</div>
    </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Komponent na recentrovanie mapy na hráča
function RecenterMap({ position }) {
  const map = useMap();
  
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom());
    }
  }, [position, map]);
  
  return null;
}

const Map = ({ position, quests, onQuestClick, centerOnPlayer = false, mapCenter = null, activeQuest = null }) => {
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const defaultCenter = [48.7164, 21.2611]; // Košice ako default
  const center = mapCenter ? mapCenter : (position ? [position.lat, position.lng] : defaultCenter);
  
  // Expose Leaflet map on DOM element for external access
  useEffect(() => {
    if (map) {
      const mapEl = document.querySelector('.leaflet-container');
      if (mapEl) {
        mapEl._leaflet_map = map;
      }
    }
  }, [map]);

  // Nested controller that uses useMap() so we get the real Leaflet instance
  // as soon as MapContainer mounts. This avoids timing issues with whenCreated.
  function MapController({ mapCenter, quests }) {
    const m = useMap();

    useEffect(() => {
      if (!m) return;
      // expose map instance to parent state/ref
      try { setMap(m); mapRef.current = m; } catch (e) {}

      // style zoom controls shortly after mount
      setTimeout(() => {
        try {
          const container = document.querySelector('.leaflet-control-zoom');
          if (container) {
            container.classList.add('flex', 'flex-col', 'gap-2');
            const anchors = container.querySelectorAll('a');
            anchors.forEach(a => {
              a.classList.add(
                'w-11', 'h-11', 'bg-white', 'rounded-xl', 'shadow-lg',
                'flex', 'items-center', 'justify-center', 'text-2xl', 'text-gray-700',
                'border', 'border-gray-200', 'transition', 'transform', 'hover:scale-105'
              );
              a.style.lineHeight = '1';
            });
          }
        } catch (e) {
          // ignore
        }
      }, 50);

      // perform centering/fitBounds when controller mounts or props change
      try {
        if (mapCenter && Array.isArray(mapCenter) && mapCenter.length === 2) {
          if (typeof m.invalidateSize === 'function') m.invalidateSize();
          m.setView(mapCenter, 16);
        }
      } catch (e) {}

      try {
        if (quests && quests.length > 0) {
          if (typeof m.invalidateSize === 'function') m.invalidateSize();
          const latlngs = quests.filter(q => q.lat != null && q.lon != null).map(q => [Number(q.lat), Number(q.lon)]);
          if (latlngs.length === 1) {
            m.setView(latlngs[0], 16);
          } else if (latlngs.length > 1) {
            const bounds = L.latLngBounds(latlngs);
            m.fitBounds(bounds.pad ? bounds.pad(0.15) : bounds, { padding: [40, 40] });
          }
        }
      } catch (e) {}

      return () => {};
    }, [m, mapCenter, quests]);

    return null;
  }

  // Apply Tailwind styling to native Leaflet zoom controls after map is ready
  useEffect(() => {
    if (!map) return;

    // Wait a tick for Leaflet to render the zoom control DOM
    const timer = setTimeout(() => {
      try {
        const container = document.querySelector('.leaflet-control-zoom');
        if (container) {
          // Add Tailwind utility classes to container
          container.classList.add('flex', 'flex-col', 'gap-2');

          // Style the anchor buttons
          const anchors = container.querySelectorAll('a');
          anchors.forEach(a => {
            a.classList.add(
              'w-11', 'h-11', 'bg-white', 'rounded-xl', 'shadow-lg',
              'flex', 'items-center', 'justify-center', 'text-2xl', 'text-gray-700',
              'border', 'border-gray-200', 'transition', 'transform', 'hover:scale-105'
            );
            a.style.lineHeight = '1';
          });
        }
      } catch (e) {
        console.warn('Failed to style leaflet zoom control', e);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [map]);

  // When parent requests a specific center (e.g. scanned zone), recenter the map
  useEffect(() => {
    const m = mapRef.current || map;
    console.log('mapCenter effect fired, map ready?', !!m, 'mapCenter=', mapCenter);
    if (!m) return;

    if (mapCenter && Array.isArray(mapCenter) && mapCenter.length === 2) {
      try {
        if (typeof m.invalidateSize === 'function') {
          m.invalidateSize();
        }
        // use a comfortable zoom for zones
        m.setView(mapCenter, 16);
      } catch (e) {
        // ignore
      }
    }
  }, [mapCenter, map]);

  // If quests change (e.g. loaded zone with multiple points), fit bounds to show them all
  useEffect(() => {
    const m = mapRef.current || map;
    console.log('quests effect fired, map ready?', !!m, 'questsLen=', quests ? quests.length : 0);
    if (!m) return;
    if (!quests || quests.length === 0) return;

    if (quests.length === 1) {
      const q = quests[0];
      if (q.lat && q.lon) {
        try { m.setView([Number(q.lat), Number(q.lon)], 16); } catch (e) {}
      }
      return;
    }


    try {
      if (typeof m.invalidateSize === 'function') {
        m.invalidateSize();
      }
      const latlngs = quests
        .filter(q => q.lat != null && q.lon != null)
        .map(q => [Number(q.lat), Number(q.lon)]);
      if (latlngs.length === 0) return;
      const bounds = L.latLngBounds(latlngs);
      m.fitBounds(bounds.pad ? bounds.pad(0.15) : bounds, { padding: [40, 40] });
    } catch (e) {
      // ignore
    }
  }, [quests, map]);

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        center={center}
        zoom={15}
        className="w-full h-full"
        zoomControl={false}
        whenCreated={(m) => {
          setMap(m);
          mapRef.current = m;
          console.log('Map created, mapRef set', !!m);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController mapCenter={mapCenter} quests={quests} />
        
        {centerOnPlayer && position && <RecenterMap position={position} />}
        
        {/* Hráčova pozícia */}
        {position && (
          <Marker position={[position.lat, position.lng]} icon={playerIcon}>
            <Popup>
                <div className="min-w-[200px] p-2">
                <strong className="block text-base mb-2"><FiMapPin className="inline mr-2"/>Tvoja poloha</strong>
                <p className="text-sm text-gray-600 my-1">Lat: {position.lat.toFixed(5)}</p>
                <p className="text-sm text-gray-600 my-1">Lng: {position.lng.toFixed(5)}</p>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Quest markers */}
          {quests && quests.length > 0 && quests.map((quest, index) => {
          if (!quest.lat || !quest.lon) return null;

          const isActive = activeQuest && (
            String(activeQuest.place) === String(quest.place) &&
            Number(activeQuest.lat) === Number(quest.lat) &&
            Number(activeQuest.lon) === Number(quest.lon)
          );

          // determine indoor/outdoor from several possible flags on quest
          const isIndoor = Boolean(
            quest.is_indoor ?? quest.indoor ?? (quest.mode && String(quest.mode).toLowerCase() === 'indoor') ??
            (quest.type && String(quest.type).toLowerCase().includes('indoor'))
          );

          return (
            <Marker
              key={index}
              position={[quest.lat, quest.lon]}
              icon={isActive ? activeQuestIcon : getIconForType(quest.type || quest.category || quest.icon || '', isIndoor)}
            >
              <Popup>
                <div className="min-w-[200px] p-2">
                  <strong className="block text-base mb-1"><FaBullseye className="inline mr-2"/> {quest.place}</strong>
                  <p className="text-sm text-gray-600 my-1">{quest.goal}</p>
                  <button 
                    className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-3 rounded-lg font-medium transition-colors"
                    onClick={() => onQuestClick(quest)}
                  >
                    Zobraziť detail
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      
      {/* Native Leaflet zoom controls are used and styled via CSS/JS; custom buttons removed */}
    </div>
  );
};

export default Map;
