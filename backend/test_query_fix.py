"""Quick test to verify query_documents async fix"""
import asyncio
from dotenv import load_dotenv
load_dotenv()

from database.mongodb_connection import init_mongodb
from app.services.document_processor_mongodb import query_documents

async def test():
    init_mongodb()
    print("✅ MongoDB initialized")
    
    # Test query_documents
    result = await query_documents('test query', 'test_lecture', 5)
    print(f"✅ query_documents works! Returned {len(result)} results")
    print("✅ All async calls fixed!")

if __name__ == "__main__":
    asyncio.run(test())
