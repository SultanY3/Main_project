from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q, Count
from .models import Recipe, Category, Favorite, Ingredient, Comment, Rating, Follow, Notification, PasswordResetOTP, Like
from .serializers import RecipeSerializer, CategorySerializer, UserSerializer, AdminUserListSerializer, CommentSerializer, NotificationSerializer
from django.contrib.auth.models import User
from .permissions import IsAuthorOrAdminOrReadOnly
from django.core.mail import send_mail
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken
import google.generativeai as genai
import random
from django.utils import timezone
from datetime import timedelta
import os


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
    def like(self, request, pk=None):
        recipe = self.get_object()
        obj, created = Like.objects.get_or_create(user=request.user, recipe=recipe)
        
        if created:
            # Create Notification (only if not liking own recipe)
            if recipe.author != request.user:
                Notification.objects.create(
                    recipient=recipe.author,
                    actor=request.user,
                    type='like',
                    recipe=recipe,
                    text=f"{request.user.username} liked your recipe {recipe.title}"
                )
            return Response({'status': 'liked'})
        else:
            obj.delete()
            return Response({'status': 'unliked'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def favorite(self, request, pk=None):
        recipe = self.get_object()
        obj, created = Favorite.objects.get_or_create(user=request.user, recipe=recipe)
        
        if created:
            return Response({'status': 'added'}) # 'added' to favorites
        else:
            obj.delete()
            return Response({'status': 'removed'})
        
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def feed(self, request):
        """
        Returns a feed of recipes from authors the user follows.
        """
        # Get a list of user IDs that the current user is following
        following_user_ids = request.user.following.values_list('following_id', flat=True)
        
        # Filter recipes where the author is in that list, ordered by most recent
        queryset = Recipe.objects.filter(author_id__in=following_user_ids).order_by('-created_at')
        
        # Use the serializer with context to get all recipe details
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        recipes = Recipe.objects.filter(author=request.user)
        serializer = self.get_serializer(recipes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def comment(self, request, pk=None):
        recipe = self.get_object()
        # Note: We import CommentSerializer inside to avoid circular imports if necessary, 
        # or ensure it's imported at the top
        from .serializers import CommentSerializer 
        
        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user, recipe=recipe)
            
            # ✅ Create Notification
            if recipe.author != request.user:
                Notification.objects.create(
                    recipient=recipe.author,
                    actor=request.user,
                    type='comment',
                    recipe=recipe,
                    text=f"{request.user.username} commented on {recipe.title}"
                )
            
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
    
    # --- Validation ---
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not all([username, email, password]):
        return Response({'error': 'Username, email, and password are required.'}, status=400)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username exists'}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email exists'}, status=400)
    
    # --- Create User ---
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', '')
    )
    
    # --- ✅ Send Welcome Email ---
    try:
        subject = 'Welcome to GohanHub!'
        message = f'Hi {user.first_name},\n\n' \
                  f'Thank you for registering at GohanHub. We are excited to have you join our community of food lovers!\n\n' \
                  f'Happy cooking,\n' \
                  f'The GohanHub Team'
        
        from_email = settings.DEFAULT_FROM_EMAIL
        recipient_list = [user.email]
        
        send_mail(subject, message, from_email, recipient_list)
    
    except Exception as e:
        # We don't want the app to crash if the email fails
        # Log the error to your console
        print(f"Error sending welcome email to {user.email}: {e}")
    # --- End Email Code ---
    
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
    Uses 'username' as the lookup field.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'username' # ✅ Changed from ID to username

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def follow(self, request, username=None): # ✅ Updated param
        target_user = self.get_object()
        
        if request.user == target_user:
            return Response({'error': 'You cannot follow yourself'}, status=400)
        
        obj, created = Follow.objects.get_or_create(follower=request.user, following=target_user)
        
        if created:
            Notification.objects.create(
                recipient=target_user,
                actor=request.user,
                type='follow',
                text=f"{request.user.username} started following you"
            )
            return Response({'status': 'followed'})
        else:
            obj.delete()
            return Response({'status': 'unfollowed'})

    # Get recipes for this public user
    @action(detail=True, methods=['get'])
    def recipes(self, request, username=None):
        user = self.get_object()
        recipes = Recipe.objects.filter(author=user).order_by('-created_at')
        # We reuse the existing RecipeSerializer
        serializer = RecipeSerializer(recipes, many=True, context={'request': request})
        return Response(serializer.data)

class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['post'])
    def read_all(self, request):
        Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
        return Response({'status': 'all marked as read'})
     
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
    
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def google_login(request):
    token = request.data.get('token')
    if not token:
        return Response({'error': 'No token provided'}, status=400)

    try:
        # 1. Verify the token with Google
        CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)

        # 2. Get user info
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        username = email.split('@')[0] # Use part of email as username

        # 3. Check if user exists, or create one
        user, created = User.objects.get_or_create(
            email=email, 
            defaults={
                'username': username,
                'first_name': first_name,
                'last_name': last_name,
            }
        )

        # 4. Generate JWT Tokens manually
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        })

    except ValueError:
        return Response({'error': 'Invalid Google token'}, status=400)
    
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'error': 'Email is required'}, status=400)
    
    try:
        user = User.objects.get(email=email)
        
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Save to DB (Clear old OTPs first)
        PasswordResetOTP.objects.filter(user=user).delete()
        PasswordResetOTP.objects.create(user=user, otp=otp)
        
        # Send Email
        send_mail(
            'Password Reset OTP',
            f'Your OTP for password reset is: {otp}',
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        
        return Response({'status': 'OTP sent'})
    
    except User.DoesNotExist:
        # Security: Don't reveal if user exists or not
        return Response({'status': 'OTP sent'}) 


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def verify_otp(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    
    try:
        user = User.objects.get(email=email)
        record = PasswordResetOTP.objects.filter(user=user, otp=otp).first()
        
        if not record:
            return Response({'error': 'Invalid OTP'}, status=400)
        
        # Check if expired (e.g., 10 mins)
        if timezone.now() > record.created_at + timedelta(minutes=10):
            return Response({'error': 'OTP expired'}, status=400)
            
        return Response({'status': 'OTP verified'})
        
    except User.DoesNotExist:
        return Response({'error': 'Invalid request'}, status=400)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def reset_password(request):
    email = request.data.get('email')
    otp = request.data.get('otp')
    new_password = request.data.get('new_password')
    
    try:
        user = User.objects.get(email=email)
        record = PasswordResetOTP.objects.filter(user=user, otp=otp).first()
        
        if not record:
            return Response({'error': 'Invalid OTP'}, status=400)
            
        if timezone.now() > record.created_at + timedelta(minutes=10):
            return Response({'error': 'OTP expired'}, status=400)
        
        # Reset Password
        user.set_password(new_password)
        user.save()
        
        # Clean up used OTP
        record.delete()
        
        return Response({'status': 'Password reset successful'})
        
    except User.DoesNotExist:
        return Response({'error': 'Invalid request'}, status=400)
    
@api_view(['POST'])
@permission_classes([permissions.AllowAny]) # Allow guests to use it too? Or change to IsAuthenticated
def ai_chat(request):
    user_message = request.data.get('message')
    if not user_message:
        return Response({'error': 'Message is required'}, status=400)

    try:
        # Configure the API
        #  SECURITY : In production, use os.environ.get('GEMINI_API_KEY')
        genai.configure(api_key=os.environ.get('GEMINI_API_KEY')) 
        
        # Initialize Model
        model = genai.GenerativeModel('models/gemini-flash-latest')        
        # Add a system instruction context manually
        prompt = f"You are a helpful cooking assistant named GohanBot. Answer this cooking question: {user_message}"
        
        response = model.generate_content(prompt)
        
        return Response({'response': response.text})
    except Exception as e:
        print("Gemini Error:", e)
        return Response({'error': str(e)}, status=500)