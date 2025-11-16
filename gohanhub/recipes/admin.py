from django.contrib import admin
from .models import Recipe, Category, Ingredient, Favorite

# Register your models here.
admin.site.register(Recipe)
admin.site.register(Category)
admin.site.register(Ingredient)
admin.site.register(Favorite)