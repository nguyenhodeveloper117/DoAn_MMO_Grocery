from cloudinary.models import CloudinaryField
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
from django.db import models
from .utils import generate_code

class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

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
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Số dư
    # is_verified = models.BooleanField(default=False)  # Đã xác thực thông tin

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

# Gian hàng
class Store(BaseModel):
    store_code = models.CharField(primary_key=True, max_length=10, editable=False)
    seller = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'role': 'seller'}, related_name='store')
    name = models.CharField(max_length=100, null=False, blank=False)
    description = models.TextField()
    verified = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.store_code:
            self.store_code = generate_code(Store, 'store_code', 'ST')
        super().save(*args, **kwargs)


# Tài khoản, dịch vụ
class Product(BaseModel):
    product_code = models.CharField(primary_key=True, max_length=10, editable=False)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=100)
    image = CloudinaryField(null=False, blank=False)
    description = models.TextField()
    price = models.DecimalField(max_digits=12, decimal_places=2)
    format = models.TextField(help_text="Định dạng gửi về, ví dụ: TK|MK|Email|OTP")
    type = models.CharField(max_length=20, choices=[('account', 'Tài khoản'), ('service', 'Dịch vụ'), ('software', 'Phần mềm'), ('course', 'Khoá học')])
    available_quantity = property(lambda self: self.stocks.filter(is_sold=False).count())
    warranty_days = models.IntegerField(default=0) # số ngày bảo hành
    is_approved = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if not self.product_code:
            self.product_code = generate_code(Product, 'product_code', 'PR')
        super().save(*args, **kwargs)

# Kho tài khoản
class AccountStock(BaseModel):
    stock_code = models.CharField(primary_key=True, max_length=10, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='stocks')
    content = models.TextField(help_text="Thông tin định dạng tài khoản: user|pass|email|otp")
    is_sold = models.BooleanField(default=False)
    sold_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.stock_code:
            self.stock_code = generate_code(AccountStock, 'stock_code', 'AS')
        super().save(*args, **kwargs)

class Voucher(BaseModel):
    voucher_code = models.CharField(primary_key=True, max_length=10, editable=False)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='vouchers')
    code = models.CharField(max_length=20, unique=True)
    discount_percent = models.FloatField()
    max_discount = models.DecimalField(max_digits=10, decimal_places=2)
    expired_at = models.DateTimeField()
    quantity = models.IntegerField()

    def save(self, *args, **kwargs):
        if not self.voucher_code:
            self.voucher_code = generate_code(Voucher, 'voucher_code', 'VC')
        super().save(*args, **kwargs)


# Đơn hàng
class Order(BaseModel):
    order_code = models.CharField(primary_key=True, max_length=10, editable=False)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'buyer'}, related_name='orders')
    voucher = models.ForeignKey(Voucher, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders')
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=[
        ('processing', 'Đang xử lý'),
        ('delivered', 'Đã giao'),
        ('complained', 'Bị khiếu nại'),
        ('refunded', 'Đã hoàn tiền'),
        ('completed', 'Hoàn thành')
    ])
    released_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.order_code:
            self.order_code = generate_code(Order, 'order_code', 'OD')
        super().save(*args, **kwargs)


# Chi tiết đơn hàng
class AccOrderDetail(BaseModel):
    acc_order_detail_code = models.CharField(primary_key=True, max_length=10, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='acc_details')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='acc_order_details')
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    content_delivered = models.TextField()

    def save(self, *args, **kwargs):
        if not self.acc_order_detail_code:
            self.order_detail_code = generate_code(AccOrderDetail, 'order_detail_code', 'ADD')
        super().save(*args, **kwargs)

class ServiceOrderDetail(BaseModel):
    service_order_detail_code = models.CharField(primary_key=True, max_length=10, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='service_details')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='service_order_details')
    target_url = models.URLField(help_text="Link TikTok/YouTube/Instagram cần tăng tương tác")
    quantity = models.IntegerField(help_text="Số lượng cần tăng, ví dụ: 1000 follow", validators=[MinValueValidator(1)])
    note = models.TextField(null=True, blank=True)  # Ghi chú thêm nếu có
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Chờ xác nhận'),
        ('in_progress', 'Đang thực hiện'),
        ('completed', 'Hoàn thành'),
        ('failed', 'Thất bại')
    ], default='pending')
    delivered_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.service_order_detail_code:
            self.service_order_detail_code = generate_code(ServiceOrderDetail, 'service_order_detail_code', 'SOD')
        super().save(*args, **kwargs)



class Complaint(BaseModel):
    complaint_code = models.CharField(primary_key=True, max_length=10, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='complaints')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    message = models.TextField()
    evidence_image = CloudinaryField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    decision = models.CharField(max_length=20, choices=[
        ('refund', 'Hoàn tiền người mua'),
        ('release', 'Trả tiền cho người bán'),
        ('negotiate', 'Yêu cầu thương lượng lại')
    ], null=True, blank=True)
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_complaints')

    def save(self, *args, **kwargs):
        if not self.complaint_code:
            self.complaint_code = generate_code(Complaint, 'complaint_code', 'CP')
        super().save(*args, **kwargs)


class Review(BaseModel):
    review_code = models.CharField(primary_key=True, max_length=10, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField()
    comment = models.TextField()

    def save(self, *args, **kwargs):
        if not self.review_code:
            self.review_code = generate_code(Review, 'review_code', 'RV')
        super().save(*args, **kwargs)


class Blog(BaseModel):
    blog_code = models.CharField(primary_key=True, max_length=10, editable=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blogs')
    title = models.CharField(max_length=255)
    content = models.TextField()
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name='blogs')
    created_at = models.DateTimeField(auto_now_add=True)
    category = models.CharField(max_length=100)

    def save(self, *args, **kwargs):
        if not self.blog_code:
            self.blog_code = generate_code(Blog, 'blog_code', 'BL')
        super().save(*args, **kwargs)


class BlogComment(BaseModel):
    blog_comment_code = models.CharField(primary_key=True, max_length=10, editable=False)
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_comments')
    content = models.TextField()

    def save(self, *args, **kwargs):
        if not self.blog_comment_code:
            self.blog_comment_code = generate_code(BlogComment, 'blog_comment_code', 'CM')
        super().save(*args, **kwargs)


class TransactionHistory(BaseModel):
    TRANSACTION_TYPE = [
        ('deposit', 'Nạp tiền'),
        ('withdraw', 'Rút tiền'),
        ('refund', 'Hoàn tiền'),
        ('purchase', 'Thanh toán đơn hàng'),
        ('receive', 'Nhận tiền bán')
    ]

    transaction_code = models.CharField(primary_key=True, max_length=20, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    note = models.TextField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.transaction_code:
            self.transaction_code = generate_code(TransactionHistory, 'transaction_code', 'TX')
        super().save(*args, **kwargs)


class FavoriteProduct(BaseModel):
    favorite_code = models.CharField(primary_key=True, max_length=20, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'customer'}, related_name='favorites')
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        unique_together = ('user', 'product')

    def save(self, *args, **kwargs):
        if not self.favorite_code:
            self.favorite_code = generate_code(FavoriteProduct, 'favorite_code', 'FV')
        super().save(*args, **kwargs)







