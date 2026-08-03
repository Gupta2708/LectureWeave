"""
Initialize the database with tables.
Run this script to create all database tables.
"""
from app.core.database import engine
from app.models.models import Base

def init_database():
    """Create all database tables."""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_database()
