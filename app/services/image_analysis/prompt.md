Analyze the provided image and return a JSON object with three fields:

1. "type": Classify the image as either "content" (if it contains meaningful information like diagrams, charts, or important text) or "decorative" (if it's primarily for aesthetic purposes, like a background image or stock photo).
2. "ocr_text": Extract any and all text visible in the image. If no text is present, return an empty string.
3. "alt_text": Provide a concise, descriptive alt text for the image, explaining its content and purpose for accessibility.

Return ONLY the raw JSON object, without any markdown formatting or explanations.
