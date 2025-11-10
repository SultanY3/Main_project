# GohanHub API Documentation

This document provides a comprehensive overview of all API endpoints, their request/response formats, and the data contracts between the frontend and backend.

## Base URL
- Development: `http://127.0.0.1:8000/api`
- Production: (configure via `REACT_APP_API_BASE_URL`)

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

The token is obtained from the login or registration endpoints and stored in localStorage.

---

## Authentication Endpoints

### 1. Login
**Endpoint:** `POST /auth/login/`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "first_name": "",
    "last_name": ""
  }
}
```

**Error Response (400/401):**
```json
{
  "detail": "Unable to log in with provided credentials."
}
```

**Notes:**
- Uses email-based authentication (username is auto-generated)
- Token is stored in localStorage as 'token'
- Frontend extracts `access` token from response

---

### 2. Registration
**Endpoint:** `POST /auth/registration/`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password1": "password123",
  "password2": "password123"
}
```

**Response (201 Created):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "first_name": "",
    "last_name": ""
  }
}
```

**Error Response (400):**
```json
{
  "email": ["This field is required."],
  "password1": ["This password is too short."],
  "password2": ["The two password fields didn't match."]
}
```

**Notes:**
- Username is auto-generated from email by backend
- Frontend does NOT send username field
- Password validation: minimum 8 characters (configured in Django settings)

---

### 3. Get Current User
**Endpoint:** `GET /auth/user/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "user123",
  "email": "user@example.com",
  "first_name": "",
  "last_name": ""
}
```

**Error Response (401):**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

### 4. Logout
**Endpoint:** `POST /auth/logout/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "detail": "Successfully logged out."
}
```

---

### 5. Google OAuth Login
**Endpoint:** `POST /auth/google/`

**Request Body:**
```json
{
  "token": "google_oauth_credential_token"
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "user123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

---

## Recipe Endpoints

### 1. List Recipes
**Endpoint:** `GET /recipes/`

**Query Parameters:**
- `search`: Search term (searches title, description, ingredients)
- `ordering`: Order by field (`created_at`, `title`, `average_rating`)
- `page`: Page number (pagination)
- `page_size`: Items per page

**Response (200 OK):**
```json
{
  "count": 100,
  "next": "http://127.0.0.1:8000/api/recipes/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "author": {
        "id": 1,
        "username": "user123",
        "email": "user@example.com",
        "first_name": "",
        "last_name": ""
      },
      "title": "Recipe Title",
      "description": "Recipe description",
      "instructions": "Step 1\n\nStep 2",
      "ingredients": [
        {"id": 1, "name": "Ingredient 1"},
        {"id": 2, "name": "Ingredient 2"}
      ],
      "category": {
        "id": 1,
        "name": "Category Name"
      },
      "category_id": 1,
      "image": "/media/recipe_images/image.jpg",
      "created_at": "2024-01-01T12:00:00Z",
      "is_favorite": false,
      "average_rating": 4.5,
      "rating_count": 10,
      "user_rating": 5,
      "comment_count": 3
    }
  ]
}
```

---

### 2. Get Recipe Details
**Endpoint:** `GET /recipes/{id}/`

**Response (200 OK):**
Same structure as single recipe in list response.

**Error Response (404):**
```json
{
  "detail": "Not found."
}
```

---

### 3. Create Recipe
**Endpoint:** `POST /recipes/`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Recipe Title",
  "description": "Recipe description",
  "instructions": "Step 1\n\nStep 2",
  "category_id": 1,
  "image": "http://example.com/image.jpg",
  "ingredients": [
    {"name": "Ingredient 1"},
    {"name": "Ingredient 2"}
  ]
}
```

**Response (201 Created):**
Same structure as recipe detail response.

**Error Response (400):**
```json
{
  "title": ["This field is required."],
  "category_id": ["This field is required."]
}
```

**Notes:**
- `category_id` is used for write operations (not `category` object)
- `ingredients` must be array of objects with `name` field
- `instructions` is a single text field (newline-separated steps)
- Author is automatically set to authenticated user

---

### 4. Update Recipe
**Endpoint:** `PUT /recipes/{id}/`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
Same as create recipe.

**Response (200 OK):**
Same structure as recipe detail response.

**Error Response (403):**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

**Notes:**
- Only recipe author can update recipe
- Use `PUT` for full update (all fields required)

---

### 5. Delete Recipe
**Endpoint:** `DELETE /recipes/{id}/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (204 No Content):**

**Error Response (403):**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

### 6. Rate Recipe
**Endpoint:** `POST /recipes/{id}/rate/`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "rating": 5
}
```

**Response (200 OK):**
```json
{
  "rating": 5,
  "average_rating": 4.5,
  "rating_count": 10
}
```

**Error Response (400):**
```json
{
  "detail": "Please provide a valid rating between 1 and 5"
}
```

**Notes:**
- Rating must be integer between 1 and 5
- Updates existing rating if user already rated

---

### 7. Favorite/Unfavorite Recipe
**Endpoint:** `POST /recipes/{id}/favorite/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": "favorited"
}
```
or
```json
{
  "status": "unfavorited"
}
```

**Notes:**
- Toggles favorite status (if favorited, unfavorites and vice versa)

---

### 8. Get Recipe Comments
**Endpoint:** `GET /recipes/{id}/comments/`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "user": {
      "id": 1,
      "username": "user123",
      "email": "user@example.com",
      "first_name": "",
      "last_name": ""
    },
    "recipe": 1,
    "text": "Great recipe!",
    "created_at": "2024-01-01T12:00:00Z",
    "updated_at": "2024-01-01T12:00:00Z",
    "is_owner": false
  }
]
```

---

### 9. Post Comment
**Endpoint:** `POST /recipes/{id}/comments/` or `POST /recipes/{id}/comment/`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "text": "Great recipe!"
}
```

**Response (201 Created):**
Same structure as comment in list response.

**Error Response (400):**
```json
{
  "detail": "Please provide comment text"
}
```

---

## Category Endpoints

### 1. List Categories
**Endpoint:** `GET /categories/`

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "name": "Category Name"
  }
]
```

---

### 2. Get Category Details
**Endpoint:** `GET /categories/{id}/`

**Response (200 OK):**
Same structure as category in list response.

---

## User Endpoints

### 1. Get User Profile
**Endpoint:** `GET /users/{id}/`

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "user123",
  "first_name": "",
  "last_name": "",
  "follower_count": 10,
  "following_count": 5,
  "is_following": false,
  "recipes_count": 20
}
```

**Notes:**
- `is_following` is `null` if viewing own profile
- `is_following` is `false` if not authenticated

---

### 2. Get Current User Profile
**Endpoint:** `GET /users/me/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
Same structure as user profile.

---

### 3. Follow User
**Endpoint:** `POST /users/{id}/follow/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (201 Created):**
Same structure as user profile with updated `is_following: true`.

**Error Response (400):**
```json
{
  "detail": "You are already following this user."
}
```
or
```json
{
  "detail": "You cannot follow yourself."
}
```

---

### 4. Unfollow User
**Endpoint:** `DELETE /users/{id}/unfollow/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
Same structure as user profile with updated `is_following: false`.

**Error Response (400):**
```json
{
  "detail": "You are not following this user."
}
```

---

### 5. Get User Followers
**Endpoint:** `GET /users/{id}/followers/`

**Response (200 OK):**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "follower123",
      "first_name": "",
      "last_name": "",
      "follower_count": 5,
      "following_count": 3,
      "is_following": false,
      "recipes_count": 10
    }
  ]
}
```

---

### 6. Get User Following
**Endpoint:** `GET /users/{id}/following/`

**Response (200 OK):**
Same structure as followers list.

---

### 7. Get User Recipes
**Endpoint:** `GET /users/{id}/recipes/`

**Response (200 OK):**
Same structure as recipes list.

---

### 8. Get My Favorites
**Endpoint:** `GET /users/me/favorites/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
Same structure as recipes list (only favorited recipes).

---

## Feed Endpoints

### 1. Get Personalized Feed
**Endpoint:** `GET /feed/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Recipe Title",
    "description": "Recipe description",
    "image": "/media/recipe_images/image.jpg",
    "author": {
      "username": "user123",
      "profile_picture": null
    },
    "created_at": "2024-01-01T12:00:00Z",
    "likes_count": 10,
    "comments_count": 5,
    "avg_rating": 4.5,
    "is_favorite": false
  }
]
```

**Notes:**
- Returns recipes from users that the authenticated user follows
- Ordered by creation date (newest first)

---

## Notification Endpoints

### 1. Get Notifications
**Endpoint:** `GET /notifications/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
[
  {
    "id": 1,
    "sender": {
      "id": 1,
      "username": "user123",
      "profile_picture": null
    },
    "notification_type": "comment",
    "recipe": {
      "id": 1,
      "title": "Recipe Title"
    },
    "message": "user123 commented on your recipe",
    "created_at": "2024-01-01T12:00:00Z",
    "time_ago": "2 hours ago"
  }
]
```

**Notes:**
- Returns notifications from last hour
- Notification types: `follow`, `comment`, `rating`

---

### 2. Get Notification Count
**Endpoint:** `GET /notifications/count/`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "count": 5
}
```

---

## Chatbot Endpoints

### 1. Send Chatbot Message
**Endpoint:** `POST /chatbot/`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "message": "How do I cook rice?",
  "recipe_id": 1
}
```

**Response (200 OK):**
```json
{
  "response": "To cook rice, first rinse the rice..."
}
```

**Error Response (400):**
```json
{
  "detail": "Message is required"
}
```

**Error Response (429):**
```json
{
  "detail": "Rate limit exceeded (10 requests per hour)"
}
```

**Notes:**
- Rate limited to 10 requests per user per hour
- `recipe_id` is optional (provides context if user is viewing a recipe)

---

## Error Response Format

All error responses follow this format:

```json
{
  "detail": "Error message here"
}
```

For validation errors (400 Bad Request), the response may include field-specific errors:

```json
{
  "field_name": ["Error message 1", "Error message 2"],
  "another_field": ["Error message"]
}
```

### Common HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful, no content to return
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Data Type Mappings

### Frontend → Backend

| Frontend Field | Backend Field | Type | Notes |
|---------------|---------------|------|-------|
| `email` | `email` | string | Email address |
| `password1` | `password1` | string | Password (min 8 chars) |
| `password2` | `password2` | string | Password confirmation |
| `category` (ID) | `category_id` | integer | Category ID for write ops |
| `ingredients` (array of strings) | `ingredients` (array of objects) | array | `[{name: "..."}]` |
| `instructions` (array of strings) | `instructions` (text) | string | Newline-separated steps |

### Backend → Frontend

| Backend Field | Frontend Field | Type | Notes |
|---------------|----------------|------|-------|
| `username` | `username` | string | Auto-generated from email |
| `category` (object) | `category` (object) | object | `{id, name}` |
| `category_id` | `category_id` | integer | For write operations |
| `ingredients` (array of objects) | `ingredients` (array of objects) | array | `[{id, name}]` |
| `instructions` (text) | `instructions` (text) | string | Newline-separated steps |
| `is_following` | `is_following` | boolean | Follow status |
| `average_rating` | `average_rating` | number | Average rating (1-5) |
| `user_rating` | `user_rating` | number\|null | User's rating (if authenticated) |

---

## Authentication Flow

1. User registers/logs in → receives JWT token
2. Token stored in localStorage as `token`
3. Token added to all subsequent requests via Authorization header
4. Token expires after 1 day (refresh token expires after 7 days)
5. On token expiration, user must re-authenticate

---

## Notes and Best Practices

1. **Username Handling**: Username is auto-generated from email during registration. Frontend should NOT send username in registration requests.

2. **Category Field**: Use `category_id` for write operations (create/update), but `category` object is returned in read operations.

3. **Ingredients Format**: Always send ingredients as array of objects with `name` field: `[{name: "ingredient1"}]`

4. **Instructions Format**: Instructions are stored as plain text with newline-separated steps. Frontend should join steps with `\n\n` when sending.

5. **Error Handling**: Always check for `error.response?.data?.detail` for error messages.

6. **Pagination**: List endpoints support pagination. Check for `next` and `previous` fields in response.

7. **Image URLs**: Recipe images are stored in `/media/recipe_images/`. Full URL includes base URL + media path.

8. **Follow Status**: Use `is_following` field (boolean) from user profile response, not `following`.

9. **Rating Values**: Ratings must be integers between 1 and 5.

10. **Rate Limiting**: Chatbot endpoint is rate-limited to 10 requests per user per hour.

---

## Migration Notes

### Changes Made for Consistency

1. **Registration**: Removed username field from frontend registration form. Backend auto-generates username from email.

2. **User Serializer**: Added `username` field to `CustomUserSerializer` for frontend display.

3. **Recipe Form**: 
   - Changed `category` to `category_id` for write operations
   - Changed ingredients format from array of strings to array of objects with `name` field
   - Changed instructions from array to single text field

4. **Follow Button**: Changed from expecting `following` field to `is_following` field.

5. **Error Responses**: Standardized all error responses to use `detail` field instead of `error` field.

---

## Testing

To test the API endpoints:

1. Start Django backend: `python manage.py runserver`
2. Start React frontend: `npm start`
3. Use Swagger UI at `http://127.0.0.1:8000/api/docs/` for interactive API documentation
4. Use browser DevTools to inspect API requests/responses

---

## Support

For issues or questions, please refer to:
- Backend code: `gohanhub/recipes/api_views.py`
- Frontend API service: `gohanhub-frontend/src/services/api.js`
- Serializers: `gohanhub/recipes/serializers.py` and `gohanhub/users/serializers.py`

