from typing import Union
from fastapi import FastAPI, Depends, HTTPException
from db_utils import get_db, engine, Base
from models import Satellite, SatelliteTLEs
from sqlalchemy import text
from sqlalchemy.orm import Session
from logger import get_logger
from fastapi.encoders import jsonable_encoder
from crud import populate_tles, update_tle, read_tle
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace "*" with ["http://localhost:8080"] if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root(logger=Depends(get_logger)):
    return {"Hello": "World"}

@app.get("/test")
def test_pull(db: Session = Depends(get_db), logger=Depends(get_logger)):
    try:
        res = db.query(Satellite).all()
        if res is None:
            raise HTTPException(status_code=404, detail="Test pull returned no data.")
        logger.info("Test pull successful.")
        return res
    except Exception as e:
        logger.error(f"Error querying database: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# attempts to populate and update all norad_id TLEs with new ones
@app.get("/pop_tles")
def db_test(db: Session = Depends(get_db), logger=Depends(get_logger)):
    populate_tles(logger, db)

# add new TLE to specific id
@app.get("/pop_tle/{id}")
def db_test(id: int, db: Session = Depends(get_db), logger=Depends(get_logger)):
    update_tle(id, logger, db)

@app.get("/find_tle/{id}")
def db_test(id: int, db: Session = Depends(get_db), logger=Depends(get_logger)):
    return read_tle(id, logger, db)

@app.get("/db_test")
def db_test(db: Session = Depends(get_db)):
    try:
        res = db.execute(text("SELECT 1")).fetchall()
        return {"message": "Database connection successful",
                 "result": [dict(row._mapping) for row in res]}
    except Exception as e:
        return {"error": f"Database connection failed: {e}"}
# @app.get("/orbit")
# def get_orbit():
#     period = rs_compute.calculate_orbit(1000, 2000)
#     return {"orbital_period": period}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}