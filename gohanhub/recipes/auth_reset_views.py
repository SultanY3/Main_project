from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
import random

OTP_TTL_SECONDS = 15 * 60  # 15 minutes


def generate_otp():
  return "{:06d}".format(random.randint(0, 999999))


@api_view(['POST'])
@permission_classes([AllowAny])
def request_reset_otp(request):
  email = request.data.get('email', '').strip().lower()
  if not email:
    return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
  try:
    user = User.objects.get(email__iexact=email)
  except User.DoesNotExist:
    # Do not reveal whether email exists; respond success
    return Response({'detail': 'If the email exists, an OTP has been sent.'})

  code = generate_otp()
  cache_key = f"pwdreset:{email}"
  cache.set(cache_key, {'otp': code, 'ts': timezone.now().isoformat()}, OTP_TTL_SECONDS)

  # Attempt to send email (ignore failures to avoid leaking info)
  try:
    send_mail(
      subject="Your Password Reset Code",
      message=f"Your OTP code is: {code}. It expires in 15 minutes.",
      from_email=None,
      recipient_list=[email],
      fail_silently=True,
    )
  except Exception:
    pass

  return Response({'detail': 'If the email exists, an OTP has been sent.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_otp(request):
  email = request.data.get('email', '').strip().lower()
  otp = request.data.get('otp', '').strip()
  new_password = request.data.get('new_password', '')

  if not email or not otp or not new_password:
    return Response({'detail': 'Email, OTP, and new_password are required.'}, status=status.HTTP_400_BAD_REQUEST)

  cache_key = f"pwdreset:{email}"
  payload = cache.get(cache_key)
  if not payload or payload.get('otp') != otp:
    return Response({'detail': 'Invalid or expired OTP.'}, status=status.HTTP_400_BAD_REQUEST)

  try:
    user = User.objects.get(email__iexact=email)
  except User.DoesNotExist:
    return Response({'detail': 'Invalid request.'}, status=status.HTTP_400_BAD_REQUEST)

  user.set_password(new_password)
  user.save()
  cache.delete(cache_key)

  return Response({'detail': 'Password reset successful.'})

