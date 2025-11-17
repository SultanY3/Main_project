from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Recipe, Category, Ingredient, Favorite, Comment, Rating, Follow, Notification, Like
from django.db.models import Avg

class AdminUserListSerializer(serializers.ModelSerializer):
    recipe_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'recipe_count']

class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.ReadOnlyField(source='actor.username')
    recipe_title = serializers.ReadOnlyField(source='recipe.title')

    class Meta:
        model = Notification
        fields = ['id', 'type', 'actor_name', 'recipe_title', 'text', 'is_read', 'created_at']
        
class UserSerializer(serializers.ModelSerializer):
    is_following = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', 'is_following', 'followers_count', 'following_count']

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Follow.objects.filter(follower=request.user, following=obj).exists()
        return False

    def get_followers_count(self, obj):
        return obj.followers.count()
    
    def get_following_count(self, obj):
        return obj.following.count()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['name']

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    
    class Meta:
        model = Comment
        fields = ['id', 'user', 'text', 'created_at']

class RecipeSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    ingredients = serializers.ListField(
        child=serializers.CharField(), write_only=True
    )
    ingredients_list = serializers.SerializerMethodField(read_only=True)

    # --- Updated Fields ---
    is_favorite = serializers.SerializerMethodField() # "is_SAVED"
    is_liked = serializers.SerializerMethodField()    # "is_LIKED"
    
    comments = CommentSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    
    likes_count = serializers.SerializerMethodField()     # Public likes
    favorites_count = serializers.SerializerMethodField() # Private saves
    comments_count = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'instructions', 'image', 
            'category', 'category_name', 'ingredients', 'ingredients_list', 
            'author', 'created_at', 
            'is_favorite', 'is_liked', # ✅ Updated
            'comments', 'average_rating', 'rating_count', 
            'likes_count', 'favorites_count', 'comments_count' # ✅ Updated
        ]

    def get_ingredients_list(self, obj):
        return [i.name for i in obj.ingredients.all()]

    def get_is_favorite(self, obj):
        # Checks if user SAVED this (Favorite model)
        user = self.context.get('request').user
        if user and user.is_authenticated:
            return Favorite.objects.filter(user=user, recipe=obj).exists()
        return False
    
    def get_is_liked(self, obj):
        # ✅ New: Checks if user LIKED this (Like model)
        user = self.context.get('request').user
        if user and user.is_authenticated:
            return Like.objects.filter(user=user, recipe=obj).exists()
        return False

    def get_average_rating(self, obj):
        return obj.ratings.aggregate(Avg('score'))['score__avg'] or 0

    def get_rating_count(self, obj):
        return obj.ratings.count()

    def get_likes_count(self, obj):
        # ✅ Changed: Counts from the new 'Like' model
        return obj.likes.count() 

    def get_favorites_count(self, obj):
        # ✅ New: Counts from the 'Favorite' model
        return obj.favorite_set.count()

    def get_comments_count(self, obj):
        return obj.comments.count()

    def create(self, validated_data):
        ingredients_data = validated_data.pop('ingredients', [])
        recipe = Recipe.objects.create(**validated_data)
        for name in ingredients_data:
            ing_obj, _ = Ingredient.objects.get_or_create(name=name.strip())
            recipe.ingredients.add(ing_obj)
        return recipe

    def update(self, instance, validated_data):
        ingredients_data = validated_data.pop('ingredients', None)
        instance = super().update(instance, validated_data)
        
        if ingredients_data is not None:
            instance.ingredients.clear()
            for name in ingredients_data:
                ing_obj, _ = Ingredient.objects.get_or_create(name=name.strip())
                instance.ingredients.add(ing_obj)
        return instance