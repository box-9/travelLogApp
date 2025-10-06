import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Photo {
    id: number;
    file_path: string;
}

interface Location {
    id: number;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    photos: Photo[];
}
interface MapProps {
    locations: Location[];
    onPinClick: (location: Location) => void;
    onPinDelete: (locationId: number, locationTitle: string) => void;
}

const Map = ({ locations, onPinClick, onPinDelete }: MapProps) => {
    console.log("Map component is rendering with locations:", locations);

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const markers = useRef<mapboxgl.Marker[]>([]);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        console.log("Mapbox Token being used:", mapboxgl.accessToken ? "Token found" : "Token NOT found");

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [139.7671, 35.6812],
            zoom: 5,
        });
    }, []);

    useEffect(() => {
        if (!map.current) return;
        console.log("Updating markers for locations:", locations);

        markers.current.forEach(marker => marker.remove());
        markers.current = [];

        locations.forEach(location => {
            const popupContent = `<div><h4>${location.title}</h4><button id="popup-details-btn-${location.id}" class="popup-btn">詳細を見る</button><button id="popup-delete-btn-${location.id}" class="popup-btn">削除</button></div>`;
            const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupContent);
            
            const marker = new mapboxgl.Marker()
                .setLngLat([location.longitude, location.latitude])
                .setPopup(popup)
                .addTo(map.current!);
            
            markers.current.push(marker);

            popup.on('open', () => {
                document.getElementById(`popup-details-btn-${location.id}`)?.addEventListener('click', () => {
                    onPinClick(location);
                });

                document.getElementById(`popup-delete-btn-${location.id}`)?.addEventListener('click', () => {
                    onPinDelete(location.id, location.title);
                });
            });
        });
    }, [locations, onPinClick, onPinDelete]);

    return <div ref={mapContainer} className="map-container" />;
};

export default Map;