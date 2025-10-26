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
import exifr from 'exifr';

interface LocationFormData {
  title: string;
  description: string;
  file: File;
}

function App() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTripsLoading, setIsTripsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'group' | 'individual'>('group');
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [pendingLocationData, setPendingLocationData] = useState<LocationFormData | null>(null);
  const [center, setCenter] = useState<[number, number]>([139.6917, 35.6895]);

  const loadTrips = async () => {
    setIsTripsLoading(true);
    try {
      const data = await api.fetchTrips();
      setTrips(data);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast.error("旅行データの読み込みに失敗しました。");
    } finally {
      setIsTripsLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    loadTrips();
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      const allLocations = trips.flatMap(trip => trip.locations);
      const updatedLocation = allLocations.find(loc => loc.id === selectedLocation.id);
      setSelectedLocation(updatedLocation || null);
    }
  }, [trips]);

  const handleAddTrip = (name: string) => {
    toast.promise(
      api.addTrip(name), {
        loading: '旅行を追加中...',
        success: <b>追加しました！</b>,
        error: <b>追加に失敗しました</b>,
      }
    ).then(() => loadTrips());
  };

  const handleAddLocation = async (formData: LocationFormData) => {
    if (selectedTripId === null) return;
  
    try {
      const exifData = await exifr.parse(formData.file);
      if (exifData && exifData.latitude && exifData.longitude) {
        const fullFormData = {
          ...formData,
          latitude: exifData.latitude,
          longitude: exifData.longitude,
        };
        await toast.promise(api.addLocation(selectedTripId, fullFormData), {
          loading: '場所を追加中...',
          success: <b>追加しました！</b>,
          error: <b>追加に失敗しました</b>,
        });
        await loadTrips();
      } else {
        setIsPlacingPin(true);
        setPendingLocationData(formData);
        
        const selectedTrip = trips.find(trip => trip.id === selectedTripId);
        const locations = selectedTrip?.locations;
        
        if (locations && locations.length > 0) {
          const lastLocation = locations[locations.length - 1];
          setCenter([lastLocation.longitude, lastLocation.latitude]);
        } else {
          setCenter([139.6917, 35.6895]);
        }
  
        toast('写真に位置情報がありませんでした。\n地図上をクリックして場所を指定してください。', {
          icon: '📍',
          duration: 5000,
        });
      }
    } catch (error) {
        console.error("Failed to process location:", error)
        toast.error('写真の処理中にエラーが発生しました。');
    }
  };

  const handleMapClick = async ({ lat, lng }: { lat: number, lng: number }) => {
    if (isPlacingPin && pendingLocationData && selectedTripId) {
      const fullFormData = {
        ...pendingLocationData,
        latitude: lat,
        longitude: lng,
      };

      await toast.promise(api.addLocation(selectedTripId, fullFormData), {
        loading: '場所を追加中...',
        success: <b>追加しました！</b>,
        error: <b>追加に失敗しました</b>,
      });

      await loadTrips();
      setIsPlacingPin(false);
      setPendingLocationData(null);
      setCenter([lng, lat]);
    }
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
    }).then(() => loadTrips());
  };

  const handleAddPhotoToLocation = (locationId: number, file: File) => {
    if (!selectedTripId) return;
    toast.promise(api.addPhotoToLocation(locationId, file), {
      loading: '写真を追加中...',
      success: <b>写真を追加しました！</b>,
      error: <b>追加に失敗しました</b>,
    }).then(() => loadTrips());
  };

  const handlePositionReset = (photoId: number) => {
    if (!selectedTripId) return;
    toast.promise(api.resetLocationFromPhoto(photoId), {
      loading: '読み込み中...',
      success: <b>位置をリセットしました!</b>,
      error: <b>リセットに失敗しました</b>,
    }).then(() => {
      loadTrips();
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
      }).then(() => loadTrips());
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
        loadTrips();
        handleCloseModal();
      });
    }
  };

  const handleOpenModal = (location: Location) => { setSelectedLocation(location); setIsModalOpen(true); };
  const handleCloseModal = () => { setIsModalOpen(false); setSelectedLocation(null); };

  const allLocations = trips.flatMap(trip => trip.locations);

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
        <Map 
          locations={allLocations}
          onPinClick={handleOpenModal} 
          onPinDelete={handleDeleteLocation} 
          viewMode={viewMode} 
          onMapClick={handleMapClick} 
          isPlacingPin={isPlacingPin} 
          center={center}
        />
        
        {isTripsLoading ? (
          <div className='loading-overlay'>
            <p>場所を読み込み中...</p>
          </div>
        ) : (
          <>
            {!selectedTripId && (
              <div className='empty-state-overlay'>
                <h2>旅行を選択してください</h2>
                <p>サイドバーから旅行を選択すると、地図上にピンが表示されます</p>
              </div>
            )}
            {selectedTripId && allLocations.length === 0 && (
                <div className='empty-state-overlay'>
                  <p>この旅行にはまだ場所が登録されていません。</p>
                  <p>写真を追加して、最初の記録を作りましょう！</p>
                </div>
              )
            }
          </>
        )}
        {isPlacingPin && (
          <div className='placing-pin-overlay'>
            <h2>📍 地図をクリックして場所を決定</h2>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;