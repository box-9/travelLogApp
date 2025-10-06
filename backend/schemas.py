from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date

class PhotoBase(BaseModel):
    file_path: str

class PhotoCreate(PhotoBase):
    pass

class Photo(PhotoCreate):
    id: int
    location_id: int

    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    title: str
    description: Optional[str] = None
    latitude: float
    longitude: float

class LocationCreate(LocationBase):
    pass

class Location(LocationBase):
    id: int
    trip_id: int
    photos: List[Photo] = []

    class Config:
        from_attributes = True

class TripBase(BaseModel):
    name: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class TripCreate(TripBase):
    pass

class Trip(TripCreate):
    id: int
    locations: list[Location] = []

    class Config:
        from_attributes = True

class LocationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None