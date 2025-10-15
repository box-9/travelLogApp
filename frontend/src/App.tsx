import { useState, useEffect } from 'react';
import './App.css';
import Map from './components/Map';
import TripModal from './components/TripModal';
import TripList from './components/TripList';
import AddTripForm from './components/AddTripForm';
import AddLocationForm from './components/AddLocationForm';
import { Toaster, toast } from 'react-hot-toast';
import type { Location, Trip } from './types';
import * as api from './api';

function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'group' | 'individual'>('group');

  const loadTrips = () => {
    setIsTripsLoading(true);
    api.fetchTrips()
      .then(data => {
        setTrips(data);
        setIsTripsLoading(false);
      })
      .catch(error => {
        console.error("Error fetching trips:", error);
        setIsTripsLoading(false);
      });
  };

  const loadLocations = (tripId: number) => {
    setIsLocationsLoading(true);
    api.fetchLocations(tripId)
      .then(data => {
        setLocations(data);
        setIsLocationsLoading(false);
      })
      .catch(error => {
        console.error(`Error fetching locations for trip ${tripId}:`, error);
        setIsLocationsLoading(false);
      });
  };

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (selectedTripId !== null) {
      loadLocations(selectedTripId);
    } else {
      setLocations([]);
    }
  }, [selectedTripId]);

  useEffect(() => {
    if (selectedLocation) {
      const updatedLocation = locations.find(loc => loc.id === selectedLocation.id);
      if (updatedLocation) {
        setSelectedLocation(updatedLocation);
      }
    }
  }, [locations]);

  const handleAddTrip = (name: string) => {
    toast.promise(
      api.addTrip(name), {
        loading: '旅行を追加中...',
        success: <b>追加しました！</b>,
        error: <b>追加に失敗しました</b>,
      }
    ).then(() => loadTrips());
  };

  const handleAddLocation = (formData: { title: string, description: string, file: File }) => {
    if (selectedTripId === null) return;
    toast.promise(api.addLocation(selectedTripId, formData), {
      loading: '旅行を追加中...',
        success: <b>追加しました！</b>,
        error: <b>追加に失敗しました</b>,
    }).then(() => loadLocations(selectedTripId));
  };

  const handleUpdateTrip = (tripId: number, newName: string) => {
    toast.promise(api.updateTrip(tripId, newName), {
      loading: '保存中...',
      success: <b>保存しました！</b>,
      error: <b>保存に失敗しました</b>,
    }).then(() => loadTrips());
  };

  const handleUpdateLocation = (locationId: number, updateData: Partial<Location>) => {
    if (!selectedTripId) return;
    toast.promise(api.updateLocation(locationId, updateData), {
      loading: '保存中...',
      success: <b>保存しました！</b>,
      error: <b>保存に失敗しました</b>,
    }).then(() => loadLocations(selectedTripId));
  };

  const handleAddPhotoToLocation = (locationId: number, file: File) => {
    if (!selectedTripId) return;
    toast.promise(api.addPhotoToLocation(locationId, file), {
      loading: '写真を追加中...',
      success: <b>写真を追加しました！</b>,
      error: <b>追加に失敗しました</b>,
    }).then(() => loadLocations(selectedTripId));
  };

  const handlePositionReset = (photoId: number) => {
    if (!selectedTripId) return;
    toast.promise(api.resetLocationFromPhoto(photoId), {
      loading: '読み込み中...',
      success: <b>位置をリセットしました!</b>,
      error: <b>リセットに失敗しました</b>,
    }).then(() => {
      loadLocations(selectedTripId);
      handleCloseModal();
    })
  }

  const handleDeleteTrip = (tripId: number, tripName: string) => {
    if (window.confirm(`本当に「${tripName}」を削除しますか？`)) {
      toast.promise(api.deleteTrip(tripId), {
        loading: '削除中...',
        success: <b>削除しました!</b>,
        error: <b>削除に失敗しました</b>,
      }).then(() => {
        if (selectedTripId === tripId) {
          setSelectedTripId(null);
        }
        loadTrips();
      });
    }
  };

  const handleDeleteLocation = (locationId: number, locationTitle: string) => {
    if (!selectedTripId) return;
    if (window.confirm(`本当に「${locationTitle}」を削除しますか？`)) {
      toast.promise(api.deleteLocation(locationId), {
        loading: '削除中...',
        success: <b>削除しました!</b>,
        error: <b>削除に失敗しました</b>,
      }).then(() => loadLocations(selectedTripId));
    }
  };

  const handleDeletePhoto = (photoId: number) => {
    if (!selectedTripId) return;
    if (window.confirm("本当にこの写真を削除しますか？")) {
      toast.promise(api.deletePhoto(photoId), {
        loading: '削除中...',
        success: <b>削除しました！</b>,
        error: <b>削除に失敗しました。</b>,
      }).then(() => {
        loadLocations(selectedTripId!);
        handleCloseModal();
      });
    }
  };

  const handleOpenModal = (location: Location) => { setSelectedLocation(location); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedLocation(null); };

  return (
    <div className="container">
      <Toaster position='top-center' reverseOrder={false} />
      <TripModal isOpen={isModalOpen} onRequestClose={handleCloseModal} location={selectedLocation} onLocationUpdate={handleUpdateLocation} onPhotoDelete={handleDeletePhoto} onPositionReset={handlePositionReset} onPhotoAdd={handleAddPhotoToLocation} />
      <aside className="sidebar">
        {isTripsLoading ? (
          <p>旅行リストを読み込み中...</p>
        ) : (
          <>
            {trips.length > 0 ? (
              <TripList trips={trips} selectedTripId={selectedTripId} onTripSelect={setSelectedTripId} onTripUpdate={handleUpdateTrip} onTripDelete={handleDeleteTrip} />
            ) : (
              <div className='empty-state'>
                <p>旅行がありません</p>
                <p>最初の旅行を追加しましょう！</p>
              </div>
            )}
          </>
          )}
        <hr />

        <div className='view-toggle'>
          <span>表示モード</span>
          <button onClick={() => setViewMode('group')} className={viewMode === 'group' ? 'active' : '' }>グループ</button>
          <button onClick={() => setViewMode('individual')} className={viewMode === 'individual' ? 'active' : '' }>個別</button>
        </div>

        <hr />
        <AddTripForm onTripAdd={handleAddTrip} />
        <hr />
        {selectedTripId && <AddLocationForm onLocationAdd={handleAddLocation} />}
      </aside>
      <main className="main-content">
        <Map locations={locations} onPinClick={handleOpenModal} onPinDelete={handleDeleteLocation} viewMode={viewMode} />
        
        {isLocationsLoading ? (
          <div className='loading-overlay'>
            <p>場所を読み込み中...</p>
          </div>
        ) : (
          <>
            {!isLocationsLoading && !selectedTripId && (
              <div className='empty-state-overlay'>
                <h2>旅行を選択してください</h2>
                <p>サイドバーから旅行を選択すると、地図上にピンが表示されます</p>
              </div>
            )}
            {!isLocationsLoading && selectedTripId && locations.length === 0 && (
                <div className='empty-state-overlay'>
                  <p>この旅行にはまだ場所が登録されていません。</p>
                  <p>写真を追加して、最初の記録を作りましょう！</p>
                </div>
              )
            }
          </>
        )}
      </main>
    </div>
  );
}

export default App;