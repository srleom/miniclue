from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket_name: str = ""
    s3_endpoint_url: str = ""
    postgres_dsn: str = ""
    llm_api_key: str = ""
    llm_api_endpoint: str = ""
    ingestion_queue: str = ""
    embedding_queue: str = ""
    explanation_queue: str = ""
    summary_queue: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")
