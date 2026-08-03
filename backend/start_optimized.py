"""
Startup script for optimized LectureWeave backend
"""
import uvicorn
import os

if __name__ == "__main__":
    # Set environment variables if needed
    if not os.getenv("GROQ_API_KEY"):
        print("⚠️  Warning: GROQ_API_KEY not set. Please set it in your .env file")
    
    print("🚀 Starting Optimized LectureWeave Backend")
    print("📊 Configuration:")
    print("   - Audio chunks: 20 seconds")
    print("   - Synthesis interval: 60 seconds (3 chunks)")
    print("   - Whisper model: base")
    print("   - Port: 8001")
    print("")
    
    uvicorn.run(
        "optimized_main:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )
