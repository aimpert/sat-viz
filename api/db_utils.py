import os
from dotenv import load_dotenv
import psycopg2 
from psycopg2 import Error 
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session

load_dotenv(dotenv_path='.env/.env')

DATABASE_URL = os.getenv('DB_URL')

engine = create_engine(DATABASE_URL)

SessionalLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Session = scoped_session(SessionalLocal)

Base = declarative_base()

# def connect_to_db():
#     try:
#         connection = psycopg2.connect(
#             host=os.getenv('DB_HOST'),
#             database=os.getenv('DB_NAME'),
#             user=os.getenv('DB_USER'),
#             password=os.getenv('DB_PASSWORD'),
#             port=os.getenv('DB_PORT')
#         )
#         return connection
#     except Error as e:
#         print(f"Error connecting to PostgreSQL: {e}")
#         return None

def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()