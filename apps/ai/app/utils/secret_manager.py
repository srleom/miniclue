import os
import logging
import functools
from google.cloud import secretmanager
from google.api_core import exceptions
from app.utils.config import Settings

settings = Settings()

logger = logging.getLogger(__name__)

# Global client instance to be reused across calls
_client = None


def _get_client():
    """Get or initialize the Secret Manager client."""
    global _client
    if _client is None:
        _client = secretmanager.SecretManagerServiceClient()
    return _client


class SecretNotFoundError(Exception):
    """Raised when a secret is not found in Secret Manager."""

    pass


class SecretAccessError(Exception):
    """Raised when there's an error accessing a secret."""

    pass


class InvalidAPIKeyError(Exception):
    """
    Raised when an API key is invalid or missing.
    This is a permanent error that should not trigger Pub/Sub retries.
    """

    pass


@functools.lru_cache(maxsize=100)
def get_user_api_key(user_id: str, provider: str = "openai") -> str:
    """
    Fetches a user's API key from Google Cloud Secret Manager.
    Results are cached to minimize network calls and latency.
    Supports local override via environment variables for development.

    Args:
        user_id: The user ID (customer_identifier) to fetch the key for
        provider: The API provider (default: "openai")

    Returns:
        The API key as a string

    Raises:
        SecretNotFoundError: If the secret doesn't exist
        SecretAccessError: If there's an error accessing the secret
    """
    # 1. Check for local override (useful for development)
    # Format: USER_API_KEY_{USER_ID}_{PROVIDER}
    env_key = f"USER_API_KEY_{user_id.upper().replace('-', '_')}_{provider.upper()}"
    local_key = os.environ.get(env_key)
    if local_key:
        logger.info(
            f"Using local environment override for {provider} key (user {user_id})"
        )
        return local_key

    # 2. Proceed to GCP Secret Manager
    project_id = settings.gcp_project_id
    if not project_id:
        raise SecretAccessError("GCP project ID is not configured")

    secret_name = f"user-{user_id}-{provider}-key"
    resource_name = f"projects/{project_id}/secrets/{secret_name}/versions/latest"

    try:
        client = _get_client()
        response = client.access_secret_version(request={"name": resource_name})
        api_key = response.payload.data.decode("UTF-8")
        return api_key
    except exceptions.NotFound:
        logger.error(f"Secret not found for user {user_id}")
        raise SecretNotFoundError(f"API key not found for user {user_id}")
    except Exception as e:
        logger.error(f"Error accessing secret for user {user_id}: {e}")
        # If we see a 60s+ hang, it's almost certainly a credential/metadata server timeout
        raise SecretAccessError(f"Failed to access API key from GCP: {str(e)}")
