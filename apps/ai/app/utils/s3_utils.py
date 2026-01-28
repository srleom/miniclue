import logging
import base64
import boto3
from app.utils.config import Settings

settings = Settings()


def get_s3_client():
    """Initializes and returns an S3 client."""
    return boto3.client(
        "s3",
        aws_access_key_id=settings.s3_access_key or None,
        aws_secret_access_key=settings.s3_secret_key or None,
        endpoint_url=settings.s3_endpoint_url or None,
    )


def download_image_as_base64(s3_client, bucket, key):
    """Downloads an image from S3 and returns it as a base64 string."""
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        image_data = response["Body"].read()
        return base64.b64encode(image_data).decode("utf-8")
    except Exception as e:
        logging.error(f"Failed to download image from S3 (Key: {key}): {e}")
        return None
