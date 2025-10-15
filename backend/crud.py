from sqlalchemy.orm import Session, joinedload, selectinload
from . import models, schemas
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import os

from .config import settings

IMAGEDIR = settings.image_dir

def _delete_photo_file(photo: models.Photo):
    if photo and photo.file_path:
        file_name = os.path.basename(photo.file_path)
        file_path = os.path.join(IMAGEDIR, file_name)
        if os.path.exists(file_path):
            os.remove(file_path)

def get_trip(db: Session, trip_id: int):
    return db.query(models.Trip).options(selectinload(models.Trip.locations).selectinload(models.Location.photos)).filter(models.Trip.id == trip_id).first()

def get_trips(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Trip).options(selectinload(models.Trip.locations).selectinload(models.Location.photos)).order_by(models.Trip.start_date.desc()).offset(skip).limit(limit).all()

def create_trip(db: Session, trip: schemas.TripCreate):
    db_trip = models.Trip(**trip.model_dump())
    db.add(db_trip)
    db.commit()
    db.refresh(db_trip)
    return db_trip

def delete_trip(db: Session, trip_id: int):
    db_trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if db_trip:
        for location in db_trip.locations:
            for photo in location.photos:
                _delete_photo_file(photo)
        db.delete(db_trip)
        db.commit()
    return db_trip

def get_locations_by_trip(db: Session, trip_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Location).options(joinedload(models.Location.photos)).filter(models.Location.trip_id == trip_id).offset(skip).limit(limit).all()

def create_trip_location(db: Session, location: schemas.LocationCreate, trip_id: int):
    db_location = models.Location(**location.model_dump(), trip_id=trip_id)
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

def delete_location(db: Session, location_id: int):
    db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if db_location:
        for photo in db_location.photos:
            _delete_photo_file(photo)
        db.delete(db_location)
        db.commit()
    return db_location

def get_decimal_from_dms(dms, ref):
    degrees = dms[0]
    minutes = dms[1] / 60.0
    seconds = dms[2] / 3600.0

    decimal = degrees + minutes + seconds
    if ref in ['S', 'W']:
        decimal = -decimal
    return decimal

def get_geotag_from_image(image_path: str):
    try: 
        image = Image.open(image_path)
        exif_data = image._getexif()
        if not exif_data:
            return None
        
        geotagging = {}
        for (idx, tag) in TAGS.items():
            if tag == 'GPSInfo':
                if idx in exif_data:
                    for (key, val) in GPSTAGS.items():
                        if key in exif_data[idx]:
                            geotagging[val] = exif_data[idx][key]
        
        if 'GPSLatitude' in geotagging and 'GPSLongitude' in geotagging:
            lat_dms = geotagging['GPSLatitude']
            lat_ref = geotagging['GPSLatitudeRef']
            lon_dms = geotagging['GPSLongitude']
            lon_ref = geotagging['GPSLongitudeRef']

            latitude = get_decimal_from_dms(lat_dms, lat_ref)
            longitude = get_decimal_from_dms(lon_dms, lon_ref)

            return {"latitude": latitude, "longitude": longitude}
    except Exception as e:
        print(f"Error reading EXIF data: {e}")
    return None

def create_location_photo(db: Session, location_id: int, file_path: str):
    db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_location:
        return None
    
    photo_data = {"location_id": location_id, "file_path": file_path}

    geotag = get_geotag_from_image(file_path)
    if geotag:
        if db_location.latitude == 0 and db_location.longitude == 0:
            db_location.latitude = geotag["latitude"]
            db_location.longitude = geotag["longitude"]
        
        photo_data["latitude"] = geotag["latitude"]
        photo_data["longitude"] = geotag["longitude"]
    
    db_photo = models.Photo(**photo_data)
    db.add(db_photo)
    db.add(db_location)
    db.commit()
    db.refresh(db_photo)
    db.refresh(db_location)
    return db_photo

def reset_location_from_photo(db: Session, photo_id: int):
    db_photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not db_photo:
        return None
    
    db_location = db_photo.location
    if not db_location:
        return None
    
    geotag = get_geotag_from_image(db_photo.file_path)

    if geotag:
        db_location.latitude = geotag["latitude"]
        db_location.longitude = geotag["longitude"]
        db.commit()
        db.refresh(db_location)
    
    return db_location

def update_trip(db: Session, trip_id: int, trip: schemas.TripCreate):
    db_trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if db_trip:
        update_data = trip.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_trip, key, value)
        db.commit()
        db.refresh(db_trip)
    return db_trip

def update_location(db: Session, location_id: int, location: schemas.LocationUpdate):
    db_location = db.query(models.Location).filter(models.Location.id ==location_id).first()
    if db_location:
        update_data = location.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_location, key, value)
        db.commit()
        db.refresh(db_location)
    return db_location

def delete_photo(db: Session, photo_id: int):
    db_photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if db_photo:
        _delete_photo_file(db_photo)
        db.delete(db_photo)
        db.commit()
    return db_photo