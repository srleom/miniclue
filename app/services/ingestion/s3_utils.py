def download_pdf_to_file(s3_client, bucket: str, key: str, local_path: str):
    """Downloads a PDF from S3 directly to a local file."""
    try:
        s3_client.download_file(bucket, key, local_path)
    except Exception as e:
        import logging

        logging.error(
            f"Failed to download PDF to file: bucket={bucket}, key={key}, error={e}"
        )
        raise


def upload_image(s3_client, bucket: str, key: str, data: bytes, content_type: str):
    """Uploads an image to S3. Raises an exception if the upload fails."""
    try:
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )
    except Exception as e:
        import logging

        logging.error(
            f"Failed to upload image to S3: bucket={bucket}, key={key}, error={e}"
        )
        raise
