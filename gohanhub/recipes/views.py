from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import HttpResponse
from django.contrib import messages
from .models import Recipe, Category, Favorite, Ingredient
from django.db.models import Q
import re

# ---- USER AUTHENTICATION ----

def register(request):
    categories = Category.objects.all().order_by('name')
    if request.method == "POST":
        username = request.POST.get('username', '').strip()
        email = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password', '')
        confirm_password = request.POST.get('confirm_password', '')

        if not all([username, email, password, confirm_password]):
            messages.error(request, "All fields are required.")
            return render(request, "register.html", {"categories": categories})

        if len(username) < 3 or len(username) > 150:
            messages.error(request, "Username must be between 3 and 150 characters.")
            return render(request, "register.html", {"categories": categories})

        if not re.match(r'^[a-zA-Z0-9.\-]+$', username):
            messages.error(request, "Username can only contain letters, numbers, and .- characters.")
            return render(request, "register.html", {"categories": categories})

        if User.objects.filter(username=username).exists():
            messages.error(request, "Username already exists. Please choose a different username.")
            return render(request, "register.html", {"categories": categories})

        if User.objects.filter(email=email).exists():
            messages.error(request, "Email already exists.")
            return render(request, "register.html", {"categories": categories})

        if len(password) < 8:
            messages.error(request, "Password must be at least 8 characters long.")
            return render(request, "register.html", {"categories": categories})

        if password != confirm_password:
            messages.error(request, "Passwords do not match.")
            return render(request, "register.html", {"categories": categories})

        try:
            user = User.objects.create_user(username=username, email=email, password=password)
            messages.success(request, "Account created successfully! Please log in.")
            return redirect("login")
        except Exception as e:
            messages.error(request, f"Registration failed: {str(e)}")
            return render(request, "register.html", {"categories": categories})

    return render(request, "register.html", {"categories": categories})

def login_view(request):
    categories = Category.objects.all().order_by('name')
    if request.method == "POST":
        email = request.POST.get('email', '').strip().lower()
        password = request.POST.get('password', '')

        if not all([email, password]):
            messages.error(request, "Email and password are required.")
            return render(request, "login.html", {"categories": categories})

        user = authenticate(request, email=email, password=password)
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next', 'home')
            return redirect(next_url)
        else:
            messages.error(request, "Invalid email or password.")
            return render(request, "login.html", {"categories": categories})
    return render(request, "login.html", {"categories": categories})

@login_required(login_url="login")
def logout_view(request):
    logout(request)
    messages.success(request, "You have been logged out.")
    return redirect("home")

# ---- PAGE VIEWS ----

def home(request):
    recipes = Recipe.objects.all().order_by("-created_at")
    search_query = request.GET.get("search", "").strip()
    category_name = request.GET.get("category", "").strip()
    if search_query:
        recipes = recipes.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(ingredients__name__icontains=search_query)
        ).distinct()
    if category_name:
        recipes = recipes.filter(category__name__iexact=category_name)
    categories = Category.objects.all().order_by("name")
    if request.user.is_authenticated and request.user.is_superuser:
        return redirect("admin_home")
    return render(request, "home.html", {
        "recipes": recipes,
        "categories": categories,
        "search_query": search_query
    })

@login_required(login_url="login")
def profile(request):
    categories = Category.objects.all().order_by('name')
    user_recipes = Recipe.objects.filter(author=request.user).order_by('-created_at')
    return render(request, "profile.html", {
        "user": request.user,
        "user_recipes": user_recipes,
        "categories": categories,
        "recipes_count": user_recipes.count()
    })

@login_required(login_url="login")
def update_profile(request):
    categories = Category.objects.all().order_by('name')
    if request.method == "POST":
        first_name = request.POST.get('first_name', '').strip()
        last_name = request.POST.get('last_name', '').strip()
        email = request.POST.get('email', '').strip().lower()
        if not all([first_name, last_name, email]):
            messages.error(request, "All fields are required.")
            return render(request, "updateprofile.html", {"categories": categories})

        if User.objects.filter(email=email).exclude(id=request.user.id).exists():
            messages.error(request, "Email already exists.")
            return render(request, "updateprofile.html", {"categories": categories})

        user = request.user
        user.first_name = first_name
        user.last_name = last_name
        user.email = email
        user.save()
        messages.success(request, "Profile updated successfully!")
        return redirect("profile")
    return render(request, "updateprofile.html", {"categories": categories})

@login_required(login_url="login")
def add_recipe(request):
    categories = Category.objects.all().order_by('name')
    if request.method == "POST":
        title = request.POST.get('title', '').strip()
        description = request.POST.get('description', '').strip()
        instructions = request.POST.get('instructions', '').strip()
        image = request.FILES.get('image')
        category_id = request.POST.get('category')
        ingredients_input = request.POST.get('ingredients', '').strip()
        if not title:
            messages.error(request, "Title is required.")
            return render(request, "addrecipe.html", {"categories": categories})
        if not instructions:
            messages.error(request, "Instructions are required.")
            return render(request, "addrecipe.html", {"categories": categories})
        recipe = Recipe.objects.create(
            author=request.user, title=title,
            description=description, instructions=instructions,
            image=image
        )
        if category_id:
            try:
                recipe.category = Category.objects.get(id=category_id)
                recipe.save()
            except Category.DoesNotExist:
                messages.warning(request, "Selected category not found.")
        if ingredients_input:
            for ing_name in [ing.strip() for ing in ingredients_input.split(",") if ing.strip()]:
                ingredient, _ = Ingredient.objects.get_or_create(name=ing_name)
                recipe.ingredients.add(ingredient)
        messages.success(request, "Recipe added successfully!")
        return redirect("recipedetail", id=recipe.id)
    return render(request, "addrecipe.html", {"categories": categories})

@login_required(login_url="login")
def edit_recipe(request, id):
    try:
        if request.user.is_superuser:
            recipe = Recipe.objects.get(id=id)
        else:
            recipe = Recipe.objects.get(id=id, author=request.user)
    except Recipe.DoesNotExist:
        messages.error(request, "Recipe not found or you don’t have permission to edit it.")
        return redirect("home")
    categories = Category.objects.all().order_by('name')
    if request.method == "POST":
        title = request.POST.get('title', '').strip()
        description = request.POST.get('description', '').strip()
        instructions = request.POST.get('instructions', '').strip()

        if not title or not instructions:
            messages.error(request, "Title and instructions are required.")
            return render(request, "editrecipe.html", {"recipe": recipe, "categories": categories})

        recipe.title = title
        recipe.description = description
        recipe.instructions = instructions

        category_id = request.POST.get('category')
        if category_id:
            try:
                recipe.category = Category.objects.get(id=category_id)
            except Category.DoesNotExist:
                messages.warning(request, "Selected category not found.")
        if request.FILES.get('image'):
            recipe.image = request.FILES['image']
        recipe.save()

        ingredients_input = request.POST.get('ingredients', '').strip()
        recipe.ingredients.clear()
        if ingredients_input:
            for ing_name in [ing.strip() for ing in ingredients_input.split(",") if ing.strip()]:
                ingredient, _ = Ingredient.objects.get_or_create(name=ing_name)
                recipe.ingredients.add(ingredient)
        messages.success(request, "Recipe updated successfully!")
        return redirect("recipedetail", id=recipe.id)
    return render(request, "editrecipe.html", {"recipe": recipe, "categories": categories})

@login_required(login_url="login")
def delete_recipe(request, id):
    try:
        if request.user.is_superuser:
            recipe = Recipe.objects.get(id=id)
        else:
            recipe = Recipe.objects.get(id=id, author=request.user)
    except Recipe.DoesNotExist:
        messages.error(request, "Recipe not found or you don’t have permission to delete it.")
        return redirect("profile")
    if request.method == "POST":
        recipe_title = recipe.title
        recipe.delete()
        messages.success(request, f"Recipe '{recipe_title}' deleted successfully!")
        return redirect("profile")
    return render(request, "confirmdelete.html", {"recipe": recipe})

def recipe_detail(request, id):
    try:
        recipe = Recipe.objects.get(id=id)
        is_favorite = False
        if request.user.is_authenticated:
            is_favorite = Favorite.objects.filter(user=request.user, recipe=recipe).exists()
        categories = Category.objects.all().order_by('name')
        ingredients_list = recipe.ingredients.all()
        return render(request, "recipedetail.html", {
            "recipe": recipe,
            "is_favorite": is_favorite,
            "categories": categories,
            "ingredients_list": ingredients_list
        })
    except Recipe.DoesNotExist:
        messages.error(request, "Recipe not found.")
        return redirect("home")

@login_required(login_url="login")
def toggle_favorite(request, id):
    try:
        recipe = Recipe.objects.get(id=id)
        favorite, created = Favorite.objects.get_or_create(user=request.user, recipe=recipe)
        if not created:
            favorite.delete()
            messages.success(request, f"Removed {recipe.title} from favorites!")
        else:
            messages.success(request, f"Added {recipe.title} to favorites!")
        return redirect("recipedetail", id=id)
    except Recipe.DoesNotExist:
        messages.error(request, "Recipe not found.")
        return redirect("home")

@login_required(login_url="login")
def my_favorites(request):
    favorites = Favorite.objects.filter(user=request.user).select_related("recipe").order_by("-id")
    categories = Category.objects.all().order_by('name')
    return render(request, "favorites.html", {
        "favorites": favorites,
        "categories": categories,
        "favorites_count": favorites.count()
    })

# ---- ADMIN VIEWS ----

def is_superuser(user):
    return user.is_authenticated and user.is_superuser

@user_passes_test(is_superuser)
def admin_home(request):
    total_users = User.objects.filter(is_superuser=False).count()
    total_recipes = Recipe.objects.count()
    total_categories = Category.objects.count()
    return render(request, "adminhome.html", {
        "total_users": total_users,
        "total_recipes": total_recipes,
        "total_categories": total_categories
    })

@user_passes_test(is_superuser)
def manage_users(request):
    users = User.objects.filter(is_superuser=False).order_by("date_joined")
    search_query = request.GET.get("search", "").strip()
    if search_query:
        users = users.filter(
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query)
        )
    total_users = users.count()
    return render(request, "manageusers.html", {
        "users": users,
        "search_query": search_query,
        "total_users": total_users
    })

@user_passes_test(is_superuser)
def delete_user(request, user_id):
    if request.method == "POST":
        try:
            user = User.objects.get(id=user_id, is_superuser=False)
            username = user.username
            user.delete()
            messages.success(request, f"User '{username}' has been deleted.")
        except User.DoesNotExist:
            messages.error(request, "User not found or cannot delete admin users.")
    return redirect("manageusers")

@user_passes_test(is_superuser)
def manage_recipes(request):
    recipes = Recipe.objects.all().select_related("author", "category").order_by("-created_at")
    category_id = request.GET.get("category")
    if category_id:
        recipes = recipes.filter(category_id=category_id)
    search_query = request.GET.get("search", "").strip()
    if search_query:
        recipes = recipes.filter(
            Q(title__icontains=search_query) |
            Q(description__icontains=search_query) |
            Q(author__username__icontains=search_query)
        )
    categories = Category.objects.all().order_by('name')
    return render(request, "managerecipes.html", {
        "recipes": recipes,
        "categories": categories,
        "selected_category": category_id,
        "search_query": search_query,
        "total_recipes": recipes.count()
    })
