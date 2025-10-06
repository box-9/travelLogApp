import { useEffect, useState } from 'react';
import ReactModal from 'react-modal';

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

interface TripModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    location: Location | null;
    onLocationUpdate: (locationId: number, updateData: { title: string, description: string }) => void;
    onPhotoDelete: (photoId: number) => void;
}

const API_URL = 'http://127.0.0.1:8000';

const TripModal = ({ isOpen, onRequestClose, location, onLocationUpdate, onPhotoDelete }: TripModalProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (location) {
            setTitle(location.title);
            setDescription(location.description || '');
        }
    }, [location]);
    
    if (!location) {
        return null;
    }

    const handleSave = () => {
        onLocationUpdate(location.id, { title, description });
        setIsEditing(false);
        onRequestClose();
    }

    const handleCancel = () => {
        setTitle(location.title);
        setDescription(location.description || '');
        setIsEditing(false);
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
            ) : (
                <div>
                    <h2>{location.title}</h2>
                    <p>{location.description}</p>
                    <div>
                        <small>緯度: {location.latitude}, 経度: {location.longitude}</small>
                    </div>
                    <hr />
                    <h3>写真</h3>
                    <div className='photo-gallery'>
                        {location.photos && location.photos.map(photo => (
                            <div key={photo.id} className='photo-container'>
                                <img
                                    key={photo.id}
                                    src={`${API_URL}/${photo.file_path}`}
                                    alt="Travel"
                                    style={{ width: '150px', height: '150px', objectFit: 'cover', marginRight: '10px' }}
                                />
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
                        <button onClick={() => setIsEditing(true)}>編集</button>
                        <button onClick={onRequestClose} style={{ marginLeft: '0.5rem' }}>閉じる</button>
                    </div>
                </div>
            )}
        </ReactModal>
    );
};

export default TripModal;