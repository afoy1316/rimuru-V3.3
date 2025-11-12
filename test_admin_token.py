import jwt
from datetime import datetime, timezone, timedelta

# Generate a valid test token
SECRET_KEY = "rimuru-secret-key-2024-very-secure-random-string-change-in-production"  # From server.py
ALGORITHM = "HS256"

# Create test admin payload
admin_data = {
    "id": "test-admin-123",
    "username": "admin",
    "email": "admin@rimuru.com",
    "is_super_admin": True,
    "exp": datetime.now(timezone.utc) + timedelta(days=7)
}

# Generate token
token = jwt.encode(admin_data, SECRET_KEY, algorithm=ALGORITHM)
print("Test Admin Token:")
print(token)
print("\nTo test, use this token in Authorization header:")
print(f"Authorization: Bearer {token}")
