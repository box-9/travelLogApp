export interface Photo {
    id: number;
    file_path: string;
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