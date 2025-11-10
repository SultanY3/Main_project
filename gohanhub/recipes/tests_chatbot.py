from django.test import TestCase
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from django.urls import reverse
from unittest.mock import patch, Mock
from rest_framework import status
import json

class ChatbotAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_authenticate(user=self.user)
        self.url = reverse('chatbot')
        # Ensure tests have a generative AI key configured
        from django.conf import settings as dj_settings
        dj_settings.GENERATIVE_AI_API_KEY = 'test-key'
        # Clear cache so rate-limit counters don't leak between tests
        from django.core.cache import cache
        cache.clear()

    @patch('recipes.api_views.requests.post')
    def test_chatbot_success(self, mock_post):
        # Mock a successful generative AI response
        mock_resp = Mock()
        mock_resp.raise_for_status = Mock()
        mock_resp.json.return_value = {
            'candidates': [
                {'content': {'parts': [{'text': 'This is a helpful cooking answer.'}]}}
            ]
        }
        mock_post.return_value = mock_resp
        response = self.client.post(self.url, {'message': 'How do I boil an egg?'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('response', response.data)
        self.assertEqual(response.data['response'], 'This is a helpful cooking answer.')

    @patch('recipes.api_views.requests.post')
    def test_chatbot_rate_limit(self, mock_post):
        # Ensure rate limiting after 10 requests
        mock_resp = Mock()
        mock_resp.raise_for_status = Mock()
        mock_resp.json.return_value = {'candidates': [{'content': {'parts': [{'text': 'ok'}]}}]}
        mock_post.return_value = mock_resp
        # The first 10 requests should succeed
        for i in range(10):
            r = self.client.post(self.url, {'message': f'msg {i}'}, format='json')
            self.assertEqual(r.status_code, status.HTTP_200_OK)
        # 11th should be rate limited
        r = self.client.post(self.url, {'message': 'one more'}, format='json')
        self.assertEqual(r.status_code, 429)
        self.assertIn('detail', r.data)
        self.assertEqual(r.data['detail'], 'Rate limit exceeded (10 requests per hour).')
