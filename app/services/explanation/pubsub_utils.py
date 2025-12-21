import json
import logging
from uuid import UUID
from typing import Optional

from app.utils.config import Settings


settings = Settings()

_publisher = None


def get_publisher():
    """Lazy initialization of the Pub/Sub publisher client."""
    global _publisher
    if _publisher is None:
        from google.cloud import pubsub_v1

        if settings.pubsub_emulator_host:
            _publisher = pubsub_v1.PublisherClient(
                client_options={"api_endpoint": settings.pubsub_emulator_host}
            )
        else:
            _publisher = pubsub_v1.PublisherClient()
    return _publisher


def _publish_message(topic_name: str, data: dict):
    """Helper function to publish a message to a Pub/Sub topic."""
    if not settings.gcp_project_id:
        logging.error("GCP_PROJECT_ID is not set. Cannot publish message.")
        return

    publisher = get_publisher()
    topic_path = publisher.topic_path(settings.gcp_project_id, topic_name)
    message_data = json.dumps(data).encode("utf-8")

    try:
        future = publisher.publish(topic_path, message_data)
        future.result()  # Wait for the message to be published
    except Exception as e:
        logging.error(f"Failed to publish message to {topic_path}: {e}")
        raise


def publish_summary_job(
    lecture_id: UUID,
    customer_identifier: str,
    name: Optional[str],
    email: Optional[str],
):
    """
    Publishes a job to the summary topic with customer tracking.
    """
    if not settings.summary_topic:
        logging.warning("SUMMARY_TOPIC not set, skipping summary job submission.")
        return
    data = {
        "lecture_id": str(lecture_id),
        "customer_identifier": customer_identifier,
        "name": name,
        "email": email,
    }
    _publish_message(settings.summary_topic, data)
