from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    image_dir: str

    class Config:
        env_file = ".env"

settings = Settings()