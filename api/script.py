import os
from dotenv import load_dotenv # type: ignore
import psycopg2 # type: ignore
from psycopg2 import Error # type: ignore
import requests
import rs_compute 

# This is a "scratch" script. Some of these will be consolidated into
# db_utils and tle_fetcher and the like.

load_dotenv(dotenv_path='.env/.env')

NASA_API = "https://tle.ivanstanojevic.me/api/tle/"

def connect_to_db():
    try:
        connection = psycopg2.connect(
            host=os.getenv('DB_HOST'),
            database=os.getenv('DB_NAME'),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            port=os.getenv('DB_PORT')
        )
        return connection
    except Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None

def fetch_satellites():
    headers = {
    "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://mywebsite.com)"
    }

    response = requests.get(NASA_API, headers=headers)
    if response.status_code == 200:
        return response.json() 
    return []

# def store_sat_data(sat_data):
#     conn = connect_to_db()
#     cur = conn.cursor()

#     for sat in sat_data.get("member", []):
#         norad_id = sat.get("satelliteId")
#         name = sat.get("name")

#         cur.execute(
#             "INSERT INTO satviz.satellites (norad_id, name) VALUES (%s, %s) ON CONFLICT (norad_id) DO NOTHING;",
#             (norad_id, name)
#         )

#     conn.commit()
#     cur.close()
#     conn.close()

# sat_data = fetch_satellites()
# store_sat_data(sat_data)

# print(sat_data)

def check_NASA_TLEs(id):
    headers = {
    "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://mywebsite.com)"
    }
    url = f"https://tle.ivanstanojevic.me/api/tle/{id}"
    response = requests.get(url, headers=headers)
    data = response.json()

    tle_1 = data.get("line1", '')
    tle_2 = data.get("line2", '')

    return tle_1, tle_2



def populate_TLEs():
    connection = connect_to_db()

    cursor = connection.cursor()

    query = "SELECT norad_id FROM satviz.satellites;"

    cursor.execute(query)

    ids = cursor.fetchall()
    i = 0
    # for id_tuple in ids:
    # id = id_tuple[0]
    id = 43786
    url = "https://api.n2yo.com/rest/v1/satellite/tle/" + str(id) + "&apiKey=" + os.getenv('N2YO_API_KEY')
    response = requests.get(url)
    data = response.json()

    tle = data.get("tle", '')

    if tle:
        tle_1, tle_2 = tle.split('\r\n')
    else:
        tle_1, tle_2 = check_NASA_TLEs(id)

    date = rs_compute.calculate_timestamp(tle_1)

    if not tle_1 and not tle_2:
        return

    print(f"ID: {id} Loop: {i}")
    print(f"TLE 1: {tle_1}")
    print(f"TLE 2: {tle_2}")
    print(f"Date: {date}")
    i += 1

    
    cursor.close()
    connection.close()

populate_TLEs()
# tle_1, tle_2 = check_NASA_TLEs(43694)
# print(f"TLE 1: {tle_1}")
# print(f"TLE 2: {tle_2}")