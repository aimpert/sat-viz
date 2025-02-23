import requests
import os
import rs_compute
from logger import get_logger
from fastapi import Depends
from dotenv import load_dotenv

load_dotenv(dotenv_path='.env/.env')

def fetch_tle(norad_id, logger=Depends(get_logger)):
    try:
        url = "https://api.n2yo.com/rest/v1/satellite/tle/" + str(norad_id) + "&apiKey=" + os.getenv('N2YO_API_KEY')
        response = requests.get(url)
        response.raise_for_status()
        
        data = response.json()

        tle = data.get("tle", '')

        if tle:
            tle_1, tle_2 = tle.split('\r\n')
            logger.info(f"{norad_id} Fetcher: TLE found.")
        else:
            logger.info(f"{norad_id} Fetcher: initial fetch could not be made. Attempting to query NASA.")
            tle_1, tle_2 = fetch_NASA_tle(id)

        if not tle_1 and not tle_2:
            logger.warning(f"{norad_id} Fetcher: TLE could not be found.")
            return None, None

        return tle_1, tle_2
    
    except requests.exceptions.RequestException as e:
        logger.error(f"{norad_id} Fetcher: failed TLE request: {e}")
        return None, None

def fetch_NASA_tle(norad_id, logger=Depends(get_logger)):
    try: 
        headers = {
        "User-Agent": "Mozilla/5.0 (compatible; MyPythonScript/1.0; +https://mywebsite.com)"
        }
        url = f"https://tle.ivanstanojevic.me/api/tle/{norad_id}"
        response = requests.get(url, headers=headers)
        data = response.json()

        tle_1 = data.get("line1", '')
        tle_2 = data.get("line2", '')

        return tle_1, tle_2
    except requests.exceptions.RequestException as e:
        logger.error(f"{norad_id} Fetcher: failed NASA TLE request: {e}")