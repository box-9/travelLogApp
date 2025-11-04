import { useEffect, useRef, useState } from 'react';
import ReactModal from 'react-modal';
import type { Location } from '../types';
import LocationEditMap from './LocationEditMap';

interface TripModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    location: Location | null;
    onLocationUpdate: (locationId: number, updateData: Partial<Location>) => void;
    onPhotoDelete: (photoId: number) => void;
    onPositionReset: (photoId: number) => void;
    onPhotoAdd: (locationId: number, file: File) => void;
}

const API_URL = 'http://127.0.0.1:8000';

const TripModal = ({ isOpen, onRequestClose, location, onLocationUpdate, onPhotoDelete, onPositionReset, onPhotoAdd }: TripModalProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isPositionEditing, setIsPositionEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [position, setPosition] = useState({ lat: 0, lng: 0 });

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (location) {
            setTitle(location.title);
            setDescription(location.description || '');
        }
        if (!isOpen) {
            setIsEditing(false);
            setIsPositionEditing(false);
        }
    }, [location, isOpen]);
    
    if (!location) {
        return null;
    }

    const handleSave = () => {
        onLocationUpdate(location.id, { title, description });
        setIsEditing(false);
    }

    const handlePositionSave = () => {
        onLocationUpdate(location.id, { latitude: position.lat, longitude: position.lng });
        setIsPositionEditing(false);
    }

    const handleCancel = () => {
        setTitle(location.title);
        setDescription(location.description || '');
        setIsEditing(false);
    };

    const handlePositionReset = () => {
        if (location.photos && location.photos.length > 0) {
            const firstPhotoId = location.photos[0].id;
            onPositionReset(firstPhotoId);
        } else {
            alert("この場所にはジオタグを読み込むための写真がありません");
        }
    }

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && location) {
            onPhotoAdd(location.id, file);
        }  
    };

    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onRequestClose}
            contentLabel="Location Details"
            style={{ overlay: {zIndex: 1000}}}
        >
            {isEditing ? (
                <div>
                    <input type='text' value={title} onChange={(e) => setTitle(e.target.value)} style={{ fontSize: '1.5rem', width: '95%' }}/>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '95%', height: '100px', marginTop: '1rem' }}/>
                    <div style={{ marginTop: '1rem' }}>
                        <button onClick={handleSave}>保存</button>
                        <button onClick={handleCancel} style={{ marginLeft: '0.5ref' }}>キャンセル</button>
                    </div>
                </div>
            ) : isPositionEditing ? (
                 <div>
                    <h3>位置を編集</h3>
                    <p>地図上のピンをドラッグして位置を調整してください。</p>
                    <LocationEditMap 
                        initialLat={location.latitude} 
                        initialLng={location.longitude}
                        onPositionChange={(lng, lat) => setPosition({ lng, lat })}
                    />
                    <div style={{ marginTop: '1rem' }}>
                        <button onClick={handlePositionSave}>この位置に保存</button>
                        <button onClick={handlePositionReset} style={{ marginLeft: '0.5rem' }}>リセット</button>
                        <button onClick={() => setIsPositionEditing(false)} style={{ marginLeft: '0.5rem' }}>キャンセル</button>
                    </div>
                </div>
            ) : (
                <div>
                    <h2>{location.title}</h2>
                    <p>{location.description}</p>
                    <div>
                        <small>緯度: {location.latitude}, 経度: {location.longitude}</small>
                    </div>
                    <hr />
                    <h3>写真</h3>
                    
                    <input 
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        style={{ display: 'none' }}
                        accept="image/jpeg, image/png"
                    />
                    <button onClick={() => fileInputRef.current?.click()} style={{ marginBottom: '1rem' }}>
                        写真を追加
                    </button>
                    
                    <div className='photo-gallery'>
                        {location.photos && location.photos.map(photo => (
                            <div key={photo.id} className='photo-container'>
                                <img
                                    key={photo.id}
                                    src={`${API_URL}/${photo.file_path}`}
                                    alt="Travel"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover', marginRight: '10px' }}
                                />
                                {photo.tags && photo.tags.length > 0 && (
                                    <div className="photo-tags">
                                        {photo.tags.map(tag => (
                                            <span key={tag} className="photo-tag">#{tag}</span>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={() => onPhotoDelete(photo.id)}
                                    className='photo-delete-btn'
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                        {(!location.photos || location.photos.length === 0) && <p>この場所には写真がありません</p>}
                    </div>
                    <div style={{ marginTop: '1.5rem' }}>
                        <button onClick={() => setIsEditing(true)}>テキストを編集</button>
                        <button onClick={() => setIsPositionEditing(true)} style={{ marginLeft: '0.5rem' }}>位置を編集</button>
                        <button onClick={onRequestClose} style={{ marginLeft: '0.5rem' }}>閉じる</button>
                    </div>
                </div>
            )}
        </ReactModal>
    );
};

export default TripModal;