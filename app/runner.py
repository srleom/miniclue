import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env, overriding any existing ones
load_dotenv(override=True)


def start():
    """Launches the Uvicorn server."""
    uvicorn.run("app.main:app", reload=True)
