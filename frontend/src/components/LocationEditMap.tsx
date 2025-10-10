import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface LocationEditMapProps {
    initialLat: number;
    initialLng: number;
    onPositionChange: (lng: number, lat: number) => void;
}

const LocationEditMap = ({ initialLat, initialLng, onPositionChange }: LocationEditMapProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const marker = useRef<mapboxgl.Marker | null>(null);

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [initialLng, initialLat],
            zoom: 15,
        });

        marker.current = new mapboxgl.Marker({draggable: true})
        .setLngLat([initialLng, initialLat])
        .addTo(map.current);

        marker.current.on('dragend', () => {
            if (marker.current) {
                const lngLat = marker.current.getLngLat();
                onPositionChange(lngLat.lng, lngLat.lat);
            }
        });

        return () => {
            map.current?.remove();
        };
    }, []);

    useEffect(() => {
        if (map.current) {
            map.current.setCenter([initialLng, initialLat]);
        }
        if (marker.current) {
            marker.current.setLngLat([initialLng, initialLat]);
        }
    }, [initialLat, initialLng]);

    return <div ref={mapContainer} style={{ width: '100%', height: '300px'}} />
}

export default LocationEditMap;