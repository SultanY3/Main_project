from django.db import migrations


NEW_CATEGORIES = [
    'Vegetarian',
    'Vegan',
    'Chicken',
    'Meat',
    'Fish',
    'Egg',
    'Desserts',
    'Snack',
    'Beverages',
]


def reset_categories(apps, schema_editor):
    Category = apps.get_model('recipes', 'Category')
    # Remove all existing categories
    Category.objects.all().delete()
    # Create the new set
    for name in NEW_CATEGORIES:
        Category.objects.get_or_create(name=name)


def noop(apps, schema_editor):
    # No-op reverse migration; we won't try to reconstruct previous categories
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0004_add_default_categories'),
    ]

    operations = [
        migrations.RunPython(reset_categories, noop),
    ]



