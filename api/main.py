from typing import Union
from fastapi import FastAPI, Depends, HTTPException
from db_utils import get_db, engine, Base
from models import Satellite, SatelliteTLEs
from sqlalchemy import text
from sqlalchemy.orm import Session
from logger import get_logger
from fastapi.encoders import jsonable_encoder

app = FastAPI()

Base.metadata.create_all(bind=engine)

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