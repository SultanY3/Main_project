from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def send_welcome_email(user):
    try:
        subject = "Welcome to GohanHub!"
        site_url = getattr(settings, "SITE_URL", "http://localhost:3000")
        context = {
            "username": user.username,
            "email": user.email,
            "site_url": site_url,
        }
        html_content = render_to_string("emails/welcome.html", context)
        text_content = f"Hi {user.username}, welcome to GohanHub! Visit {site_url} to get started."
        from_email = settings.DEFAULT_FROM_EMAIL
        to = [user.email]

        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        logger.info(f"Sent welcome email to {user.email}")
    except Exception as e:
        logger.exception(f"Failed to send welcome email to {getattr(user, 'email', None)}: {e}")
