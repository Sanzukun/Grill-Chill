from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:giMvzNAPKSpwalBJWXbKifAunVdZiotK@thomas.proxy.rlwy.net:20144/railway"

    # App
    SECRET_KEY: str = "Z0VT2gYjhWTEjAZsPmJp1oxkOnQZ1vjxFWDYpJ7jZ2lbFWunrDd0IcSlGJqaNaC0"
    APP_NAME: str = "Grill & Chill"
    DEBUG: bool = False

    # Owner credentials (stored in env, not database)
    OWNER_USERNAME: str = "6299660095"
    OWNER_PASSWORD: str = "StrongPassword@2026"
    OWNER_SESSION_TOKEN: str = "Z0VT2gYjhWTEjAZsPmJp1oxkOnQZ1vjxFWDYpJ7jZ2lbFWunrDd0IcSlGJqaNaC0"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8000,https://grillandchill.pages.dev"

    # Wallet / Referral
    REWARD_PERCENTAGE: float = 0.10        # 10% of order amount
    BUYER_REWARD_RATIO: float = 0.75       # buyer gets 75% of reward pool
    REFERRER_REWARD_RATIO: float = 0.25    # referrer gets 25% of reward pool

    # Order numbering
    ORDER_PREFIX: str = "GC"
    ORDER_START: int = 1001

    # Session
    SESSION_EXPIRE_DAYS: int = 30

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()


