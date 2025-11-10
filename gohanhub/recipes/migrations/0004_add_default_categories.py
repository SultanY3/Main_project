from django.db import migrations

def create_default_categories(apps, schema_editor):
    Category = apps.get_model('recipes', 'Category')
    categories = [
        'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack',
        'Appetizer', 'Soup', 'Salad', 'Beverage',
        'Main Course', 'Side Dish', 'Vegetarian', 'Vegan'
    ]
    for cat in categories:
        Category.objects.get_or_create(name=cat)

class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0003_category_recipe_category'),  # update this
    ]

    operations = [
        migrations.RunPython(create_default_categories),
    ]
