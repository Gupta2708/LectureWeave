"""
Test MongoDB Atlas connection and functionality
Much simpler than PostgreSQL!
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()  # This loads the .env file!

print("ygtygtyg")

from database.mongodb_connection import (
    init_mongodb,
    setup_indexes,
    get_db,
    create_lecture,
    save_document,
    save_document_embeddings,
    vector_search,
    simple_vector_search,
    get_lecture_stats
)
import numpy as np

async def test_connection():
    """Test basic MongoDB connection"""
    print("\n🔍 Testing MongoDB connection...")
    
    try:
        db = init_mongodb()
        
        # Test ping
        await db.command("ping")
        print("✅ Connected to MongoDB Atlas successfully!")
        
        # Get server info
        server_info = await db.command("serverStatus")
        print(f"✅ MongoDB version: {server_info.get('version', 'Unknown')}")
        
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print("\n💡 Tips:")
        print("1. Check your MONGODB_URL in .env file")
        print("2. Verify IP is whitelisted (0.0.0.0/0)")
        print("3. Check username/password in connection string")
        return False

async def test_indexes():
    """Test index creation"""
    print("\n🔍 Creating indexes...")
    
    try:
        await setup_indexes()
        print("✅ All indexes created successfully!")
        return True
    except Exception as e:
        print(f"❌ Index creation failed: {e}")
        return False

async def test_crud_operations():
    """Test basic CRUD operations"""
    print("\n🔍 Testing CRUD operations...")
    
    try:
        # Create lecture
        lecture_id = await create_lecture(
            user_id="test_user_123",
            subject_id="test_subject_456",
            title="Test Lecture - MongoDB"
        )
        print(f"✅ Created lecture: {lecture_id}")
        
        # Save document
        doc_id = await save_document(
            lecture_id=lecture_id,
            filename="test_ml_lecture.pdf",
            file_type="pdf",
            file_path="/test/path/ml_lecture.pdf",
            content="This is test content about machine learning and neural networks."
        )
        print(f"✅ Saved document: {doc_id}")
        
        # Create embeddings
        chunks = [
            "Machine learning is a subset of artificial intelligence.",
            "Neural networks consist of interconnected layers of neurons.",
            "Deep learning uses multiple hidden layers for feature extraction."
        ]
        
        embeddings = [np.random.rand(384) for _ in chunks]
        
        embedding_data = [
            {
                'lecture_id': lecture_id,
                'document_id': doc_id,
                'chunk_text': chunk,
                'chunk_index': i,
                'embedding': embedding
            }
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))
        ]
        
        await save_document_embeddings(embedding_data)
        print(f"✅ Saved {len(chunks)} document embeddings")
        
        # Get lecture stats
        stats = await get_lecture_stats(lecture_id)
        print(f"✅ Lecture stats: {stats}")
        
        return True, lecture_id
        
    except Exception as e:
        print(f"❌ CRUD operations failed: {e}")
        import traceback
        traceback.print_exc()
        return False, None

async def test_vector_search(lecture_id: str):
    """Test vector similarity search"""
    print("\n🔍 Testing vector search...")
    
    try:
        # Generate random query embedding
        query_embedding = np.random.rand(384)
        
        # Try Atlas Vector Search first
        print("Attempting Atlas Vector Search...")
        try:
            results = await vector_search(
                query_embedding=query_embedding,
                lecture_id=lecture_id,
                top_k=3
            )
            print(f"✅ Atlas Vector Search returned {len(results)} results")
            
            for i, result in enumerate(results, 1):
                print(f"  {i}. Score: {result['similarity']:.4f}")
                print(f"     Text: {result['chunk_text'][:60]}...")
            
        except Exception as e:
            print(f"⚠️  Atlas Vector Search not available: {e}")
            print("   (This is OK - you need to create the Search Index first)")
            print("   Falling back to simple similarity search...")
            
            # Fallback to simple search
            results = await simple_vector_search(
                query_embedding=query_embedding,
                lecture_id=lecture_id,
                top_k=3
            )
            print(f"✅ Simple vector search returned {len(results)} results")
            
            for i, result in enumerate(results, 1):
                print(f"  {i}. Similarity: {result['similarity']:.4f}")
                print(f"     Text: {result['chunk_text'][:60]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Vector search failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_cleanup(lecture_id: str):
    """Clean up test data"""
    print("\n🧹 Cleaning up test data...")
    
    try:
        db = get_db()
        
        # Delete test data
        await db.lectures.delete_many({"_id": lecture_id})
        await db.documents.delete_many({"lecture_id": lecture_id})
        await db.document_embeddings.delete_many({"lecture_id": lecture_id})
        
        print("✅ Test data cleaned up")
        return True
    except Exception as e:
        print(f"⚠️  Cleanup failed (not critical): {e}")
        return False

async def main():
    """Run all tests"""
    print("=" * 70)
    print("🍃 MongoDB Atlas Test Suite")
    print("=" * 70)
    
    # Run tests
    tests_passed = []
    lecture_id = None
    
    # Test 1: Connection
    result = await test_connection()
    tests_passed.append(("Connection", result))
    
    if not result:
        print("\n❌ Cannot proceed without database connection!")
        print("Please check your MONGODB_URL in .env file")
        return
    
    # Test 2: Indexes
    result = await test_indexes()
    tests_passed.append(("Indexes", result))
    
    # Test 3: CRUD
    result, lecture_id = await test_crud_operations()
    tests_passed.append(("CRUD Operations", result))
    
    # Test 4: Vector Search
    if lecture_id:
        result = await test_vector_search(lecture_id)
        tests_passed.append(("Vector Search", result))
        
        # Cleanup
        await test_cleanup(lecture_id)
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 Test Summary")
    print("=" * 70)
    
    for name, passed in tests_passed:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {name}")
    
    passed_count = sum(1 for _, p in tests_passed if p)
    total_count = len(tests_passed)
    
    print(f"\n🎯 Results: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 All tests passed! MongoDB is ready to use.")
        print("\n📝 Next steps:")
        print("1. Create Atlas Vector Search Index (see MONGODB_SETUP_GUIDE.md)")
        print("2. Integrate with your existing code")
        print("3. Replace FAISS with MongoDB vector search")
    else:
        print("\n⚠️  Some tests failed. Check the output above.")
    
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(main())
