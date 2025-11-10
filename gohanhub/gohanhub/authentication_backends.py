from django.contrib.auth.backends import BaseBackend
from django.contrib.auth.models import User

class EmailAuthenticationBackend(BaseBackend):
    """
    Custom authentication backend to allow login with email.
    """

    def authenticate(self, request, email=None, password=None, **kwargs):
        if email is None or password is None:
            return None
        try:
            # Case-insensitive email login
            user = User.objects.get(email__iexact=email)
            if user.check_password(password) and self.user_can_authenticate(user):
                return user
        except User.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    def user_can_authenticate(self, user):
        # Standard Django logic for user activation
        return getattr(user, "is_active", True)
