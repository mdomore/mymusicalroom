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
- ✅ `GET /api/resources/file/{file_path:path}` - **FIXED**: Now requires authentication and verifies file is associated with a valid resource
- ✅ `GET /` - Public (root endpoint, intentionally public)

## Issues Found and Fixed
1. **`POST /api/auth/logout`** - Was missing authentication check. Fixed to require `get_current_user`.
2. **`POST /api/auth/migrate/sync-password`** - Was missing authentication check. Fixed to require `get_current_user`.
3. **`GET /api/resources/file/{file_path:path}`** - Was missing authentication and resource verification. Fixed to require authentication and verify file belongs to a valid resource.

## Note on Ownership Verification
The file serving endpoint now requires authentication and verifies that the file is associated with a valid resource in the database. However, without a `user_id` field on the `Page` model, full ownership verification is not possible. Currently, any authenticated user can access any file that's registered as a resource. To enable proper ownership verification, a `user_id` field should be added to the `Page` model.

## Status
All endpoints now have proper authentication checks where required.
