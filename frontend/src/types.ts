export interface Photo {
    id: number;
    file_path: string;
    latitude: number | null;
    longitude: number | null;
}

export interface Location {
    id: number;
    title: string;
    description: string | null;
    latitude: number;
    longitude: number;
    photos: Photo[];
}

export interface Trip {
    id: number;
    name: string;
    locations: Location[];
}