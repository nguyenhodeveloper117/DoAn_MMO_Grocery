from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, ValidationError
from . import models


class UserSerializer(ModelSerializer):
    class Meta:
        model = models.User
        # fields = '__all__'
        fields = ['user_code', 'username', 'password', 'first_name', 'last_name', 'avatar', 'role', 'balance', 'phone', 'email', 'is_verified', 'date_joined', 'last_login']
        read_only_fields = ['user_code', 'date_joined', 'last_login']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def create(self, validated_data):
        data = validated_data.copy()
        u = models.User(**data)
        u.set_password(u.password)
        u.save()
        return u

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            # Nếu avatar là Cloudinary object (có .url)
            data['avatar'] = instance.avatar.url
        except AttributeError:
            # Nếu avatar chỉ là chuỗi (string URL)
            data['avatar'] = instance.avatar
        return data

class StoreSerializer(ModelSerializer):
    seller = UserSerializer(read_only=True)
    class Meta:
        model = models.Store
        fields = ['store_code', 'seller', 'name', 'description', 'created_date', 'updated_date']
        read_only_fields = ['store_code', 'seller', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user  # Gán seller là user hiện tại
        return super().create(validated_data)

class VerificationSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = models.Verification
        fields = 'verification_code', 'user', 'cccd', 'front_id', 'back_id', 'portrait', 'status', 'created_date', 'updated_date'
        read_only_fields = ['verification_code' ,'user', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user  # Gán seller là user hiện tại
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Thêm đường dẫn URL thực tế của các trường ảnh
        if instance.front_id:
            data['front_id'] = instance.front_id.url
        if instance.back_id:
            data['back_id'] = instance.back_id.url
        if instance.portrait:
            data['portrait'] = instance.portrait.url

        return data

class ProductSerializer(ModelSerializer):
    store = StoreSerializer(read_only=True)
    class Meta:
        model = models.Product
        fields = 'product_code', 'store', 'name', 'image', 'description', 'price', 'format', 'type', 'available_quantity', 'warranty_days', 'is_approved', 'created_date', 'updated_date'
        read_only_fields = ['product_code', 'store', 'available_quantity', 'is_approved', 'created_date', 'updated_date']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.image:
            data['image'] = instance.image.url
        return data

    def create(self, validated_data):
        user = self.context['request'].user
        try:
            store = user.store  # Do OneToOne: user.store sẽ trả về Store
        except models.Store.DoesNotExist:
            raise ValidationError("Người dùng chưa tạo gian hàng.")

        validated_data['store'] = store
        return super().create(validated_data)

class BlogSerializer(ModelSerializer):
    author = UserSerializer(read_only=True)
    class Meta:
        model = models.Blog
        fields = 'blog_code', 'author', 'title', 'content', 'product', 'category', 'created_date', 'updated_date'
        read_only_fields = ['blog_code', 'author', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user  # Gán seller là user hiện tại
        return super().create(validated_data)

class BlogCommentSerializer(ModelSerializer):
    author = UserSerializer(read_only=True)
    blog = BlogSerializer(read_only=True)
    class Meta:
        model = models.BlogComment
        fields = 'blog_comment_code', 'author', 'blog', 'content', 'created_date', 'updated_date'
        read_only_fields = ['blog_code', 'author', 'blog', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['author'] = self.context['request'].user  # Gán seller là user hiện tại
        return super().create(validated_data)

class BlogLikeSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)
    blog = BlogSerializer(read_only=True)
    class Meta:
        model = models.BlogLike
        fields = 'blog_like_code', 'user', 'blog'
        read_only_fields = ['blog_code', 'user', 'blog']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user  # Gán seller là user hiện tại
        return super().create(validated_data)

class VoucherSerializer(ModelSerializer):
    store = StoreSerializer(read_only=True)
    class Meta:
        model = models.Voucher
        fields = 'voucher_code', 'store', 'code', 'discount_percent', 'max_discount', 'expired_at', 'quantity', 'created_date', 'updated_date'
        read_only_fields = ['voucher_code', 'store', 'created_date', 'updated_date']

    def create(self, validated_data):
        user = self.context['request'].user
        try:
            store = user.store  # Do OneToOne: user.store sẽ trả về Store
        except models.Store.DoesNotExist:
            raise ValidationError("Người dùng chưa tạo gian hàng.")

        validated_data['store'] = store
        return super().create(validated_data)

class AccountStockSerializer(ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = models.AccountStock
        fields = 'stock_code', 'product', 'content', 'is_sold', 'sold_at', 'created_date', 'updated_date'
        read_only_fields = ['stock_code', 'product', 'created_date', 'updated_date']

class OrderSerializer(ModelSerializer):
    buyer = UserSerializer(read_only=True)
    voucher = VoucherSerializer(read_only=True)

    class Meta:
        model = models.Order
        fields = 'order_code', 'buyer', 'voucher', 'is_paid', 'status', 'released_at', 'created_date', 'updated_date'
        read_only_fields = ['order_code', 'buyer', 'voucher' ,'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['buyer'] = self.context['request'].user  # Gán buyer là user hiện tại
        return super().create(validated_data)

class AccOrderDetailSerializer(ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=models.Order.objects.all())
    product = serializers.PrimaryKeyRelatedField(queryset=models.Product.objects.all())

    class Meta:
        model = models.AccOrderDetail
        fields = 'acc_order_detail_code', 'order', 'product', 'unit_price', 'quantity', 'total_amount', 'content_delivered', 'created_date', 'updated_date'
        read_only_fields = ['acc_order_detail_code',  'order', 'product', 'created_date', 'updated_date']

class ServiceOrderDetailSerializer(ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=models.Order.objects.all())
    product = serializers.PrimaryKeyRelatedField(queryset=models.Product.objects.all())

    class Meta:
        model = models.ServiceOrderDetail
        fields = 'service_order_detail_code', 'order', 'product', 'target_url', 'note', 'unit_price', 'quantity', 'total_amount', 'status', 'delivered_at', 'created_date', 'updated_date'
        read_only_fields = ['service_order_detail_code', 'order', 'product', 'created_date', 'updated_date']

class ComplaintSerializer(ModelSerializer):
    order = OrderSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)
    admin = UserSerializer(read_only=True)

    class Meta:
        model = models.Complaint
        fields = ('complaint_code', 'order', 'buyer', 'admin', 'message', 'evidence_image1', 'evidence_image2', 'evidence_image3',
                  'evidence_video', 'resolved', 'decision', 'created_date', 'updated_date')
        read_only_fields = ['complaint_code', 'order', 'buyer', 'admin', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['buyer'] = self.context['request'].user  # Gán buyer là user hiện tại
        return super().create(validated_data)

class ReviewSerializer(ModelSerializer):
    product = ProductSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)

    class Meta:
        model = models.Review
        fields = ('review_code', 'product', 'buyer', 'rating', 'comment', 'created_date', 'updated_date')
        read_only_fields = ['review_code', 'product', 'buyer', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['buyer'] = self.context['request'].user  # Gán buyer là user hiện tại
        return super().create(validated_data)

class FavoriteProductSerializer(ModelSerializer):
    product = ProductSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = models.Review
        fields = ('favorite_code', 'product', 'user', 'created_date', 'updated_date')
        read_only_fields = ['favorite_code', 'product', 'user', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user  # Gán user là user hiện tại
        return super().create(validated_data)

class TransactionHistorySerializer(ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = models.Review
        fields = ('transaction_code', 'user', 'type', 'amount', 'note' ,'created_date', 'updated_date')
        read_only_fields = ['transaction_code', 'user', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user  # Gán user là user hiện tại
        return super().create(validated_data)











