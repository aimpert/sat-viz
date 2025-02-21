from fetcher import fetch_tle
import rs_compute
from db_utils import get_db
from models import SatelliteTLEs, Satellite
from logger import get_logger

def update_tle(norad_id, logger, db=None):
    tle_1, tle_2 = fetch_tle(norad_id)
    date = rs_compute.calculate_timestamp(tle_1)

    own_session = False
    if db is None:
        db = next(get_db())
        own_session = True

    try:
        tle = SatelliteTLEs(
            norad_id=norad_id,
            tle_line1 = tle_1,
            tle_line2 = tle_2,
            timestamp = date
        )
        db.add(tle)
        db.commit()
        db.refresh(tle)
        logger.info(f"TLE successfully updated for norad id: {norad_id}")
    except Exception as e:
        logger.warning(f"TLE failed update for norad id: {norad_id}")
        db.rollback()
    finally:
        if own_session:
            db.close()

def populate_tles(logger, db=None):
    norad_ids = []
    updated = []
    own_session = False
    if db is None:
        db = next(get_db())
        own_session = True

    try:
        norad_ids = [id[0] for id in db.query(Satellite).with_entities(Satellite.norad_id).all()]
        for norad_id in norad_ids:
            update_tle(norad_id, logger, db)
            updated.append(norad_id)
    except Exception as e:
        logger.warning(f"Failed to populate tles: {e}")
    finally:
        if own_session:
            db.close()

    print(f"Total: {len(updated)} {updated}")

populate_tles(get_logger())