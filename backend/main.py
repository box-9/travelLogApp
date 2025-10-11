from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
import shutil
import os
import uuid

from . import models, schemas, crud
from .database import engine, SessionLocal

models.Base.metadata.create_all(bind=engine)

origins = [
    "http://localhost:5173",
]

UPLOAD_DIR = "static/images"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/trips/", response_model=schemas.Trip)
def create_trip(trip: schemas.TripCreate, db: Session = Depends(get_db)):
    return crud.create_trip(db=db, trip=trip)

@app.get("/trips/", response_model=list[schemas.Trip])
def read_trips(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    trips = crud.get_trips(db, skip=skip, limit=limit)
    return trips

@app.post("/trips/{trip_id}/locations/", response_model=schemas.Location)
def create_location_for_trip(trip_id: int, location: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_trip = crud.get_trip(db, trip_id=trip_id)
    if db_trip is None:
        raise HTTPException(status_code=404, detail= "Trip not found")
    return crud.create_trip_location(db=db, location=location, trip_id=trip_id)

@app.get("/trips/{trip_id}/locations/", response_model=list[schemas.Location])
def read_locations_for_trip(trip_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    db_trip = crud.get_trip(db, trip_id=trip_id)
    if db_trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    locations = crud.get_locations_by_trip(db=db, trip_id=trip_id, skip=skip, limit=limit)
    return locations

@app.delete("/trips/{trip_id}", response_model=schemas.Trip)
def delete_trip(trip_id: int, db: Session = Depends(get_db)):
    db_trip = crud.delete_trip(db=db, trip_id=trip_id)
    if db_trip is None:
        raise HTTPException(status_code=404, detail="Trip not Found")
    return db_trip

@app.put("/trips/{trip_id}", response_model=schemas.Trip)
def update_trip(trip_id: int, trip: schemas.TripCreate, db: Session = Depends(get_db)):
    db_trip = crud.update_trip(db=db, trip_id=trip_id, trip=trip)
    if db_trip is None:
        raise HTTPException(status_code=404, detail="Trip not found")
    return db_trip


@app.delete("/locations/{location_id}", response_model=schemas.Location)
def delete_location(location_id: int, db: Session = Depends(get_db)):
    db_location = crud.delete_location(db=db, location_id=location_id)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return db_location

@app.post("/locations/{location_id}/photos/", response_model=schemas.Photo)
def upload_photo_for_location(location_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    db_photo = crud.create_location_photo(db=db, location_id=location_id, file_path=file_path)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return db_photo

@app.put("/locations/{location_id}", response_model=schemas.Location)
def update_location(location_id: int, location: schemas.LocationUpdate, db: Session = Depends(get_db)):
    db_location = crud.update_location(db=db, location_id=location_id, location=location)
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return db_location

@app.delete("/photos/{photo_id}", response_model=schemas.Photo)
def delete_photo(photo_id: int, db: Session = Depends(get_db)):
    db_photo = crud.delete_photo(db=db, photo_id=photo_id)
    if db_photo is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return db_photo

@app.post("/photos/{photo_id}/reset-location", response_model=schemas.Location)
def reset_location_from_photo(photo_id: int, db: Session = Depends(get_db)):
    updated_location = crud.reset_location_from_photo(db=db, photo_id=photo_id)
    if updated_location is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    return updated_location