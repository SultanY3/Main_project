from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from recipes import views
from recipes.views import AdminDashboardViewSet
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

router = DefaultRouter()
router.register(r'recipes', views.RecipeViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'user', views.UserProfileView, basename='user')
router.register(r'users', views.PublicUserViewSet, basename='public-user')
router.register(r'admin-dashboard', views.AdminDashboardViewSet, basename='admin-dashboard')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/register/', views.register, name='register'),
    path('api/my-favorites/', views.my_favorites, name='my_favorites'),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'), 
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/google-login/', views.google_login, name='google_login'),
    path('api/forgot-password/', views.forgot_password, name='forgot_password'),
    path('api/verify-otp/', views.verify_otp, name='verify_otp'),
    path('api/reset-password/', views.reset_password, name='reset_password'),
    path('api/chat/', views.ai_chat, name='ai_chat'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)