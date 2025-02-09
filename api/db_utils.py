import os
from dotenv import load_dotenv # type: ignore
import psycopg2 # type: ignore
from psycopg2 import Error # type: ignore

load_dotenv(dotenv_path='.env/.env')

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
    
def fetch_data():
    connection = connect_to_db()
    if connection:
        try:
            cursor = connection.cursor()

            query = "SELECT * FROM testschema.testtable ORDER BY id ASC"

            cursor.execute(query)

            records = cursor.fetchall()

            return records
        except Error as e:
            print(f"Error executing query: {e}")
            return None
        finally:
            if connection:
                cursor.close()
                connection.close()