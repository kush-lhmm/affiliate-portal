import os
from typing import Any, Dict, List, Optional
from datetime import datetime
from jose import jwt, JWTError
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import timedelta, timezone
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles

load_dotenv()

MONGO_URI = os.environ["MONGO_URI"]
MONGO_DB = os.environ["MONGO_DB"]
JWT_SECRET = os.environ["JWT_SECRET"]

app = FastAPI(title="Diffrun Influencer Portal API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB]
COL_USER = db["user_details"]
COL_CODE = db["discount_code"]

CREDENTIALS = {
    "sukhkarman": {"password": "sukhkarman@diffrun123", "role": "influencer", "coupon_code": "SUKHKARMAN5"},
    "sam": {"password": "sam@diffrun123", "role": "influencer", "coupon_code": "SAM5"},
    "mrsnambiar": {"password": "mrsnambiar@diffrun123", "role": "influencer", "coupon_code": "MRSNAMBIAR15"},
    "akmemon": {"password": "akmemon@diffrun123", "role": "influencer", "coupon_code": "AKMEMON15"},
    "tanvi": {"password": "tanvi@diffrun123", "role": "influencer", "coupon_code": "TANVI15"},
    "perky": {"password": "perky@diffrun123", "role": "influencer", "coupon_code": "PERKY15"},
    "special": {"password": "special@diffrun123", "role": "influencer", "coupon_code": "SPECIAL15"},
    "jishu": {"password": "jishu@diffrun123", "role": "influencer", "coupon_code": "JISHU15"},
    "jessica": {"password": "jessica@diffrun123", "role": "influencer", "coupon_code": "JESSICA15"},
    "mischief": {"password": "mischief@diffrun123", "role": "influencer", "coupon_code": "MISCHIEF15"},
    "mohmaya": {"password": "mohmaya@1234!", "role": "influencer", "coupon_code": "MOHMAYA"},
    "shaira": {"password": "shaira@1234!", "role": "influencer", "coupon_code": "SHAIRA15"},
    "admin": {"password": "admin", "role": "admin", "coupon_code": None}
}

TOKEN_TTL_DAYS = 7


class PortalTokenPayload(BaseModel):
    role: str = Field(..., pattern="^(influencer|admin)$")
    coupon_code: Optional[str] = None


def sign_portal_token(role: str, coupon_code: Optional[str]) -> str:
    payload = {"role": role}
    if role == "influencer":
        if not coupon_code:
            raise ValueError("coupon_code required for influencer token")
        payload["coupon_code"] = coupon_code
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token


def verify_portal_token(token: str) -> PortalTokenPayload:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return PortalTokenPayload(**data)
    except JWTError:
        raise HTTPException(
            status_code=401, detail="Invalid or malformed token")


class InfluencerProfile(BaseModel):
    influencer_name: str
    coupon_code: str
    email: str
    instagram_username: str
    instagram_profile_link: str
    discount_percentage: int


class RedemptionItem(BaseModel):
    created_at: datetime
    user_name: str
    name: str
    book_id: str
    book_style: str
    total_price: float
    city: str


class RedemptionPage(BaseModel):
    items: List[RedemptionItem]
    page: int
    page_size: int
    total_count: int
    total_pages: int


class GenerateLinkRequest(BaseModel):
    coupon_code: str
    portal_base_url: str


class GenerateLinkResponse(BaseModel):
    url: str


class SummaryResponse(BaseModel):
    total_revenue: float
    total_redemptions: int
    cities_reached: int


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    token: str
    role: str


def sign_portal_token(role: str, coupon_code: Optional[str]) -> str:
    # produce token with expiry
    exp = datetime.now(timezone.utc) + timedelta(days=TOKEN_TTL_DAYS)
    payload = {"role": role, "exp": int(exp.timestamp())}
    if role == "influencer":
        if not coupon_code:
            raise ValueError("coupon_code required for influencer token")
        payload["coupon_code"] = coupon_code
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@app.post("/api/influencer/login", response_model=LoginResponse)
async def login(body: LoginRequest):
    u = body.username.strip()
    p = body.password

    # 1) quick existence check
    record = CREDENTIALS.get(u)
    if not record:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 2) check password (plaintext compare for minimal setup)
    if p != record["password"]:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    role = record["role"]
    coupon_code = record.get("coupon_code")
    token = sign_portal_token(role=role, coupon_code=coupon_code)
    return LoginResponse(token=token, role=role)


@app.get("/api/influencer/summary", response_model=SummaryResponse)
async def summary(
    token: str = Query(...),
    coupon_code_override: Optional[str] = Query(None),
):
    payload = verify_portal_token(token)

    # Scope by role
    if payload.role == "influencer":
        match = {"discount_code": payload.coupon_code}
    elif payload.role == "admin":
        if not coupon_code_override:
            raise HTTPException(
                status_code=400, detail="coupon_code_override required for admin")
        match = {"discount_code": coupon_code_override}
    else:
        raise HTTPException(status_code=403, detail="Unsupported role")

    # Aggregation: sum revenue, collect unique cities (normalized), count orders
    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": None,
            "sum_price": {"$sum": {"$toDouble": {"$ifNull": ["$total_price", 0]}}},
            "cities": {"$addToSet": {
                "$toLower": {"$trim": {"input": {"$ifNull": ["$shipping_address.city", ""]}}}
            }},
            "cnt": {"$sum": 1},
        }},
    ]

    doc = await COL_USER.aggregate(pipeline).to_list(length=1)
    if not doc:
        return SummaryResponse(total_revenue=0.0, total_redemptions=0, cities_reached=0)

    d = doc[0]
    # count non-empty city names only
    cities = [c for c in (d.get("cities") or []) if c]
    return SummaryResponse(
        total_revenue=float(d.get("sum_price", 0.0)),
        total_redemptions=int(d.get("cnt", 0)),
        cities_reached=len(cities),
    )


@app.post("/api/influencer/link", response_model=GenerateLinkResponse)
async def generate_link(body: GenerateLinkRequest):
    doc = await COL_CODE.find_one({"coupon_code": body.coupon_code})
    if not doc:
        raise HTTPException(status_code=404, detail="coupon_code not found")

    token = sign_portal_token(role="influencer", coupon_code=body.coupon_code)
    url = f"{body.portal_base_url}/{token}"
    return GenerateLinkResponse(url=url)


async def get_influencer_profile(coupon_code: str) -> InfluencerProfile:
    doc = await COL_CODE.find_one({"coupon_code": coupon_code})
    if not doc:
        raise HTTPException(status_code=404, detail="Influencer not found")
    return InfluencerProfile(
        influencer_name=doc.get("influencer_name", ""),
        coupon_code=doc.get("coupon_code", ""),
        email=doc.get("email", ""),
        instagram_username=doc.get("instagram_username", ""),
        instagram_profile_link=doc.get("instagram_profile_link", ""),
        discount_percentage=int(doc.get("discount_percentage", 0)),
    )


@app.get("/api/influencer/me", response_model=InfluencerProfile)
async def me(token: str = Query(...)):
    payload = verify_portal_token(token)
    if payload.role == "influencer":
        profile = await get_influencer_profile(payload.coupon_code)
        return profile
    raise HTTPException(
        status_code=400, detail="Admin token not supported here")


@app.get("/api/influencer/redemptions", response_model=RedemptionPage)
async def redemptions(
    token: str = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    q: Optional[str] = Query(None),
    coupon_code_override: Optional[str] = Query(None),
):
    payload = verify_portal_token(token)

    filters: Dict[str, Any] = {}
    if payload.role == "influencer":
        filters["discount_code"] = payload.coupon_code
    elif payload.role == "admin" and coupon_code_override:
        filters["discount_code"] = coupon_code_override
    else:
        raise HTTPException(status_code=403, detail="Unsupported role")

    if q:
        rx = {"$regex": q, "$options": "i"}
        filters["$or"] = [{"user_name": rx}, {"name": rx}, {"book_id": rx}]

    total_count = await COL_USER.count_documents(filters)
    total_pages = (total_count + page_size - 1) // page_size
    skip = (page - 1) * page_size

    cursor_mongo = (
        COL_USER.find(filters)
        .sort([("_id", -1)])
        .skip(skip)
        .limit(page_size)
    )

    items: List[RedemptionItem] = []
    async for doc in cursor_mongo:
        shipping = doc.get("shipping_address", {}) or {}
        city = (shipping.get("city") or "")
        items.append(
            RedemptionItem(
                created_at=doc.get("created_at"),
                user_name=doc.get("user_name", ""),
                name=doc.get("name", ""),
                book_id=doc.get("book_id", ""),
                book_style=doc.get("book_style", ""),
                total_price=float(doc.get("total_price", 0) or 0),
                city=city,
            )
        )

    return RedemptionPage(
        items=items,
        page=page,
        page_size=page_size,
        total_count=total_count,
        total_pages=total_pages,
    )


@app.post("/api/influencer/admin-token")
async def make_admin_token():
    token = sign_portal_token(role="admin", coupon_code=None)
    return {"token": token}


@app.get("/api/influencer/profile", response_model=InfluencerProfile)
async def admin_profile(
    token: str = Query(...),
    coupon_code: str = Query(...),
):
    payload = verify_portal_token(token)
    if payload.role != "admin":
        raise HTTPException(status_code=403, detail="Admin token required")
    return await get_influencer_profile(coupon_code)


app.mount("/", StaticFiles(directory="client/out", html=True), name="static")

