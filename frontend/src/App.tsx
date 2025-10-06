import { useState, useEffect } from 'react';
import './App.css';
import Map from './components/Map';
import TripModal from './components/TripModal';
import TripList from './components/TripList';
import AddTripForm from './components/AddTripForm';
import AddLocationForm from './components/AddLocationForm';

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
interface Trip {
  id: number;
  name: string;
  locations: Location[];
}

function App() {
  console.log("App component is rendering!");

  const [trips, setTrips] = useState<Trip[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const API_URL = 'http://127.0.0.1:8000';

  const fetchLocations = (tripId: number) => {
    console.log(`Fetching locations for tripId: ${tripId}`);
    fetch(`${API_URL}/trips/${tripId}/locations/`)
      .then(response => response.json())
      .then((data: Location[]) => {
        console.log("Fetched locations data:", data);
        setLocations(data);
      })
      .catch(error => console.error(`Error fetching locations for trip ${tripId}:`, error));
  };

  const fetchTrips = () => {
    console.log("Fetching trips...");
    fetch(`${API_URL}/trips/`)
      .then(response => response.json())
      .then((data: Trip[]) => {
        console.log("Fetched trips data:", data);
        setTrips(data);
      })
      .catch(error => console.error("Error fetching trips:", error));
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  useEffect(() => {
    if (selectedTripId !== null) {
      fetchLocations(selectedTripId);
    } else {
      setLocations([]);
    }
  }, [selectedTripId]);

  const handleAddTrip = (name: string) => {
    console.log("Adding trip:", name);
    fetch(`${API_URL}/trips/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    .then(() => fetchTrips());
  };

  const handleAddLocation = (formData: { title: string, description: string, file: File }) => {
    if (selectedTripId === null) return;

    const locationData = {
      title: formData.title, 
      description: formData.description,
      latitude: 0,
      longitude: 0,
    };

    fetch(`${API_URL}/trips/${selectedTripId}/locations/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(locationData) })
    .then(response => response.json())
    .then((newLocation: Location) => {
      const photoFormData = new FormData();
      photoFormData.append("file", formData.file);

      return fetch(`${API_URL}/locations/${newLocation.id}/photos/`, {
        method: `POST`,
        body: photoFormData,
      });
    })
    .then(response => {
      if (response.ok) {
        fetchLocations(selectedTripId);
      } else { 
        console.error("Failed to add location"); 
      }
    })
    .catch(error => console.error("Error adding location:", error));
  };

  const handleUpdateTrip = (tripId: number, newName: string) => {
    fetch(`${API_URL}/trips/${tripId}`, {
      method: `PUT`,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName }),
    })
    .then(response => {
      if (response.ok) {
        fetchTrips();
      } else {
        console.error("Failed to update trip");
      }
    })
    .catch(error => console.error("Error updating trip:", error));
  };

  const handleUpdateLocation = (locationId: number, updateData: { title: string, description: string}) => {
    if (!selectedTripId) return;

    fetch(`${API_URL}/locations/${locationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    })
    .then(response => {
      if (response.ok) {
        fetchLocations(selectedTripId);
      } else {
        console.error("Failed to update location");
      }
    })
    .catch(error => console.error("Error updating location:", error));
  };

  const handleDeleteTrip = (tripId: number, tripName: string) => {
    if (window.confirm(`本当に「${tripName}」を削除しますか？`)) {
      fetch(`${API_URL}/trips/${tripId}`, {
        method: `DELETE`,
      })
      .then(response => {
        if (response.ok) {
          fetchTrips();
          if (selectedTripId == tripId) {
            setSelectedTripId(null);
          }
        } else {
          console.error("Failed to delete trip");
        }
      })
      .catch(error => console.error("Error deleting trip", error));
    }
  };

  const handleDeleteLocation = (locationId: number, locationTitle: string) => {
    if (window.confirm(`本当に「${locationTitle}」を削除しますか？`)) {
      fetch(`${API_URL}/locations/${locationId}`, {
        method: `DELETE`,
      })
      .then(response => {
        if (response.ok && selectedTripId) {
          fetchLocations(selectedTripId);
        } else {
          console.error("Failed to delete location");
        }
      })
      .catch(error => console.error("Error deleteing location", error));
    }
  };

  const handleDeletePhoto = (photoId: number) => {
    if (!selectedTripId) return;

    if (window.confirm("本当にこの写真を削除しますか？")) {
      fetch(`${API_URL}/photos/${photoId}`, {
        method: 'DELETE',
      })
      .then(response => {
        if (response.ok) {
          fetchLocations(selectedTripId);
          handleCloseModal();
        } else {
          console.error("Failed to delete photo");
        }
      })
      .catch(error => console.error("Error deleting photo:", error));
    }
  };

  const handleOpenModal = (location: Location) => { setSelectedLocation(location); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedLocation(null); };

  return (
    <div className="container">
      <TripModal isOpen={isModalOpen} onRequestClose={handleCloseModal} location={selectedLocation} onLocationUpdate={handleUpdateLocation} onPhotoDelete={handleDeletePhoto}/>
      <aside className="sidebar">
        <TripList trips={trips} selectedTripId={selectedTripId} onTripSelect={setSelectedTripId} onTripUpdate={handleUpdateTrip} onTripDelete={handleDeleteTrip} />
        <hr />
        <AddTripForm onTripAdd={handleAddTrip} />
        <hr /> 
        {selectedTripId && <AddLocationForm onLocationAdd={handleAddLocation} />}
      </aside>
      <main className="main-content">
        <Map locations={locations} onPinClick={handleOpenModal} onPinDelete={handleDeleteLocation} />
      </main>
    </div>
  );
}

export default App;