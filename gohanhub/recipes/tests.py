from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from recipes.models import Follow, Recipe, Category, Favorite
from django.db import IntegrityError
from datetime import datetime

# --- MODEL TESTS ---

class FollowTests(TestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='pass123!')
        self.user2 = User.objects.create_user(username='user2', password='pass123!')

    def test_follow_creation(self):
        follow = Follow.objects.create(follower=self.user1, following=self.user2)
        self.assertEqual(follow.follower, self.user1)
        self.assertEqual(follow.following, self.user2)
        self.assertTrue(isinstance(follow.created_at, datetime))

    def test_prevent_self_follow(self):
        with self.assertRaises(ValueError):
            Follow.objects.create(follower=self.user1, following=self.user1)

    def test_prevent_duplicate_follow(self):
        Follow.objects.create(follower=self.user1, following=self.user2)
        with self.assertRaises(IntegrityError):
            Follow.objects.create(follower=self.user1, following=self.user2)


# --- API TESTS ---

class FollowAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='pass123!')
        self.user2 = User.objects.create_user(username='user2', password='pass123!')
        self.user3 = User.objects.create_user(username='user3', password='pass123!')
        self.category = Category.objects.create(name='Test Category')
        self.recipe = Recipe.objects.create(
            author=self.user2, title='Test Recipe',
            description='Test Description', instructions='Test Instructions', category=self.category
        )
        self.client.force_authenticate(user=self.user1)

    def test_follow_user(self):
        url = reverse('follow-user', args=[self.user2.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Follow.objects.filter(follower=self.user1, following=self.user2).exists())
        self.assertEqual(response.data['follower_count'], 1)
        self.assertTrue(response.data['is_following'])

    def test_unfollow_user(self):
        Follow.objects.create(follower=self.user1, following=self.user2)
        url = reverse('unfollow-user', args=[self.user2.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(Follow.objects.filter(follower=self.user1, following=self.user2).exists())
        self.assertEqual(response.data['follower_count'], 0)
        self.assertFalse(response.data['is_following'])

    def test_follow_status(self):
        url = reverse('follow-status', args=[self.user2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_following'])
        # After follow
        Follow.objects.create(follower=self.user1, following=self.user2)
        response = self.client.get(url)
        self.assertTrue(response.data['is_following'])

    def test_followers_list(self):
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user3, following=self.user2)
        url = reverse('user-followers', args=[self.user2.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_following_list(self):
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user1, following=self.user3)
        url = reverse('user-following', args=[self.user1.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

class FavoriteAPITests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='pass123!')
        self.user2 = User.objects.create_user(username='user2', password='pass123!')
        self.category = Category.objects.create(name='Test Category')
        self.recipe = Recipe.objects.create(
            author=self.user2, title='Test Recipe', description='Test Description',
            instructions='Test Instructions', category=self.category
        )
        self.client.force_authenticate(user=self.user1)

    def test_favorite_recipe(self):
        url = reverse('recipe-favorite', args=[self.recipe.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'favorited')
        self.assertTrue(self.recipe.favorited_by.filter(id=self.user1.id).exists())

    def test_unfavorite_recipe(self):
        self.recipe.favorited_by.add(self.user1)
        url = reverse('recipe-favorite', args=[self.recipe.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'unfavorited')
        self.assertFalse(self.recipe.favorited_by.filter(id=self.user1.id).exists())

    def test_my_favorites(self):
        recipe2 = Recipe.objects.create(
            author=self.user2, title='Another Recipe', description='Another Description',
            instructions='More Instructions', category=self.category
        )
        self.recipe.favorited_by.add(self.user1)
        recipe2.favorited_by.add(self.user1)
        url = reverse('my-favorites')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

class PersonalizedFeedTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(username='user1', password='pass123!')
        self.user2 = User.objects.create_user(username='user2', password='pass123!')
        self.user3 = User.objects.create_user(username='user3', password='pass123!')
        self.category = Category.objects.create(name='Test Category')
        # Recipes for user2 and user3
        self.recipe1 = Recipe.objects.create(
            author=self.user2, title='User2 Recipe 1', description='Test Description',
            instructions='Test Instructions', category=self.category
        )
        self.recipe2 = Recipe.objects.create(
            author=self.user3, title='User3 Recipe 1', description='Test Description',
            instructions='Test Instructions', category=self.category
        )
        self.client.force_authenticate(user=self.user1)

    def test_feed_shows_followed_users_recipes(self):
        Follow.objects.create(follower=self.user1, following=self.user2)
        url = reverse('personalized-feed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.recipe1.id)
        self.assertEqual(response.data['results'][0]['author'], self.user2.username)

    def test_feed_empty_when_not_following(self):
        url = reverse('personalized-feed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    def test_feed_ordered_by_created_at(self):
        Follow.objects.create(follower=self.user1, following=self.user2)
        Follow.objects.create(follower=self.user1, following=self.user3)
        # Create new recipe for user2
        recipe3 = Recipe.objects.create(
            author=self.user2, title='User2 Recipe 2', description='Newer Recipe',
            instructions='Test Instructions', category=self.category
        )
        url = reverse('personalized-feed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
        self.assertEqual(response.data['results'][0]['id'], recipe3.id)

    def test_feed_requires_authentication(self):
        self.client.force_authenticate(user=None)
        url = reverse('personalized-feed')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
