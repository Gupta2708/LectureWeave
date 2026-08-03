"""
Startup script for LectureWeave backend.
This script initializes the database and starts the FastAPI server.
"""
import uvicorn
import os
from pathlib import Path

def setup_environment():
    """Set up environment and create necessary directories."""
    # Create .env file if it doesn't exist
    env_file = Path(".env")
    if not env_file.exists():
        print("Creating .env file from template...")
        import shutil
        shutil.copy(".env.example", ".env")
        print("Please edit .env file with your API keys and settings.")
    
    # Create storage directories
    storage_dirs = ["storage/uploads", "storage/audio", "storage/processed"]
    for dir_path in storage_dirs:
        Path(dir_path).mkdir(parents=True, exist_ok=True)
    
    print("Environment setup complete!")

def init_database():
    """Initialize database tables."""
    try:
        from init_db import init_database
        init_database()
    except Exception as e:
        print(f"Database initialization error: {e}")
        print("Continuing anyway...")

def main():
    """Main startup function."""
    print("🚀 Starting LectureWeave Backend...")
    
    # Setup environment
    setup_environment()
    
    # Initialize database
    init_database()
    
    # Start server
    print("Starting FastAPI server...")
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    main()
