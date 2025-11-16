from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count
from .models import Recipe, Category, Favorite, Ingredient, Comment, Rating, Follow
from .serializers import RecipeSerializer, CategorySerializer, UserSerializer, AdminUserListSerializer, CommentSerializer
from django.contrib.auth.models import User
from .permissions import IsAuthorOrAdminOrReadOnly

# Handles Recipes (List, Create, Update, Delete)
class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all().order_by('-created_at')
    serializer_class = RecipeSerializer
    # This single permission class handles all security
    permission_classes = [IsAuthorOrAdminOrReadOnly]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'ingredients__name']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__name__iexact=category)
        return queryset
    
    # This provides the context for the 'is_favorite' field
    def get_serializer_context(self):
        return {'request': self.request}

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        recipe = self.get_object()
        obj, created = Favorite.objects.get_or_create(user=request.user, recipe=recipe)
        if not created:
            obj.delete()
            return Response({'status': 'removed'})
        return Response({'status': 'added'})

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        recipes = Recipe.objects.filter(author=request.user)
        serializer = self.get_serializer(recipes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, pk=None):
        recipe = self.get_object()
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, recipe=recipe)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        recipe = self.get_object()
        score = request.data.get('score')
        
        if not score or not (1 <= int(score) <= 5):
            return Response({'error': 'Score must be between 1 and 5'}, status=400)

        # Create or Update rating
        Rating.objects.update_or_create(
            user=request.user, 
            recipe=recipe,
            defaults={'score': score}
        )
        return Response({'status': 'rated'})
    
# Handles Categories
class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by('name')
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny] # Anyone can see categories

# Handles User Registration
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register(request):
    data = request.data
    if User.objects.filter(username=data.get('username')).exists():
        return Response({'error': 'Username exists'}, status=400)
    
    user = User.objects.create_user(
        username=data['username'],
        email=data.get('email'),
        password=data['password'],
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )
    return Response(UserSerializer(user).data)

# Handles "My Favorites" list
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_favorites(request):
    favs = Favorite.objects.filter(user=request.user)
    recipes = [f.recipe for f in favs]
    serializer = RecipeSerializer(recipes, many=True, context={'request': request})
    return Response(serializer.data)

# Handles User Profile (Get/Update "me")
class UserProfileView(viewsets.GenericViewSet):
    serializer_class = UserSerializer
    # Correct permission: Only authenticated users can see their own profile
    permission_classes = [permissions.IsAuthenticated] 

    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        user = request.user
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        # Handle Update
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
    
class PublicUserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    View public user profiles and handle following.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] # Anyone can view profiles

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, pk=None):
        target_user = self.get_object()
        
        # Prevent self-following
        if request.user == target_user:
            return Response({'error': 'You cannot follow yourself'}, status=400)
        
        # Toggle Follow
        obj, created = Follow.objects.get_or_create(follower=request.user, following=target_user)
        if not created:
            obj.delete()
            return Response({'status': 'unfollowed'})
        
        return Response({'status': 'followed'})
    
# Handles Admin-specific actions
class AdminDashboardViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAdminUser]

    # GET /api/admin-dashboard/users/
    @action(detail=False, methods=['get'])
    def users(self, request):
        users = User.objects.filter(is_superuser=False).annotate(
            recipe_count=Count('recipe')
        ).order_by('-date_joined')
        serializer = AdminUserListSerializer(users, many=True)
        return Response(serializer.data)

    # DELETE /api/admin-dashboard/users/{pk}/
    # ✅ THE FIX: Changed detail=True to detail=False
    @action(detail=False, methods=['delete'], url_path='users/(?P<pk>[^/.]+)')
    def delete_user(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk, is_superuser=False)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

    # GET /api/admin-dashboard/recipes/
    @action(detail=False, methods=['get'])
    def recipes(self, request):
        recipes = Recipe.objects.all().order_by('-created_at')
        # Pass context for the serializer
        serializer = RecipeSerializer(recipes, many=True, context={'request': request})       
        return Response(serializer.data)