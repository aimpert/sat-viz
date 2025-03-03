from fetcher import fetch_tle
import rs_compute
from db_utils import get_db
from models import SatelliteTLEs, Satellite
from logger import get_logger
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.engine import Result
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from sqlalchemy import func, and_

def update_tle(norad_id, logger, db=None):
    tle_1, tle_2 = fetch_tle(norad_id, logger)

    if tle_1 is None or tle_2 is None:
        logger.warning(f"{norad_id} crud: Skipping due to missing TLE data.")
        return False  # Return False to indicate failure but continue processing

    date = rs_compute.calculate_timestamp(tle_1)

    own_session = False
    if db is None:
        db = next(get_db())
        own_session = True

    try:
        stmt = insert(SatelliteTLEs).values(
            norad_id=norad_id,
            tle_line1=tle_1,
            tle_line2=tle_2,
            timestamp=date
        ).on_conflict_do_nothing()

        result: Result = db.execute(stmt)
        db.commit()

        if result.rowcount > 0:
            logger.info(f"{norad_id} crud: TLE successfully updated")
            return True
        else:
            logger.info(f"{norad_id} crud: TLE not updated (duplicate timestamp)")
            return False
    except Exception as e:
        logger.warning(f"{norad_id} crud: TLE failed update")
        db.rollback()
        return False
    finally:
        if own_session:
            db.close()

def populate_tles(logger, db=None):
    norad_ids = []
    updated = {}
    own_session = False
    if db is None:
        db = next(get_db())
        own_session = True

    try:
        norad_ids = [id[0] for id in db.query(Satellite).with_entities(Satellite.norad_id).all()]
        updated = {norad_id: False for norad_id in norad_ids}
        for norad_id in norad_ids:
            if update_tle(norad_id, logger, db): updated[norad_id] = True
    except Exception as e:
        logger.warning(f"Failed to populate tles: {e}")
    finally:
        if own_session:
            db.close()

    updated_ids = [key for key, value in updated.items() if value]
    failed_ids = [key for key, value in updated.items() if value == False]
    logger.info(f"Updated IDs: {updated_ids} Total {len(updated_ids)}") 
    logger.info(f"Failed IDs: {failed_ids} Total: {len(failed_ids)}")

def read_tle(norad_id, logger, db):
    try:
        res = db.query(SatelliteTLEs).filter(SatelliteTLEs.norad_id == norad_id).order_by(SatelliteTLEs.timestamp.desc()).first()
        if (res): return JSONResponse(content=jsonable_encoder(res))
        else: return JSONResponse(content={"error": "No TLE found"}, status_code=404)
    except Exception as e:
        logger.warning(f"{norad_id} crud: Failed to read tle: {e}")
        return JSONResponse(content={"error": "Internal Server Error"}, status_code=500)
    
def read_tles(logger, db):
    try:
        latest_timestamps = db.query(
            SatelliteTLEs.norad_id,
            func.max(SatelliteTLEs.timestamp).label('latest_timestamp')
        ).group_by(SatelliteTLEs.norad_id).subquery()
        
        logger.info("Created latest_timestamps subquery")
        
        res = db.query(SatelliteTLEs).join(
            latest_timestamps,
            and_(
                SatelliteTLEs.norad_id == latest_timestamps.c.norad_id,
                SatelliteTLEs.timestamp == latest_timestamps.c.latest_timestamp
            )
        ).all()
        
        logger.info(f"Query executed, found {len(res)} results")
        
        if (res): return JSONResponse(content=jsonable_encoder(res))
        else: return JSONResponse(content={"error": "No TLEs found"}, status_code=404)
    except Exception as e:
        logger.warning(f"crud: Failed to read all TLEs: {e}")
        return JSONResponse(content={"error": "Internal Server Error"}, status_code=500)
# populate_tles(get_logger())

# read_tle(25544)