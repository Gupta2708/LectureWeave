"""
Quick test to verify queue processing works
"""
import asyncio
from collections import defaultdict

async def test_queue_processing():
    """Test that queue processing works correctly"""
    
    # Simulate the queue system
    audio_queues = defaultdict(asyncio.Queue)
    lecture_id = "test-123"
    
    async def producer():
        """Simulate audio chunks arriving"""
        for i in range(5):
            await asyncio.sleep(1)
            await audio_queues[lecture_id].put(f"chunk-{i}")
            print(f"✅ Produced: chunk-{i}")
    
    async def consumer():
        """Simulate processing task"""
        print("🎵 Consumer started")
        try:
            while True:
                print("⏳ Waiting for chunk...")
                chunk = await audio_queues[lecture_id].get()
                print(f"✅ Got chunk: {chunk}")
                print(f"🎤 Processing: {chunk}")
                await asyncio.sleep(0.5)  # Simulate processing
                print(f"✅ Processed: {chunk}")
        except asyncio.CancelledError:
            print("🛑 Consumer cancelled")
    
    # Run producer and consumer
    consumer_task = asyncio.create_task(consumer())
    producer_task = asyncio.create_task(producer())
    
    # Wait for producer to finish
    await producer_task
    
    # Give consumer time to process
    await asyncio.sleep(2)
    
    # Cancel consumer
    consumer_task.cancel()
    try:
        await consumer_task
    except asyncio.CancelledError:
        pass
    
    print("\n✅ Test completed successfully!")

if __name__ == "__main__":
    asyncio.run(test_queue_processing())
