import warnings

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://todotree:todotree@localhost:5433/todotree"
    secret_key: str = "changeme"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 1 day
    frontend_origin: str = "http://localhost:5173"
    sql_echo: bool = False
    create_tables_on_startup: bool = False

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def model_post_init(self, __context: object) -> None:
        weak_secret = not self.secret_key or self.secret_key.startswith("changeme")
        if self.app_env.lower() in {"production", "prod"} and weak_secret:
            raise ValueError("SECRET_KEY must be set to a strong value in production.")
        if weak_secret:
            warnings.warn(
                "SECRET_KEY uses a development default. Set a strong SECRET_KEY before production.",
                RuntimeWarning,
                stacklevel=2,
            )


settings = Settings()
