"""
Script to fix duplicate Google OAuth SocialApp entries.
Run this with: python manage.py shell < fix_google_oauth.py
Or run: python manage.py shell, then copy-paste this code.
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gohanhub.settings')
django.setup()

from allauth.socialaccount.models import SocialApp
from django.contrib.sites.models import Site
from django.conf import settings

def fix_duplicate_google_apps():
    """Remove duplicate Google OAuth SocialApp entries, keeping only one."""
    # Get all Google SocialApps
    google_apps = SocialApp.objects.filter(provider='google')
    
    print(f"Found {google_apps.count()} Google SocialApp(s)")
    
    if google_apps.count() <= 1:
        print("No duplicates found. Everything is fine!")
        return
    
    # Get the client_id from settings
    google_provider = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
    app_config = google_provider.get('APP', {})
    expected_client_id = app_config.get('client_id', '')
    
    print(f"Expected client_id from settings: {expected_client_id}")
    
    # Find the app that matches settings
    matching_app = None
    for app in google_apps:
        print(f"  - App ID {app.id}: client_id={app.client_id}, name={app.name}")
        if app.client_id == expected_client_id:
            matching_app = app
    
    if matching_app:
        print(f"\nKeeping app ID {matching_app.id} (matches settings)")
        # Delete all other apps
        apps_to_delete = google_apps.exclude(id=matching_app.id)
        count = apps_to_delete.count()
        apps_to_delete.delete()
        print(f"Deleted {count} duplicate app(s)")
    else:
        # If no match, keep the first one and delete the rest
        print(f"\nNo app matches settings. Keeping first app (ID {google_apps.first().id})")
        apps_to_delete = google_apps.exclude(id=google_apps.first().id)
        count = apps_to_delete.count()
        apps_to_delete.delete()
        print(f"Deleted {count} duplicate app(s)")
    
    print("\nDone! Google OAuth should work now.")

if __name__ == '__main__':
    fix_duplicate_google_apps()


