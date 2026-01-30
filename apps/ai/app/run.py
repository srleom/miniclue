import uvicorn
from dotenv import load_dotenv

from app.utils.config import Settings

# Load .env but do not override env vars already set (e.g. PORT from Conductor)
load_dotenv(override=False)

settings = Settings()


# Start the server
def start():
    """Launches the Uvicorn server."""
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        log_level="debug",
        reload=True,
    )
