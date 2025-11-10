from django.contrib.auth import get_user_model,authenticate
from rest_framework import serializers
from dj_rest_auth.serializers import LoginSerializer
from dj_rest_auth.registration.serializers import RegisterSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError

User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    """
    Custom user serializer that includes username and email for display.
    Used for user profile and authentication responses.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']

class CustomLoginSerializer(LoginSerializer):
    username = None  # Remove username field
    email = serializers.EmailField(required=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        if email and password:
            # Use authenticate with email directly
            user = authenticate(self.context['request'], email=email, password=password)
            if not user:
                raise serializers.ValidationError("Invalid login credentials.")
        else:
            raise serializers.ValidationError('Both "email" and "password" are required.')
        attrs['user'] = user
        return attrs

class CustomRegisterSerializer(RegisterSerializer):
    """
    Custom registration serializer that requires username, email, and password.
    Users must choose their own unique username.
    """
    username = serializers.CharField(
        required=True,
        max_length=150,
        min_length=3,
        help_text="Required. 3-150 characters. Letters, digits and @/./+/-/_ only.",
        error_messages={
            'required': 'Username is required.',
            'min_length': 'Username must be at least 3 characters long.',
            'max_length': 'Username cannot exceed 150 characters.',
        }
    )
    email = serializers.EmailField(
        required=True,
        error_messages={
            'required': 'Email address is required.',
            'invalid': 'Please enter a valid email address.',
        }
    )
    password1 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        error_messages={
            'required': 'Password is required.',
        }
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'},
        error_messages={
            'required': 'Password confirmation is required.',
        }
    )

    def validate_username(self, value):
        """Validate that username is unique and meets requirements."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "A user with that username already exists."
            )
        import re
        if not re.match(r'^[a-zA-Z0-9@.+_-]+$', value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and @/./+/-/_ characters."
            )
        return value

    def validate_email(self, value):
        """Validate that email is unique."""
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError(
                "A user with that email address already exists."
            )
        return value.lower()

    def validate_password1(self, value):
        """Validate password using Django's password validators."""
        try:
            validate_password(value)
        except DjangoValidationError as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def validate(self, attrs):
        """Ensure that the two passwords match."""
        if attrs.get('password1') != attrs.get('password2'):
            raise serializers.ValidationError({
                'password2': 'Password fields did not match.'
            })
        return attrs

    def get_cleaned_data(self):
        """
        Return cleaned data for user creation.
        Used by dj-rest-auth to create the user.
        """
        return {
            'username': self.validated_data.get('username', ''),
            'email': self.validated_data.get('email', ''),
            'password1': self.validated_data.get('password1', ''),
            'password2': self.validated_data.get('password2', ''),
        }

    def save(self, request):
        """
        Save and return the new user instance.
        """
        user = super().save(request)
        return user

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
