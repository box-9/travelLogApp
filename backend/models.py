from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, Date
from .database import Base
from sqlalchemy.orm import relationship

class Trip(Base):
    __tablename__ = "trips"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    start_date = Column(Date)
    end_date = Column(Date)
    locations = relationship("Location", back_populates="trip", cascade="all, delete-orphan")

class Location(Base):
    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(Text, index=True)
    description = Column(String, nullable=True)
    latitude = Column(Float)
    longitude = Column(Float)
    trip_id = Column(Integer, ForeignKey("trips.id", ondelete="CASCADE"))
    trip = relationship("Trip", back_populates="locations")
    photos = relationship("Photo", back_populates="location", cascade="all, delete-orphan")

class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String, unique=True, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    location_id = Column(Integer, ForeignKey("locations.id", ondelete="CASCADE"))
    location = relationship("Location", back_populates="photos")

