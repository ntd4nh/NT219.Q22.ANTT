"""
Test – Rate Limiting
Verify that the API gateway enforces rate limits.
"""

# TODO: Implement test cases
# Scenarios:
#   1. Normal request rate → all succeed
#   2. Exceed rate limit → 429 Too Many Requests
#   3. Brute force login attempts → blocked after threshold
#   4. Rate limit reset after window passes
