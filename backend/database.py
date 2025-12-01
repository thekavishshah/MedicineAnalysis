import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "medicine_data",
    "user": "postgres",
    "password": "Craigers31!"
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

class get_cursor:
    def __enter__(self):
        self.conn = get_connection()
        self.cur = self.conn.cursor(cursor_factory=RealDictCursor)
        return self.cur

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            self.conn.commit()
        else:
            self.conn.rollback()
        self.cur.close()
        self.conn.close()

def test_connection():
    try:
        with get_cursor() as cur:
            cur.execute("SELECT COUNT(*) as count FROM medicine")
            medicine_count = cur.fetchone()["count"]
            cur.execute("SELECT COUNT(*) as count FROM manufacturer")
            manufacturer_count = cur.fetchone()["count"]
            cur.execute("SELECT COUNT(*) as count FROM category")
            category_count = cur.fetchone()["count"]
            return {
                "status": "connected",
                "medicines": medicine_count,
                "manufacturers": manufacturer_count,
                "categories": category_count
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}