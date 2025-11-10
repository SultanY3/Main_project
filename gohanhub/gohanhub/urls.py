from django.contrib import admin
from django.urls import path, include
from recipes import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    # ----- Main/CRUD Views -----
    path('admin/', admin.site.urls),
    path('', views.home, name="home"),
    path('register/', views.register, name="register"),
    path('login/', views.login_view, name="login"),
    path('logout/', views.logout_view, name="logout"),
    path('profile/', views.profile, name="profile"),
    path('profile/update/', views.update_profile, name="updateprofile"),
    path('addrecipe/', views.add_recipe, name="addrecipe"),
    path('recipe/<int:id>/', views.recipe_detail, name="recipedetail"),
    path('recipe/<int:id>/favorite/', views.toggle_favorite, name="togglefavorite"),
    path('recipe/<int:id>/edit/', views.edit_recipe, name="editrecipe"),
    path('recipe/<int:id>/delete/', views.delete_recipe, name="deleterecipe"),
    path('favorites/', views.my_favorites, name="myfavorites"),
    
    # ----- Admin Views -----
    path('admin-home/', views.admin_home, name="adminhome"),
    path('manage-users/', views.manage_users, name="manageusers"),
    path('manage-recipes/', views.manage_recipes, name="managerecipes"),
    path('deleteuser/<int:user_id>/', views.delete_user, name="deleteuser"),
    
    # ----- API & Auth -----
    path('api/', include('recipes.api_urls')),  # Create/verify recipes/apiurls.py for DRF endpoint
    
    # ----- Third-party Auth -----
    path('accounts/', include('allauth.urls')),  # Social Auth via django-allauth
    path('dj-rest-auth/', include('dj_rest_auth.urls')),  # Auth endpoints
    path('dj-rest-auth/registration/', include('dj_rest_auth.registration.urls')),  # Registration endpoints
    # path('swagger/', include('drf_yasg.urls')),  # Optional Swagger docs
]

# Serve media files in development only!
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
