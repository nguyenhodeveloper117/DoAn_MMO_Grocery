from decimal import Decimal

from cloudinary.models import CloudinaryField
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from rest_framework.exceptions import ValidationError
from ckeditor.fields import RichTextField
from .utils import generate_code

class BaseModel(models.Model):
    active = models.BooleanField(default=True)
    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# User model
class User(AbstractUser):
    user_code = models.CharField(primary_key=True, max_length=10, editable=False)

    ROLE_CHOICES = (
        ('admin', 'Quản trị viên'),
        ('seller', 'Người bán'),
        ('customer', 'Người mua'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, null=False, blank=False, default='customer')
    avatar = CloudinaryField(null=True, default="https://res.cloudinary.com/dnwyvuqej/image/upload/v1733499646/default_avatar_uv0h7z.jpg")
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0) # Số dư
    phone = models.CharField(max_length=10, blank=False, null=False, unique=True)
    is_verified = models.BooleanField(default=False)  # Xác thực thông tin

    def __str__(self):
        return f"{self.user_code} - {self.username}"

    def save(self, *args, **kwargs):
        if not self.user_code:
            self.user_code = generate_code(User, 'user_code', 'US')
        super().save(*args, **kwargs)

# Thông tin xác thực
class Verification(BaseModel):
    verification_code = models.CharField(primary_key=True, max_length=10, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification_request')
    cccd = models.CharField(max_length=12, blank=False, null=False, unique=True)
    front_id = CloudinaryField('Ảnh CCCD mặt trước', blank=False, null=False)
    back_id = CloudinaryField('Ảnh CCCD mặt sau', blank=False, null=False)
    portrait = CloudinaryField('Ảnh chân dung', blank=False, null=False)
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Đang chờ duyệt'),
            ('approved', 'Đã duyệt'),
            ('rejected', 'Bị từ chối')
        ],
        default='pending'
    )

    def save(self, *args, **kwargs):
        if not self.verification_code:
            self.verification_code = generate_code(Verification, 'verification_code', 'VE')
        super().save(*args, **kwargs)

# Gian hàng
class Store(BaseModel):
    store_code = models.CharField(primary_key=True, max_length=10, editable=False)
    seller = models.OneToOneField(User, on_delete=models.CASCADE, limit_choices_to={'role': 'seller'}, related_name='store')
    name = models.CharField(max_length=100, null=False, blank=False)
    description = models.TextField()

    def __str__(self):
        return f"{self.store_code} - {self.name}"

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
    price = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('1000000000'))])
    format = models.TextField(help_text="Định dạng gửi về, ví dụ: TK|MK|Email|OTP")
    type = models.CharField(max_length=20, choices=[('account', 'Tài khoản'), ('service', 'Dịch vụ'), ('software', 'Phần mềm'), ('course', 'Khoá học')])
    available_quantity = property(lambda self: self.stocks.filter(is_sold=False).count())
    warranty_days = models.IntegerField(default=3) # số ngày bảo hành
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.product_code} - {self.name}"

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

    def __str__(self):
        return f"{self.stock_code}"

    def save(self, *args, **kwargs):
        if not self.stock_code:
            self.stock_code = generate_code(AccountStock, 'stock_code', 'AS')
        super().save(*args, **kwargs)

class Voucher(BaseModel):
    voucher_code = models.CharField(primary_key=True, max_length=10, editable=False)
    store = models.ForeignKey(Store, on_delete=models.CASCADE, related_name='vouchers')
    code = models.CharField(max_length=20)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('1')), MaxValueValidator(Decimal('100.00'))])
    max_discount = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('30000'))
    expired_at = models.DateTimeField(null=False, blank=False)
    quantity = models.IntegerField(null=False, blank=False, validators=[MinValueValidator(1), MaxValueValidator(1000)])

    def __str__(self):
        return f"{self.voucher_code}"

    class Meta:
        unique_together = ('store', 'code')

    def save(self, *args, **kwargs):
        if not self.voucher_code:
            self.voucher_code = generate_code(Voucher, 'voucher_code', 'VC')
        super().save(*args, **kwargs)


# Đơn hàng
class Order(BaseModel):
    order_code = models.CharField(primary_key=True, max_length=10, editable=False)
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    voucher = models.ForeignKey(Voucher, null=True, blank=True, on_delete=models.SET_NULL, related_name='orders')
    is_paid = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=[
        ('processing', 'Đang xử lý'),
        ('delivered', 'Đã giao'),
        ('complained', 'Bị khiếu nại'),
        ('refunded', 'Đã hoàn tiền'),
        ('completed', 'Hoàn thành'),
        ('cancel', 'Huỷ')
    ], default='processing')
    released_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.order_code}"

    def save(self, *args, **kwargs):
        if not self.order_code:
            self.order_code = generate_code(Order, 'order_code', 'OD')
        super().save(*args, **kwargs)


# Chi tiết đơn hàng
class AccOrderDetail(BaseModel):
    acc_order_detail_code = models.CharField(primary_key=True, max_length=10, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='acc_detail')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='acc_order_details')
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity = models.IntegerField(validators=[MinValueValidator(1)])
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    content_delivered = models.TextField()

    def __str__(self):
        return f"{self.acc_order_detail_code}"

    def save(self, *args, **kwargs):
        if not self.acc_order_detail_code:
            self.acc_order_detail_code = generate_code(AccOrderDetail, 'acc_order_detail_code', 'AD')
        if self.order and hasattr(self.order, 'service_detail'):
            raise ValidationError("Order này đã có service detail. Không thể thêm acc detail.")
        super().save(*args, **kwargs)


class ServiceOrderDetail(BaseModel):
    service_order_detail_code = models.CharField(primary_key=True, max_length=10, editable=False)
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='service_detail')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name='service_order_details')
    target_url = models.URLField(help_text="Link TikTok/YouTube/Instagram cần tăng tương tác")
    note = models.TextField(null=True, blank=True)  # Ghi chú thêm nếu có
    unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    quantity = models.IntegerField(help_text="Số lượng cần tăng, ví dụ: 1000 follow", validators=[MinValueValidator(1)])
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Chờ xác nhận'),
        ('in_progress', 'Đang thực hiện'),
        ('completed', 'Hoàn thành'),
        ('failed', 'Thất bại')
    ], default='pending')
    delivered_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.service_order_detail_code}"

    def save(self, *args, **kwargs):
        if not self.service_order_detail_code:
            self.service_order_detail_code = generate_code(ServiceOrderDetail, 'service_order_detail_code', 'SO')
        if self.order and hasattr(self.order, 'acc_detail'):
            raise ValidationError("Order này đã có acc detail. Không thể thêm service detail.")
        super().save(*args, **kwargs)

# Khiếu nại
class Complaint(BaseModel):
    complaint_code = models.CharField(primary_key=True, max_length=10, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='complaints')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='complaints')
    message = models.TextField()
    evidence_image1 = CloudinaryField(null=False, blank=False)
    evidence_image2 = CloudinaryField(null=True, blank=True)
    evidence_image3 = CloudinaryField(null=True, blank=True)
    evidence_video = CloudinaryField(null=True, blank=True)
    resolved = models.BooleanField(default=False)
    decision = models.CharField(max_length=20, choices=[
        ('refund', 'Hoàn tiền người mua'),
        ('release', 'Trả tiền cho người bán'),
        ('negotiate', 'Yêu cầu thương lượng lại')
    ], null=True, blank=True)
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_complaints', limit_choices_to={'role': 'admin'})

    def __str__(self):
        return f"{self.complaint_code}"

    def save(self, *args, **kwargs):
        if not self.complaint_code:
            self.complaint_code = generate_code(Complaint, 'complaint_code', 'CP')
        super().save(*args, **kwargs)


class Review(BaseModel):
    review_code = models.CharField(primary_key=True, max_length=10, editable=False)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    buyer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField(null=False, blank=False, validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.review_code}"

    def save(self, *args, **kwargs):
        if not self.review_code:
            self.review_code = generate_code(Review, 'review_code', 'RV')
        super().save(*args, **kwargs)


class Blog(BaseModel):
    blog_code = models.CharField(primary_key=True, max_length=10, editable=False)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blogs')
    title = models.CharField(max_length=255, null=False, blank=False)
    content = RichTextField(null=False, blank=False)  # Dùng richtext
    product = models.CharField(max_length=100, null=True, blank=True)
    CATEGORY_CHOICES = [
        ('tiktok', 'TikTok'),
        ('facebook', 'Facebook'),
        ('youtube', 'YouTube'),
        ('instagram', 'Instagram'),
        ('blockchain', 'Blockchain'),
        ('other', 'Nội dung khác'),
    ]
    category = models.CharField(max_length=100, choices=CATEGORY_CHOICES)


    def __str__(self):
        return f"{self.blog_code}"

    def save(self, *args, **kwargs):
        if not self.blog_code:
            self.blog_code = generate_code(Blog, 'blog_code', 'BL')
        super().save(*args, **kwargs)

class BlogLike(BaseModel):
    blog_like_code = models.CharField(primary_key=True, max_length=10, editable=False)
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_blogs')

    class Meta:
        unique_together = ('blog', 'user')  # 1 user chỉ like 1 blog 1 lần

    def __str__(self):
        return f"{self.user} liked {self.blog}"

    def save(self, *args, **kwargs):
        if not self.blog_like_code:
            self.blog_like_code = generate_code(BlogLike, 'blog_like_code', 'LI')
        super().save(*args, **kwargs)


class BlogComment(BaseModel):
    blog_comment_code = models.CharField(primary_key=True, max_length=10, editable=False)
    blog = models.ForeignKey(Blog, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blog_comments')
    content = models.TextField(null=False, blank=False)

    def __str__(self):
        return f"{self.blog_comment_code}"

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
    type = models.CharField(max_length=20, choices=TRANSACTION_TYPE, null=False, blank=False)
    amount = models.DecimalField(max_digits=12, decimal_places=2, null=False, blank=False)
    note = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.transaction_code}"

    def save(self, *args, **kwargs):
        if not self.transaction_code:
            self.transaction_code = generate_code(TransactionHistory, 'transaction_code', 'TX')
        super().save(*args, **kwargs)


class FavoriteProduct(BaseModel):
    favorite_code = models.CharField(primary_key=True, max_length=20, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites')
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='favorited_by')

    class Meta:
        unique_together = ('user', 'product')

    def __str__(self):
        return f"{self.favorite_code}"

    def save(self, *args, **kwargs):
        if not self.favorite_code:
            self.favorite_code = generate_code(FavoriteProduct, 'favorite_code', 'FV')
        super().save(*args, **kwargs)







