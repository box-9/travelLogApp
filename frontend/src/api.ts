import type { Trip, Location } from './types';

const API_URL = 'http://127.0.0.1:8000';

// --- Trip API ---

export const fetchTrips = async (): Promise<Trip[]> => {
  const response = await fetch(`${API_URL}/trips/`);
  if (!response.ok) throw new Error('Failed to fetch trips');
  return response.json();
};

export const addTrip = async (name: string): Promise<Trip> => {
  const response = await fetch(`${API_URL}/trips/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!response.ok) throw new Error('Failed to add trip');
  return response.json();
};

export const updateTrip = async (tripId: number, newName: string): Promise<Trip> => {
  const response = await fetch(`${API_URL}/trips/${tripId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName }),
  });
  if (!response.ok) throw new Error('Failed to update trip');
  return response.json();
};

export const deleteTrip = async (tripId: number): Promise<Response> => {
  const response = await fetch(`${API_URL}/trips/${tripId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete trip');
  return response;
};

// --- Location API ---

export const fetchLocations = async (tripId: number): Promise<Location[]> => {
  const response = await fetch(`${API_URL}/trips/${tripId}/locations/`);
  if (!response.ok) throw new Error('Failed to fetch locations');
  return response.json();
};

export const addLocation = async (tripId: number, formData: { title: string, description: string, file: File }): Promise<Response> => {
  const locationData = {
    title: formData.title,
    description: formData.description,
    latitude: 0,
    longitude: 0,
  };
  const locResponse = await fetch(`${API_URL}/trips/${tripId}/locations/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(locationData),
  });
  if (!locResponse.ok) throw new Error('Failed to create location');
  const newLocation: Location = await locResponse.json();

  const photoFormData = new FormData();
  photoFormData.append("file", formData.file);
  const photoResponse = await fetch(`${API_URL}/locations/${newLocation.id}/photos/`, {
    method: 'POST',
    body: photoFormData,
  });
  if (!photoResponse.ok) throw new Error('Failed to upload photo');
  return photoResponse;
};

export const updateLocation = async (locationId: number, updateData: Partial<Location>): Promise<Location> => {
  const response = await fetch(`${API_URL}/locations/${locationId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updateData),
  });
  if (!response.ok) throw new Error('Failed to update location');
  return response.json();
};

export const addPhotoToLocation = async (locationId: number, file: File): Promise<Response> => {
    const photodataFormData = new FormData();
    photodataFormData.append("file", file);

    const response = await fetch(`${API_URL}/locations/${locationId}/photos/`, {
        method: 'POST',
        body: photodataFormData,
    });
    if (!response.ok) throw new Error('Failed to add photo to location');
    return response;
};

export const deleteLocation = async (locationId: number): Promise<Response> => {
    const response = await fetch(`${API_URL}/locations/${locationId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete location');
    return response;
};

export const resetLocationFromPhoto = async (photoId: number): Promise<Response> => {
    const response = await fetch(`${API_URL}/photos/${photoId}/reset-location`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to reset location from photo');
    return response.json();
}


// --- Photo API ---

export const deletePhoto = async (photoId: number): Promise<Response> => {
    const response = await fetch(`${API_URL}/photos/${photoId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete photo');
    return response;
};