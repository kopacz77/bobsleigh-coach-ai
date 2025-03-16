"""Generate a secure random secret key for the application."""

import secrets
import base64

# Generate a 32-byte random key
random_bytes = secrets.token_bytes(32)

# Convert to a URL-safe base64-encoded string
secret_key = base64.urlsafe_b64encode(random_bytes).decode('utf-8')

print(f"Generated Secret Key:\n{secret_key}")
print("\nAdd this to your .env file as SECRET_KEY=<the_key>")
