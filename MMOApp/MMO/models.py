from cloudinary.models import CloudinaryField
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models

class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
        ordering = ['-id']

class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        role = extra_fields.get("role")
        if not role:
            raise ValueError("Người dùng phải có role")

        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_staff", True)

        return self.create_user(username, password, **extra_fields)

# User model
class User(AbstractUser):
    user_code = models.CharField(primary_key=True, max_length=10, editable=False)

    ROLE_CHOICES = (
        ('admin', 'Quản trị viên'),
        ('seller', 'Người bán'),
        ('customer', 'Người mua'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, null=False, blank=False)
    avatar = CloudinaryField(null=False, blank=False)

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.user_code} - {self.username}"

    def save(self, *args, **kwargs):
        if not self.user_code:
            prefix = {
                'admin': 'AD',
                'seller': 'SE',
                'customer': 'CU'
            }.get(self.role, 'CU')

            last_user = User.objects.filter(role=self.role).order_by('-user_code').first()
            if last_user:
                try:
                    last_id = int(last_user.user_code[-3:])
                except:
                    last_id = 0
            else:
                last_id = 0

            self.user_code = f"{prefix}{last_id + 1:03d}"

        if not self.avatar:
            self.avatar = "https://res.cloudinary.com/dnwyvuqej/image/upload/v1733499646/default_avatar_uv0h7z.jpg"

        # Mã hóa mật khẩu nếu chưa được mã hóa
        if self.pk is None or not User.objects.filter(pk=self.pk).exists():
            # User mới → đảm bảo set_password()
            self.set_password(self.password)
        else:
            # User cũ → kiểm tra nếu password chưa mã hóa
            old = User.objects.get(pk=self.pk)
            if self.password != old.password:
                self.set_password(self.password)

        super().save(*args, **kwargs)





