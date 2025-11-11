"""
Django management command to fix duplicate Google OAuth SocialApp entries.

Usage:
    python manage.py fix_google_oauth
"""

from django.core.management.base import BaseCommand
from allauth.socialaccount.models import SocialApp
from django.conf import settings


class Command(BaseCommand):
    help = 'Remove duplicate Google OAuth SocialApp entries, keeping only one'

    def handle(self, *args, **options):
        # Get all Google SocialApps
        google_apps = SocialApp.objects.filter(provider='google')
        
        self.stdout.write(f"Found {google_apps.count()} Google SocialApp(s)")
        
        if google_apps.count() <= 1:
            self.stdout.write(self.style.SUCCESS("No duplicates found. Everything is fine!"))
            return
        
        # Get the client_id from settings
        google_provider = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
        app_config = google_provider.get('APP', {})
        expected_client_id = app_config.get('client_id', '')
        
        self.stdout.write(f"Expected client_id from settings: {expected_client_id}")
        
        # Find the app that matches settings
        matching_app = None
        for app in google_apps:
            self.stdout.write(f"  - App ID {app.id}: client_id={app.client_id}, name={app.name}")
            if app.client_id == expected_client_id:
                matching_app = app
        
        if matching_app:
            self.stdout.write(f"\nKeeping app ID {matching_app.id} (matches settings)")
            # Delete all other apps
            apps_to_delete = google_apps.exclude(id=matching_app.id)
            count = apps_to_delete.count()
            apps_to_delete.delete()
            self.stdout.write(self.style.SUCCESS(f"Deleted {count} duplicate app(s)"))
        else:
            # If no match, keep the first one and delete the rest
            first_app = google_apps.first()
            self.stdout.write(f"\nNo app matches settings. Keeping first app (ID {first_app.id})")
            apps_to_delete = google_apps.exclude(id=first_app.id)
            count = apps_to_delete.count()
            apps_to_delete.delete()
            self.stdout.write(self.style.SUCCESS(f"Deleted {count} duplicate app(s)"))
        
        self.stdout.write(self.style.SUCCESS("\nDone! Google OAuth should work now."))


