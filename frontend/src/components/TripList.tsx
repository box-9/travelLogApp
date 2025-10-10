import { useState } from "react";
import type { Trip } from "../types";

interface TripListProps {
    trips: Trip[]
    selectedTripId: number | null;
    onTripSelect: (id: number) => void;
    onTripDelete: (id: number, name: string) => void;
    onTripUpdate: (id: number, newName: string) => void;
}

const TripList = ({ trips, selectedTripId, onTripSelect, onTripDelete, onTripUpdate }: TripListProps) => {
    const [editingTripId, setEditingTripId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleEditClick = (trip: Trip) => {
        setEditingTripId(trip.id);
        setEditingName(trip.name);
    }

    const handleSaveClick = (id: number) => {
        onTripUpdate(id, editingName);
        setEditingTripId(null);
        setEditingName('');
    }

    const handleCancelClick = () => {
        setEditingTripId(null);
        setEditingName('');
    }

    return (
        <div className="trip-list">
            <h2>Trips</h2>
            <ul>
                {trips.map((trip) => (
                    <li key={trip.id} className={trip.id === selectedTripId ? 'selected' : ''}>
                        {editingTripId === trip.id ? (
                            <div className="edit-mode">
                                <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                autoFocus
                            />
                            <button onClick={() => handleSaveClick(trip.id)}>保存</button>
                            <button onClick={handleCancelClick}>中止</button>
                            </div>
                            ) : (
                                <>
                                    <span onClick={() => onTripSelect(trip.id)} className="trip-name">
                                        {trip.name}
                                    </span>
                                    <div className="trip-buttons">
                                        <button onClick={() => handleEditClick(trip)} className="edit-btn">編集</button>
                                        <button onClick={() => onTripDelete(trip.id, trip.name)} className = "delete-btn">削除</button>
                                    </div>
                                </>
                            )
                        }
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TripList;