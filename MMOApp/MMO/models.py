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

# Custom User Manager
class CustomUserManager(BaseUserManager):
    def create_user(self, username, password=None, **extra_fields):
        role = extra_fields.get("role")
        if not role:
            raise ValueError("Người dùng phải có role")

        # Tạo id tự động
        user_id = self.generate_user_id(role)
        extra_fields["id"] = user_id

        user = self.model(username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, password=None, **extra_fields):
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_staff", True)
        return self.create_user(username, password, **extra_fields)

    def generate_user_id(self, role):
        prefix = {
            'admin': 'AD',
            'seller': 'SE',
            'customer': 'CU'
        }.get(role, 'US')

        last_user = self.model.objects.filter(role=role).order_by('-id').first()
        if last_user:
            try:
                last_id = int(last_user.id[-3:])
            except:
                last_id = 0
        else:
            last_id = 0

        return f"{prefix}{last_id + 1:03d}"  # VD: AD001, CU007, ...


# User model
class User(AbstractUser):
    id = models.CharField(primary_key=True, max_length=10, editable=False)

    ROLE_CHOICES = (
        ('admin', 'Quản trị viên'),
        ('seller', 'Người bán'),
        ('customer', 'Người mua'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    avatar = CloudinaryField(null=True, blank=True)

    objects = CustomUserManager()

    def __str__(self):
        return f"{self.id} - {self.username}"

    def save(self, *args, **kwargs):
        if not self.id:
            prefix = {
                'admin': 'AD',
                'seller': 'SE',
                'customer': 'CU'
            }.get(self.role, 'US')

            last_user = User.objects.filter(role=self.role).order_by('-id').first()
            if last_user:
                try:
                    last_id = int(last_user.id[-3:])
                except:
                    last_id = 0
            else:
                last_id = 0

            self.id = f"{prefix}{last_id + 1:03d}"

        # Nếu password chưa được mã hoá, thì mã hoá nó
        if self.pk is None or not User.objects.filter(pk=self.pk).exists():
            self.set_password(self.password)
        else:
            old = User.objects.get(pk=self.pk)
            if old.password != self.password:
                self.set_password(self.password)

        super().save(*args, **kwargs)


