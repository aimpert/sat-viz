from typing import Union

from fastapi import FastAPI # type: ignore
import rs_compute # type: ignore
from db_utils import fetch_data

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/test")
def test_pull():
    res = fetch_data()
    return res

@app.get("/orbit")
def get_orbit():
    period = rs_compute.calculate_orbit(1000, 2000)
    return {"orbital_period": period}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}