# recipes/permissions.py
from rest_framework import permissions

class IsAuthorOrAdminOrReadOnly(permissions.BasePermission):
    
    def has_permission(self, request, view):
        # Allow read (GET) for anyone
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # For write (POST), require authentication
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        # Allow read (GET) for anyone
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # For update/delete (PUT/DELETE), check author or admin
        return obj.author == request.user or request.user.is_superuser