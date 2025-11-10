from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
# from drf_yasg.views import get_schema_view
# from drf_yasg import openapi
from rest_framework import permissions
from . import api_views, follow_views

# Swagger/OpenAPI schema
# schema_view = get_schema_view(
#     openapi.Info(
#         title="GohanHub API",
#         default_version='v1',
#         description="API for GohanHub recipe sharing platform",
#         terms_of_service="https://www.google.com/policies/terms/",
#         contact=openapi.Contact(email="contact@gohanhub.local"),
#         license=openapi.License(name="BSD License"),
#     ),
#     public=True,
#     permission_classes=(permissions.AllowAny,),
# )

# DRF Router
router = DefaultRouter()
router.register(r"recipes", api_views.RecipeViewSet, basename="recipe")
router.register(r"categories", api_views.CategoryViewSet, basename="category")
router.register(r"ingredients", api_views.IngredientViewSet, basename="ingredient")

urlpatterns = [
    # API root routes (DRF ViewSets)
    path("", include(router.urls)),

    # JWT Authentication
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # dj-rest-auth user auth and registration endpoints
    path("auth/", include("dj_rest_auth.urls")),
    path("auth/registration/", include("dj_rest_auth.registration.urls")),

    # Google OAuth2 login endpoint
    path("auth/google/", api_views.GoogleLogin.as_view(), name="google-login"),

    # Follow system endpoints
    path("users/<int:user_id>/follow/", follow_views.FollowUserView.as_view(), name="follow-user"),
    path("users/<int:user_id>/unfollow/", follow_views.UnfollowUserView.as_view(), name="unfollow-user"),
    path("users/<int:user_id>/followers/", follow_views.UserFollowersView.as_view(), name="user-followers"),
    path("users/<int:user_id>/following/", follow_views.UserFollowingView.as_view(), name="user-following"),
    path("users/<int:user_id>/follow-status/", follow_views.check_follow_status, name="follow-status"),
    path("users/<int:user_id>/", follow_views.UserProfileView.as_view(), name="user-profile"),
    path("users/me/", follow_views.user_me_view, name="user-me"),
    path("users/<int:user_id>/recipes/", follow_views.UserRecipesView.as_view(), name="user-recipes"),
    path("users/me/favorites/", follow_views.MyFavoritesView.as_view(), name="my-favorites"),
    path("feed/", api_views.PersonalizedFeedView.as_view(), name="personalized-feed"),

    # Registration endpoint alias
    path("auth/register/", follow_views.register_view, name="register"),

    # Recipe rating and comments
    path("recipes/<int:pk>/rate/", api_views.RecipeViewSet.as_view({"post": "rate"}), name="recipe-rate"),
    path("recipes/<int:pk>/comment/", api_views.RecipeViewSet.as_view({"post": "comment"}), name="recipe-comment"),
    path("recipes/<int:pk>/comments/", api_views.RecipeViewSet.as_view({"get": "comments", "post": "comment"}), name="recipe-comments"),

    # Notifications
    path("notifications/", api_views.ListNotificationsView.as_view(), name="notifications-list"),
    path("notifications/count/", api_views.GetNotificationCountView.as_view(), name="notifications-count"),

    # Swagger/OpenAPI docs
    # path("docs/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    # path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),

    # Chatbot/AI endpoint
    path("chatbot/", api_views.ChatbotView.as_view(), name="chatbot"),
]
