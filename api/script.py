import os
from fastapi import FastAPI, Depends, HTTPException
from dotenv import load_dotenv # type: ignore
import psycopg2 # type: ignore
from psycopg2 import Error # type: ignore
import requests
import rs_compute 
from db_utils import get_db
from sqlalchemy.orm import Session
from models import Satellite, SatelliteTLEs
from contextlib import contextmanager
from fetcher import *

# This is a "scratch" script. Some of these will be consolidated into
# db_utils and tle_fetcher and the like.

load_dotenv(dotenv_path='.env/.env')

NASA_API = "https://tle.ivanstanojevic.me/api/tle/"

@contextmanager
def get_db_session():
    db = next(get_db())
    try:
        yield db
    finally:
        db.close()

# def fetch_satellites():
#     headers = {
#     "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://mywebsite.com)"
#     }

#     response = requests.get(NASA_API, headers=headers)
#     if response.status_code == 200:
#         return response.json() 
#     return []

# def store_sat_data(sat_data):
#     db = next(get_db())

#     with get_db_session() as db:
#         for item in sat_data.get("member", []):
#             sat = Satellite(
#                 norad_id=item.get("satelliteId"),
#                 name=item.get("name")
#             )
#             db.add(sat)
#         db.commit()

def update_tle(norad_id):
    tle_1, tle_2 = fetch_tle(norad_id)
    date = rs_compute.calculate_timestamp(tle_1)

    with get_db_session() as db:
        tle = SatelliteTLEs(
            norad_id=norad_id,
            tle_line1 = tle_1,
            tle_line2 = tle_2,
            timestamp = date
        )
        db.add(tle)
        db.commit()

update_tle(43786)
# class SatelliteTLEs(Base):
#     __tablename__ = "satellite_tle"

#     id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True, nullable=False)
#     norad_id: Mapped[int] = mapped_column(ForeignKey('satellites.norad_id'), nullable=False)
#     tle_line1: Mapped[str] = mapped_column(nullable=False)
#     tle_line2: Mapped[str] = mapped_column(nullable=False)
#     timestamp: Mapped[datetime] = mapped_column(TIMESTAMP, nullable=True, server_default=func.now())

#     satellite: Mapped["Satellite"] = relationship("Satellite", back_populates="tles")