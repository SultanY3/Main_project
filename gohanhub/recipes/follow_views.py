from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User
from .models import Follow
from .utils import create_follow_notification
from .serializers import FollowSerializer, UserFollowStatsSerializer
from recipes.serializers import RecipeSerializer
from recipes.models import Recipe, Favorite

class FollowPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class FollowUserView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = FollowSerializer

    def create(self, request, *args, **kwargs):
        target_user = get_object_or_404(User, id=self.kwargs['user_id'])
        if request.user == target_user:
            return Response(
                {"detail": "You cannot follow yourself."},
                status=status.HTTP_400_BAD_REQUEST
            )

        follow, created = Follow.objects.get_or_create(
            follower=request.user,
            following=target_user
        )
        if not created:
            return Response(
                {"detail": "You are already following this user.", "is_following": True},
                status=status.HTTP_200_OK  # Still return a toggle-able response
            )
        # Create notification for the followed user
        try:
            create_follow_notification(request.user, target_user)
        except Exception:
            pass

        return Response({'is_following': True}, status=status.HTTP_200_OK)

class UnfollowUserView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        target_user = get_object_or_404(User, id=self.kwargs['user_id'])
        try:
            follow = Follow.objects.get(
                follower=request.user,
                following=target_user
            )
            follow.delete()
            return Response({'is_following': False}, status=status.HTTP_200_OK)
        except Follow.DoesNotExist:
            return Response(
                {"detail": "You are not following this user.", "is_following": False},
                status=status.HTTP_200_OK  # Always return state
            )

class UserFollowersView(generics.ListAPIView):
    serializer_class = UserFollowStatsSerializer
    pagination_class = FollowPagination

    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs['user_id'])
        return User.objects.filter(following__following=user)

class UserFollowingView(generics.ListAPIView):
    serializer_class = UserFollowStatsSerializer
    pagination_class = FollowPagination

    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs['user_id'])
        return User.objects.filter(followers__follower=user)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_follow_status(request, user_id):
    target_user = get_object_or_404(User, id=user_id)
    if request.user == target_user:
        return Response({
            "is_following": None,
            "message": "This is your own profile"
        })
    is_following = Follow.objects.filter(
        follower=request.user,
        following=target_user
    ).exists()
    return Response({
        "is_following": is_following
    })

class UserProfileView(generics.RetrieveAPIView):
    """Retrieve basic user profile info plus follow stats."""
    serializer_class = UserFollowStatsSerializer
    # Allow public access to view user profile/stats; follow/unfollow actions still require auth
    permission_classes = [AllowAny]

    def get_object(self):
        user = get_object_or_404(User, id=self.kwargs['user_id'])
        return user

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_me_view(request):
    """Return profile/stats for the current authenticated user."""
    serializer = UserFollowStatsSerializer(request.user, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user. Expects username, email, password."""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    if not username or not password:
        return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username=username).exists():
        return Response({'detail': 'Username already exists.'}, status=status.HTTP_400_BAD_REQUEST)
    user = User.objects.create_user(username=username, email=email, password=password)
    serializer = UserFollowStatsSerializer(user, context={'request': request})
    return Response(serializer.data, status=status.HTTP_201_CREATED)

class UserRecipesView(generics.ListAPIView):
    """List recipes authored by a given user."""
    serializer_class = RecipeSerializer
    pagination_class = FollowPagination

    def get_queryset(self):
        user = get_object_or_404(User, id=self.kwargs['user_id'])
        return Recipe.objects.filter(author=user).order_by('-created_at')

class MyFavoritesView(generics.ListAPIView):
    """List recipes favorited by the current user."""
    serializer_class = RecipeSerializer
    pagination_class = FollowPagination
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Recipe.objects.filter(favorited_by=self.request.user).distinct().order_by('-created_at')
