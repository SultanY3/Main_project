from django.utils import timezone
from datetime import timedelta
from .models import Notification

def create_follow_notification(follower, following):
    if follower == following:
        return None
    message = f"{follower.username} started following you"
    return Notification.objects.create(
        recipient=following,
        sender=follower,
        notification_type="follow",
        message=message
    )

def create_comment_notification(commenter, recipe):
    if commenter == recipe.author:
        return None
    message = f"{commenter.username} commented on your recipe '{recipe.title}'"
    return Notification.objects.create(
        recipient=recipe.author,
        sender=commenter,
        notification_type="comment",
        recipe=recipe,
        message=message
    )

def create_rating_notification(rater, recipe, rating):
    if rater == recipe.author:
        return None
    message = (
        f"{rater.username} gave {rating} star{'s' if rating != 1 else ''} "
        f"to your recipe '{recipe.title}'"
    )
    return Notification.objects.create(
        recipient=recipe.author,
        sender=rater,
        notification_type="rating",
        recipe=recipe,
        message=message
    )

def recent_notifications_for_user(user, hours=1):
    cutoff = timezone.now() - timedelta(hours=hours)
    return Notification.objects.filter(
        recipient=user,
        created_at__gte=cutoff
    ).order_by('-created_at')
