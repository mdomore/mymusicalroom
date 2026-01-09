# Endpoint Authentication Audit

## Summary
This document lists all API endpoints and their authentication status.

## Pages Routes (`/api/pages`)
- ✅ `GET /` - Requires authentication (`get_current_user`)
- ✅ `GET /{page_id}` - Requires authentication (`get_current_user`)
- ✅ `POST /` - Requires authentication (`get_current_user`)
- ✅ `PUT /{page_id}` - Requires authentication (`get_current_user`)
- ✅ `DELETE /{page_id}` - Requires authentication (`get_current_user`)

## Resources Routes (`/api/resources`)
- ✅ `GET /` - Requires authentication (`get_current_user`)
- ✅ `GET /{resource_id}` - Requires authentication (`get_current_user`)
- ✅ `POST /` - Requires authentication (`get_current_user`)
- ✅ `POST /upload/{page_id}` - Requires authentication (`get_current_user`)
- ✅ `PUT /{resource_id}` - Requires authentication (`get_current_user`)
- ✅ `PUT /reorder` - Requires authentication (`get_current_user`)
- ✅ `DELETE /{resource_id}` - Requires authentication (`get_current_user`)

## Auth Routes (`/api/auth`)
- ✅ `POST /register` - Public (intentionally, no auth required for registration)
- ✅ `POST /login` - Public (intentionally, no auth required for login)
- ⚠️ `POST /logout` - **FIXED**: Now requires authentication
- ✅ `GET /me` - Requires authentication (`get_current_user`)

## Auth Migration Routes (`/api/auth/migrate`)
- ⚠️ `POST /sync-password` - **FIXED**: Now requires authentication

## Main Routes
- ⚠️ `GET /api/resources/file/{file_path:path}` - **FIXED**: Now requires authentication and ownership verification (see task mmr-sec-13)
- ✅ `GET /` - Public (root endpoint, intentionally public)

## Issues Found and Fixed
1. **`POST /api/auth/logout`** - Was missing authentication check. Fixed to require `get_current_user`.
2. **`POST /api/auth/migrate/sync-password`** - Was missing authentication check. Fixed to require `get_current_user`.
3. **`GET /api/resources/file/{file_path:path}`** - Was missing authentication and ownership check. Fixed in task mmr-sec-13.

## Status
All endpoints now have proper authentication checks where required.
