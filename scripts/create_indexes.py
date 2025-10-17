import asyncio                           # async runtime
from motor.motor_asyncio import AsyncIOMotorClient  # Motor async client
import os                                # environment variables

MONGO_URI = os.environ["MONGO_URI"]      # Mongo connection string
MONGO_DB = os.environ["MONGO_DB"]        # Database name

async def main():
    client = AsyncIOMotorClient(MONGO_URI)                         # connect to Mongo
    db = client[MONGO_DB]                                          # select database
    user_details = db["user_details"]                              # collection handle
    discount_code = db["discount_code"]                            # collection handle

    # Index for fast influencer lookups by coupon_code (admin and portal use this constantly)
    await discount_code.create_index("coupon_code", unique=True)   # unique coupon_code

    # Indexes for user_details queries
    await user_details.create_index([("discount_code", 1), ("created_at", -1)])  # core query pattern
    await user_details.create_index("created_at", background=True)               # sort / time filtering
    # Optional: case-insensitive regex performance is limited; keep fields short.
    # We’ll rely on regex for user_name/name/book_id (no text index to avoid stemming).

    print("Indexes created.")

if __name__ == "__main__":
    asyncio.run(main())
