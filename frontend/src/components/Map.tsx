import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Location } from '../types';

interface MapProps {
    locations: Location[];
    onPinClick: (location: Location) => void;
    onPinDelete: (locationId: number, locationTitle: string) => void;
    viewMode: 'group' | 'individual';
    onMapClick: (coords: { lat: number, lng: number }) => void;
    isPlacingPin: boolean;
    center: [number, number];
}

const Map = ({ locations, onPinClick, onPinDelete, viewMode, onMapClick, isPlacingPin, center }: MapProps) => {
    console.log("Map component is rendering with locations:", locations);

    const [isMapLoaded, setIsMapLoaded] = useState(false);
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    const propsRef = useRef({ locations, onPinClick, onPinDelete, viewMode, onMapClick, isPlacingPin});

    useEffect(() => {
        propsRef.current = { locations, onPinClick, onPinDelete, viewMode, onMapClick, isPlacingPin };
    });

    useEffect(() => {
        if (map.current || !mapContainer.current) return;

        mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        console.log("Mapbox Token being used:", mapboxgl.accessToken ? "Token found" : "Token NOT found");

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: center,
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

            map.current.on('click', (e) => {
                const features = map.current?.queryRenderedFeatures(e.point,  {
                    layers: ['clusters', 'unclustered-point']
                });

                if (propsRef.current.isPlacingPin && (!features || features.length === 0)) {
                    propsRef.current.onMapClick(e.lngLat);
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
                const properties = e.features[0].properties;

                if (propsRef.current.viewMode === 'group') {
                    const coordinates = (e.features![0].geometry as any).coordinates.slice();
                    const popupContent = `<div><h4>${properties?.title}</h4><div class="popup-buttons"><button id="popup-details-btn-${properties?.id}" class="popup-btn">詳細</button><button id="popup-delete-btn-${properties?.id}" class="popup-btn popup-delete-btn">削除</button></div></div>`;
                    new mapboxgl.Popup({ offset: 25 }).setLngLat(coordinates).setHTML(popupContent).addTo(map.current!);
                    
                    document.getElementById(`popup-details-btn-${properties?.id}`)?.addEventListener('click', () => {
                        const fullLocationData = propsRef.current.locations.find(loc => loc.id === properties?.id);
                        if (fullLocationData) propsRef.current.onPinClick(fullLocationData);
                    });
                    document.getElementById(`popup-delete-btn-${properties?.id}`)?.addEventListener('click', () => {
                        if (properties?.id && properties?.title) {
                            propsRef.current.onPinDelete(properties.id, properties.title);
                        }
                    });
                } else if (propsRef.current.viewMode === 'individual') {
                    const fullLocationData = propsRef.current.locations.find(loc => loc.id === properties?.parentLocationId);
                    if (fullLocationData) propsRef.current.onPinClick(fullLocationData);
                }
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
    }, [center]);

    useEffect(() => {
        if (!map.current) return;
        if (isPlacingPin) {
            map.current.flyTo({ center: center, zoom: 12 });
        }
        map.current.getCanvas().style.cursor = isPlacingPin ? 'crosshair': '';  
    }, [isPlacingPin, center]);

    useEffect(() => {
        if (!isMapLoaded || !map.current || !map.current.getSource('locations')) return;

        let features: any[] = [];
        const currentLocations = propsRef.current.locations;

        if (viewMode === 'group') {
            features = currentLocations.map(location => ({
                type: 'Feature' as const,
                properties: location,
                geometry: {
                    type: 'Point' as const,
                    coordinates: [location.longitude, location.latitude]
                }
            }));
        } else {
            currentLocations.forEach(location => {
                location.photos.forEach(photo => {
                    if (photo.latitude && photo.longitude) {
                        features.push({
                            type: 'Feature' as const,
                            properties: {
                                ...photo,
                                parentLocationId: location.id,
                                parentLocationTitle: location.title,
                            },
                            geometry: {
                                type: 'Point' as const,
                                coordinates: [photo.longitude, photo.latitude]
                            }
                        });
                    }
                });
            });
        }
        
        const geojsonData = {
            type: 'FeatureCollection' as const,
            features: features
        };
        
        const source = map.current.getSource('locations') as mapboxgl.GeoJSONSource;
        source.setData(geojsonData);

    }, [locations, isMapLoaded, viewMode]);

    return <div ref={mapContainer} className={`map-container ${isPlacingPin ? 'placing-pin' : ''}`} />;
};

export default Map;