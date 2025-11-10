from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from .email_utils import send_welcome_email  # Adjust import as per your project structure

User = get_user_model()

@receiver(post_save, sender=User)
def send_welcome_on_create(sender, instance, created, **kwargs):
    # Only send when a new user is created
    if created:
        try:
            send_welcome_email(instance)
        except Exception:
            # Errors are already logged in email_utils; keep silent here.
            pass
