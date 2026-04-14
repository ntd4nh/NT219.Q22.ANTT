"""
Test – BOLA Protection
Verify that users cannot access resources belonging to other users.
"""

# TODO: Implement test cases
# Scenarios:
#   1. User A requests their own order → 200 OK
#   2. User A requests User B's order → 403 Forbidden
#   3. Admin requests any order → 200 OK
#   4. Unauthenticated request → 401 Unauthorized
