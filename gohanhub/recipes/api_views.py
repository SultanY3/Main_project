from rest_framework import viewsets, permissions, filters, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q, Count, Value, IntegerField, FloatField
from .models import Recipe, Category, Ingredient, Favorite, Follow, Rating, Comment
from .utils import create_comment_notification, create_rating_notification, recent_notifications_for_user
from .serializers import (
    RecipeSerializer, CategorySerializer, IngredientSerializer, FavoriteSerializer,
    NotificationSerializer, CommentSerializer, FeedRecipeSerializer, UserSerializer
)
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from django.core.cache import cache
import requests

# ------------ Permissions -----------

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user

# ------------ ViewSets ------------

class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description", "ingredients__name"]
    ordering_fields = ["created_at", "title"]

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        recipe = self.get_object()
        user = request.user
        rating_value = request.data.get('rating')
        try:
            rating_value = int(rating_value)
        except (ValueError, TypeError):
            return Response({"detail": "Please provide a valid rating between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        if not (1 <= rating_value <= 5):
            return Response({"detail": "Please provide a valid rating between 1 and 5."}, status=status.HTTP_400_BAD_REQUEST)
        rating, created = Rating.objects.update_or_create(
            user=user, recipe=recipe, defaults={"rating": rating_value}
        )
        try:
            create_rating_notification(user, recipe, rating_value)
        except Exception:
            pass
        return Response({
            "rating": rating_value,
            "average_rating": recipe.get_average_rating(),
            "rating_count": recipe.get_rating_count(),
        })

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, pk=None):
        recipe = self.get_object()
        text = request.data.get("text", "").strip()
        if not text:
            return Response({"detail": "Please provide comment text."}, status=status.HTTP_400_BAD_REQUEST)
        comment = Comment.objects.create(user=request.user, recipe=recipe, text=text)
        try:
            create_comment_notification(request.user, recipe)
        except Exception:
            pass
        serializer = CommentSerializer(comment, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def comments(self, request, pk=None):
        recipe = self.get_object()
        comments = recipe.comments.all().order_by('-created_at')
        page = self.paginate_queryset(comments)
        if page is not None:
            serializer = CommentSerializer(page, many=True, context={"request": request})
            return self.get_paginated_response(serializer.data)
        serializer = CommentSerializer(comments, many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def my_recipes(self, request):
        recipes = Recipe.objects.filter(author=request.user)
        serializer = self.get_serializer(recipes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def search(self, request):
        query = request.query_params.get("q", "")
        if query:
            recipes = Recipe.objects.filter(
                Q(title__icontains=query) | Q(ingredients__name__icontains=query)
            ).distinct()
            serializer = self.get_serializer(recipes, many=True)
            return Response(serializer.data)
        return Response([])

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        recipe = self.get_object()
        user = request.user
        favorite, created = Favorite.objects.get_or_create(user=user, recipe=recipe)
        if not created:
            favorite.delete()
            return Response({"status": "unfavorited"})
        return Response({"status": "favorited"})


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class IngredientViewSet(viewsets.ModelViewSet):
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]

# ----- Miscellaneous Views -----

class PersonalizedFeedView(generics.ListAPIView):
    serializer_class = FeedRecipeSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None  # Set PAGE_SIZE in settings or here if needed

    def get_queryset(self):
        following_users = Follow.objects.filter(follower=self.request.user).values_list("following", flat=True)
        return Recipe.objects.filter(author__in=following_users).annotate(
            likes_count=Count("favorited_by", distinct=True),
            comments_count=Count("comments", distinct=True),
            avg_rating=Value(0.0, output_field=FloatField()),  # Use actual avg if needed
        ).order_by('-created_at', '-id')

class ListNotificationsView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        notifications = recent_notifications_for_user(request.user, hours=1)
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)

class GetNotificationCountView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        count = recent_notifications_for_user(request.user, hours=1).count()
        return Response({"count": count})

# ---- Social and ChatBot Views ----

from dj_rest_auth.registration.views import SocialLoginView
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from allauth.socialaccount.providers.oauth2.client import OAuth2Client

class GoogleLogin(SocialLoginView):
    adapter_class = GoogleOAuth2Adapter
    client_class = OAuth2Client
    callback_url = None

class ChatbotView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        message = request.data.get("message", "")
        if not message:
            return Response({"detail": "Message is required."}, status=status.HTTP_400_BAD_REQUEST)
        cache_key = f"chat_count_{user.id}"
        count = cache.get(cache_key)
        if count is None:
            cache.set(cache_key, 1, timeout=3600)
        elif int(count) >= 10:
            return Response({"detail": "Rate limit exceeded (10 requests per hour)."}, status=429)
        else:
            cache.incr(cache_key)

        api_key = getattr(settings, "GENERATIVE_AI_API_KEY", None)
        if not api_key:
            return Response({"detail": "Chatbot API key not configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        system_prompt = (
            "You are a helpful cooking assistant. "
            "Provide cooking advice, ingredient substitutions, and recipe help."
        )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": f"{system_prompt}\n\n{message}"}]}]
        }
        headers = {"Content-Type": "application/json"}

        try:
            resp = requests.post(url, json=payload, headers=headers, timeout=15)
            resp.raise_for_status()
            data = resp.json()
            text = (
                data.get("candidates", [{}])[0]
                .get("content", {})
                .get("parts", [{}])[0]
                .get("text", "No response")
            )
            return Response({"response": text})
        except requests.RequestException as e:
            return Response({"detail": f"Chatbot API request failed: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"detail": f"Unexpected error: {e}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
