import os
from fastapi import FastAPI, Depends, HTTPException
from dotenv import load_dotenv # type: ignore
import psycopg2 # type: ignore
from psycopg2 import Error # type: ignore
import requests
import rs_compute 
from db_utils import get_db
from sqlalchemy.orm import Session
from models import Satellite
from contextlib import contextmanager

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

def fetch_satellites():
    headers = {
    "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://mywebsite.com)"
    }

    response = requests.get(NASA_API, headers=headers)
    if response.status_code == 200:
        return response.json() 
    return []

def store_sat_data(sat_data):
    db = next(get_db())

    with get_db_session() as db:
        for item in sat_data.get("member", []):
            sat = Satellite(
                norad_id=item.get("satelliteId"),
                name=item.get("name")
            )
            db.add(sat)
        db.commit()

sat_data = fetch_satellites()
store_sat_data(sat_data)

print(sat_data)

# def check_NASA_TLEs(id):
#     headers = {
#     "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://mywebsite.com)"
#     }
#     url = f"https://tle.ivanstanojevic.me/api/tle/{id}"
#     response = requests.get(url, headers=headers)
#     data = response.json()

#     tle_1 = data.get("line1", '')
#     tle_2 = data.get("line2", '')

#     return tle_1, tle_2



# def populate_TLEs():
#     connection = connect_to_db()

#     cursor = connection.cursor()

#     query = "SELECT norad_id FROM satviz.satellites;"

#     cursor.execute(query)

#     ids = cursor.fetchall()
#     i = 0
#     # for id_tuple in ids:
#     # id = id_tuple[0]
#     id = 43786
#     url = "https://api.n2yo.com/rest/v1/satellite/tle/" + str(id) + "&apiKey=" + os.getenv('N2YO_API_KEY')
#     response = requests.get(url)
#     data = response.json()

#     tle = data.get("tle", '')

#     if tle:
#         tle_1, tle_2 = tle.split('\r\n')
#     else:
#         tle_1, tle_2 = check_NASA_TLEs(id)

#     date = rs_compute.calculate_timestamp(tle_1)

#     if not tle_1 and not tle_2:
#         return

#     print(f"ID: {id} Loop: {i}")
#     print(f"TLE 1: {tle_1}")
#     print(f"TLE 2: {tle_2}")
#     print(f"Date: {date}")
#     i += 1

    
#     cursor.close()
#     connection.close()

# populate_TLEs()
# tle_1, tle_2 = check_NASA_TLEs(43694)
# print(f"TLE 1: {tle_1}")
# print(f"TLE 2: {tle_2}")