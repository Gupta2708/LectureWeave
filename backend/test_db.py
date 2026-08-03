"""
Test PostgreSQL + pgvector connection and functionality
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database.connection import (
    init_db_pool, 
    get_db_cursor, 
    init_database,
    create_lecture,
    save_document,
    save_document_chunks,
    search_similar_chunks
)
import numpy as np

def test_connection():
    """Test basic database connection"""
    print("\n🔍 Testing database connection...")
    
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"✅ Connected to: {version['version'][:50]}...")
            return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def test_pgvector():
    """Test pgvector extension"""
    print("\n🔍 Testing pgvector extension...")
    
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM pg_extension WHERE extname = 'vector';")
            pgvector = cursor.fetchone()
            
            if pgvector:
                print(f"✅ pgvector installed: version {pgvector['extversion']}")
                return True
            else:
                print("❌ pgvector not found! Run: CREATE EXTENSION vector;")
                return False
    except Exception as e:
        print(f"❌ pgvector check failed: {e}")
        return False

def test_schema():
    """Test database schema"""
    print("\n🔍 Testing database schema...")
    
    try:
        with get_db_cursor() as cursor:
            # Check if tables exist
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
                ORDER BY table_name;
            """)
            tables = cursor.fetchall()
            
            expected_tables = [
                'users', 'subjects', 'lectures', 'documents', 
                'document_chunks', 'transcriptions', 'structured_notes', 'final_notes'
            ]
            
            table_names = [t['table_name'] for t in tables]
            
            print(f"📊 Found {len(tables)} tables:")
            for table in tables:
                status = "✅" if table['table_name'] in expected_tables else "⚠️"
                print(f"  {status} {table['table_name']}")
            
            missing = set(expected_tables) - set(table_names)
            if missing:
                print(f"\n❌ Missing tables: {missing}")
                print("Run: python -c \"from database.connection import init_database; init_database()\"")
                return False
            
            return True
    except Exception as e:
        print(f"❌ Schema check failed: {e}")
        return False

def test_vector_operations():
    """Test vector operations"""
    print("\n🔍 Testing vector operations...")
    
    try:
        # Create test lecture
        lecture_id = create_lecture(
            user_id=1,
            subject_id=1,
            title="Test Lecture for Vector Operations"
        )
        print(f"✅ Created test lecture: ID {lecture_id}")
        
        # Create test document
        doc_id = save_document(
            lecture_id=lecture_id,
            filename="test_doc.pdf",
            file_type="pdf",
            file_path="/test/path.pdf",
            content="This is test content about machine learning."
        )
        print(f"✅ Created test document: ID {doc_id}")
        
        # Create test chunks with embeddings
        chunks = [
            {
                'document_id': doc_id,
                'lecture_id': lecture_id,
                'text': 'Machine learning is a subset of artificial intelligence.',
                'index': 0,
                'embedding': np.random.rand(384)  # Random 384-dim vector
            },
            {
                'document_id': doc_id,
                'lecture_id': lecture_id,
                'text': 'Neural networks consist of interconnected layers of neurons.',
                'index': 1,
                'embedding': np.random.rand(384)
            },
            {
                'document_id': doc_id,
                'lecture_id': lecture_id,
                'text': 'Deep learning uses multiple hidden layers for feature extraction.',
                'index': 2,
                'embedding': np.random.rand(384)
            }
        ]
        
        save_document_chunks(chunks)
        print(f"✅ Saved {len(chunks)} chunks with embeddings")
        
        # Test similarity search
        query_embedding = np.random.rand(384)
        results = search_similar_chunks(
            query_embedding=query_embedding,
            lecture_id=lecture_id,
            top_k=3
        )
        
        print(f"✅ Similarity search returned {len(results)} results:")
        for i, result in enumerate(results, 1):
            print(f"  {i}. Similarity: {result['similarity']:.4f}")
            print(f"     Text: {result['chunk_text'][:60]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Vector operations failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("🐘 PostgreSQL + pgvector Test Suite")
    print("=" * 60)
    
    # Initialize connection pool
    init_db_pool()
    
    # Run tests
    tests = [
        ("Connection", test_connection),
        ("pgvector Extension", test_pgvector),
        ("Database Schema", test_schema),
        ("Vector Operations", test_vector_operations)
    ]
    
    results = []
    for name, test_func in tests:
        try:
            result = test_func()
            results.append((name, result))
        except Exception as e:
            print(f"\n❌ Test '{name}' crashed: {e}")
            results.append((name, False))
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {name}")
    
    passed = sum(1 for _, r in results if r)
    total = len(results)
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Database is ready to use.")
    else:
        print("\n⚠️  Some tests failed. Check the output above for details.")
    
    print("=" * 60)

if __name__ == "__main__":
    main()
