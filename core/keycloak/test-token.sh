#!/bin/sh
# Lab helper — password grant for automation only
curl -s -X POST "http://localhost:8080/realms/shopflow/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=shopflow-spa" \
  -d "username=tenant-a-user" \
  -d "password=password123"
