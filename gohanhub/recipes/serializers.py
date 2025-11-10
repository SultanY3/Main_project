from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Recipe, Category, Ingredient, Favorite, Follow, Rating, Comment, Notification

# ---- UTILITY SERIALIZERS ----
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

# ---- MAIN SERIALIZERS ----

class NotificationSerializer(serializers.ModelSerializer):
    sender = serializers.SerializerMethodField()
    recipe = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'sender', 'notification_type', 'recipe', 'message', 'created_at', 'time_ago']

    def get_sender(self, obj):
        if not obj.sender:
            return None
        return {
            "id": obj.sender.id,
            "username": obj.sender.username,
            "profile_picture": None  # Add if you support profiles
        }

    def get_recipe(self, obj):
        if not obj.recipe:
            return None
        return {
            "id": obj.recipe.id,
            "title": obj.recipe.title,
        }

    def get_time_ago(self, obj):
        from django.utils.timesince import timesince
        from django.utils import timezone
        return timesince(obj.created_at, timezone.now()) + " ago"

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']
        read_only_fields = ['id']

class IngredientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ['id', 'name']
        read_only_fields = ['id']

class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Favorite
        fields = ['id', 'user', 'recipe']
        read_only_fields = ['id', 'user']

class RecipeSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), write_only=True, source="category", required=False, allow_null=True)
    ingredients = IngredientSerializer(many=True, read_only=True)
    ingredient_ids = serializers.PrimaryKeyRelatedField(queryset=Ingredient.objects.all(), many=True, write_only=True, source="ingredients", required=False)
    is_favorite = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'author', 'title', 'description', 'instructions', 'ingredients', 'ingredient_ids',
            'category', 'category_id', 'image', 'created_at',
            'is_favorite', 'average_rating', 'rating_count', 'user_rating', 'comment_count'
        ]
        read_only_fields = ['id', 'created_at', 'author']

    def get_is_favorite(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, recipe=obj).exists()
        return False

    def get_average_rating(self, obj):
        return obj.get_average_rating()

    def get_rating_count(self, obj):
        return obj.get_rating_count()

    def get_user_rating(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            try:
                rating = Rating.objects.get(user=request.user, recipe=obj)
                return rating.rating
            except Rating.DoesNotExist:
                return None
        return None

    def get_comment_count(self, obj):
        return obj.comments.count()

    def create(self, validated_data):
        ingredients = validated_data.pop("ingredients", [])
        recipe = Recipe.objects.create(**validated_data)
        for ingredient in ingredients:
            recipe.ingredients.add(ingredient)
        return recipe

    def update(self, instance, validated_data):
        ingredients = validated_data.pop("ingredients", None)
        category = validated_data.get("category", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if category is not None:
            instance.category = category
        instance.save()
        if ingredients is not None:
            instance.ingredients.clear()
            for ingredient in ingredients:
                instance.ingredients.add(ingredient)
        return instance

class RatingSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Rating
        fields = ['id', 'user', 'recipe', 'rating', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value

class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ['id', 'user', 'recipe', 'text', 'created_at', 'updated_at', 'is_owner']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.user == request.user
        return False

# ---- FEED & USER SERIALIZERS ----
class FeedRecipeSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    likes_count = serializers.IntegerField(source="favorited_by.count", read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)
    avg_rating = serializers.FloatField(source="get_average_rating", read_only=True)
    is_favorite = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'image', 'author', 'created_at',
            'likes_count', 'comments_count', 'avg_rating', 'is_favorite'
        ]

    def get_author(self, obj):
        return obj.author.username

    def get_is_favorite(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return Favorite.objects.filter(user=request.user, recipe=obj).exists()
        return False

class FollowSerializer(serializers.ModelSerializer):
    follower = UserSerializer(read_only=True)
    following = UserSerializer(read_only=True)

    class Meta:
        model = Follow
        fields = ['id', 'follower', 'following', 'created_at']
        read_only_fields = ['id', 'created_at']

class UserFollowStatsSerializer(serializers.ModelSerializer):
    follower_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    recipes_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'follower_count', 'following_count', 'is_following', 'recipes_count'
        ]

    def get_follower_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_is_following(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if request.user == obj:
                return None  # Can't follow yourself
            return obj.followers.filter(follower=request.user).exists()
        return False

    def get_recipes_count(self, obj):
        return Recipe.objects.filter(author=obj).count()
