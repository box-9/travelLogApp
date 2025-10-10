import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Location } from '../types';

interface MapProps {
    locations: Location[];
    onPinClick: (location: Location) => void;
    onPinDelete: (locationId: number, locationTitle: string) => void;
}

const Map = ({ locations, onPinClick, onPinDelete }: MapProps) => {
    console.log("Map component is rendering with locations:", locations);

    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    const propsRef = useRef({ locations, onPinClick, onPinDelete });

    useEffect(() => {
        propsRef.current = { locations, onPinClick, onPinDelete };
    });

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

        map.current.on('load', () => {
            if (!map.current) return;
            
            map.current.addSource('locations', {
                type: 'geojson', 
                data: { type: 'FeatureCollection', features: [] },
                cluster: true,
                clusterMaxZoom: 14,
                clusterRadius: 50,
            });

            map.current.addLayer({
                id: 'clusters',
                type: 'circle',
                source: 'locations',
                filter: ['has', 'point_count'],
                paint: {
                    'circle-color' : [
                        'step',
                        ['get', 'point_count'],
                        '#51bbd6',
                        10,
                        '#f1f075',
                        30,
                        '#f28cb1'
                    ],
                    'circle-radius': [
                        'step',
                        ['get', 'point_count'],
                        20,
                        10,
                        30,
                        30,
                        40
                    ]
                }
            });

            map.current.addLayer({
                id: 'cluster-count',
                type: 'symbol',
                source: 'locations',
                filter: ['has', 'point_count'],
                layout: {
                    'text-field': '{point_count_abbreviated}',
                    'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
                    'text-size': 12
                }
            });

            map.current.addLayer({
                id: 'unclustered-point',
                type: 'circle',
                source: 'locations',
                filter: ['!', ['has', 'point_count']],
                paint: {
                    'circle-color': '#11b4da',
                    'circle-radius': 6,
                    'circle-stroke-width': 2,
                    'circle-stroke-color': '#fff'
                }
            });

            map.current.on('click', 'clusters', (e) => {
                const features = map.current?.queryRenderedFeatures(e.point, { layers: ['clusters'] });
                if (!features || features.length === 0) return;
                const clusterId = features[0].properties?.cluster_id;
                const source = map.current?.getSource('locations') as mapboxgl.GeoJSONSource;
                source.getClusterExpansionZoom(clusterId, (err, zoom) => {
                    if (err || zoom === null || zoom === undefined) return;
                    map.current?.easeTo({
                        center: (features[0].geometry as any).coordinates,
                        zoom: zoom
                    });
                });
            });

            map.current.on('click', 'unclustered-point', (e) => {
                if (!map.current || !e.features || e.features.length === 0) return;

                const coordinates = (e.features[0].geometry as any).coordinates.slice();
                const properties = e.features[0].properties;

                const popupContent = `<div><h4>${properties?.title}</h4><button id="popup-details-btn-${properties?.id}" class="popup-btn">詳細を見る</button><button id="popup-delete-btn-${properties?.id}" class="popup-btn">削除</button></div>`;

                new mapboxgl.Popup()
                    .setLngLat(coordinates)
                    .setHTML(popupContent)
                    .addTo(map.current!);

                document.getElementById(`popup-details-btn-${properties?.id}`)?.addEventListener('click', () => {
                    const clickedLocationId = properties?.id;
                    const fullLocationData = propsRef.current.locations.find(loc => loc.id === clickedLocationId);
                    if (fullLocationData) {
                        propsRef.current.onPinClick(fullLocationData);
                    }
                });

                document.getElementById(`popup-delete-btn-${properties?.id}`)?.addEventListener('click', () => {
                    if (properties?.id && properties?.title) {
                        propsRef.current.onPinDelete(properties.id, properties.title);
                    }
                });
            });

            map.current.on('mouseenter', 'clusters', () => { 
                if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'clusters', () => { 
                if (map.current) map.current.getCanvas().style.cursor = '';
            });

            map.current.on('mouseenter', 'unclustered-point', () => {
                if (map.current) map.current.getCanvas().style.cursor = 'pointer';
            });

            map.current.on('mouseleave', 'unclustered-point', () => {
                if (map.current) map.current.getCanvas().style.cursor = '';
            });

            setIsMapLoaded(true);
        });
    }, []);

    useEffect(() => {
        if (!isMapLoaded || !map.current || !map.current.getSource('locations')) return;

        const features = locations.map(location => ({
            type: 'Feature' as const,
            properties: location,
            geometry: {
                type: 'Point' as const,
                coordinates: [location.longitude, location.latitude]
            }
        }));
        
        const geojsonData = {
            type: 'FeatureCollection' as const,
            features: features
        };
        
        const source = map.current.getSource('locations') as mapboxgl.GeoJSONSource;
        source.setData(geojsonData);

    }, [locations, isMapLoaded]);

    return <div ref={mapContainer} className="map-container" />;
};

export default Map;