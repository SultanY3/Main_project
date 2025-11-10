from django.contrib import admin
from .models import Recipe, Category, Ingredient, Favorite, Follow, Rating, Comment, Notification

# Admin display for Recipe
@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'category', 'created_at')
    search_fields = ('title', 'author__username', 'category__name')
    list_filter = ('category', 'author')
    ordering = ('-created_at',)
    filter_horizontal = ('ingredients',)

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    ordering = ('name',)

@admin.register(Favorite)
class FavoriteAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'recipe')
    search_fields = ('user__username', 'recipe__title')
    ordering = ('-id',)

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ('id', 'follower', 'following', 'created_at')
    search_fields = ('follower__username', 'following__username')
    ordering = ('-created_at',)

@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'recipe', 'rating', 'created_at')
    search_fields = ('user__username', 'recipe__title')
    list_filter = ('rating',)
    ordering = ('-created_at',)

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'recipe', 'created_at')
    search_fields = ('user__username', 'recipe__title', 'text')
    ordering = ('-created_at',)

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'recipient', 'sender', 'notification_type', 'created_at')
    search_fields = ('recipient__username', 'notification_type', 'message')
    ordering = ('-created_at',)
