from django.db import transaction
from rest_framework import serializers
from rest_framework.serializers import ModelSerializer, ValidationError
from . import models
from django.utils import timezone


class UserSerializer(ModelSerializer):
    class Meta:
        model = models.User
        # fields = '__all__'
        fields = ['user_code', 'username', 'password', 'first_name', 'last_name', 'avatar', 'role', 'balance', 'phone',
                  'email', 'is_verified', 'date_joined', 'last_login']
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
        read_only_fields = ['verification_code', 'user', 'created_date', 'updated_date']

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
        read_only_fields = ['product_code', 'store', 'available_quantity', 'is_approved', 'created_date',
                            'updated_date']

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
        read_only_fields = ['order_code', 'buyer', 'voucher', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['buyer'] = self.context['request'].user  # Gán buyer là user hiện tại

        # Lấy mã voucher từ request
        code = self.context['request'].data.get("code")
        if code:
            with transaction.atomic():
                try:
                    voucher = models.Voucher.objects.select_for_update().get(
                        code=code,  # tìm theo code
                        expired_at__gt=timezone.now(),
                        quantity__gt=0  # chỉ lấy voucher còn lượt (>0)
                    )
                except models.Voucher.DoesNotExist:
                    raise ValidationError("Voucher không hợp lệ hoặc đã hết hạn!")

                # Gán voucher vào order
                validated_data['voucher'] = voucher

                # Trừ 1 lượt
                voucher.quantity -= 1
                voucher.save(update_fields=["quantity"])
        return super().create(validated_data)


class AccOrderDetailSerializer(ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=models.Order.objects.all())
    product = serializers.PrimaryKeyRelatedField(queryset=models.Product.objects.all())
    product_info = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = models.AccOrderDetail
        fields = ('acc_order_detail_code', 'order', 'product', 'unit_price', 'quantity', 'total_amount', 'discount_amount',
                  'content_delivered', 'product_info', 'created_date', 'updated_date')
        read_only_fields = ['acc_order_detail_code', "unit_price", "total_amount", 'discount_amount', 'content_delivered', 'order',
                            'product', 'product_info', 'created_date', 'updated_date']

    def create(self, validated_data):
        user = self.context['request'].user
        product = validated_data["product"]
        qty = validated_data["quantity"]
        order = validated_data["order"]

        unit_price = product.price
        total = unit_price * qty

        # --- Check voucher ---
        if order.voucher:
            voucher = order.voucher
            if voucher.store != product.store:
                raise ValidationError("Voucher không thuộc cửa hàng này!")
            discount = int(total * voucher.discount_percent / 100)
            if voucher.max_discount and discount > voucher.max_discount:
                discount = voucher.max_discount
            total -= discount
            validated_data["discount_amount"] = discount
        else:
            validated_data["discount_amount"] = 0

        # --- Check stock ---
        stocks = models.AccountStock.objects.filter(product=product, is_sold=False)[:qty]
        if len(stocks) < qty:
            raise ValidationError("Không đủ tài khoản trong kho!")

        validated_data["unit_price"] = unit_price
        validated_data["total_amount"] = total

        # --- Check balance & trừ tiền ---
        if user.balance < total:
            raise ValidationError("Số dư không đủ để thanh toán đơn hàng này!")

        with transaction.atomic():
            # Trừ tiền buyer
            user.balance -= total
            user.save(update_fields=["balance"])

            # Lưu lịch sử giao dịch
            models.TransactionHistory.objects.create(
                user=user,
                type="purchase",
                amount=total,
                note=f"Thanh toán đơn hàng {order.order_code}"
            )

            # Lấy và đánh dấu stock
            contents = []
            for stock in stocks:
                contents.append(stock.content)
                stock.is_sold = True
                stock.sold_at = timezone.now()
                stock.save(update_fields=["is_sold", "sold_at"])

            validated_data["content_delivered"] = "\n".join(contents)

            detail = models.AccOrderDetail.objects.create(**validated_data)

            # Update order
            order.is_paid = True
            order.status = "delivered"
            order.save(update_fields=["is_paid", "status"])

        return detail


class ServiceOrderDetailSerializer(ModelSerializer):
    order = serializers.PrimaryKeyRelatedField(queryset=models.Order.objects.all())
    product = serializers.PrimaryKeyRelatedField(queryset=models.Product.objects.all())
    product_info = ProductSerializer(source="product", read_only=True)

    class Meta:
        model = models.ServiceOrderDetail
        fields = ('service_order_detail_code', 'order', 'product', 'target_url', 'note', 'unit_price', 'quantity', 'total_amount', 'discount_amount',
                  'status', 'delivered_at', 'product_info', 'created_date', 'updated_date')
        read_only_fields = ['service_order_detail_code', 'order', 'product', "unit_price", "total_amount", 'discount_amount', 'product_info',
                            'created_date', 'updated_date']

    def create(self, validated_data):
        product = validated_data["product"]
        qty = validated_data["quantity"]
        order = validated_data["order"]
        buyer = order.buyer

        # 1. Tính tổng tiền
        unit_price = product.price
        total = unit_price * qty

        if order.voucher:
            voucher = order.voucher
            if voucher.store != product.store:
                raise ValidationError("Voucher không thuộc cửa hàng này!")

            discount = int(total * voucher.discount_percent / 100)
            if voucher.max_discount and discount > voucher.max_discount:
                discount = voucher.max_discount
            total -= discount
            validated_data["discount_amount"] = discount
        else:
            validated_data["discount_amount"] = 0

        validated_data["unit_price"] = unit_price
        validated_data["total_amount"] = total

        # 2. Kiểm tra số dư buyer
        if buyer.balance < total:
            raise ValidationError("Số dư không đủ để thanh toán dịch vụ này!")

        # 3. Trừ số dư buyer và lưu transaction
        buyer.balance -= total
        buyer.save(update_fields=["balance"])

        models.TransactionHistory.objects.create(
            user=buyer,
            type="purchase",
            amount=total,
            note=f"Thanh toán dịch vụ {product.name} trong đơn {order.order_code}"
        )

        # 4. Tạo service order detail
        detail = models.ServiceOrderDetail.objects.create(**validated_data)

        # 5. Cập nhật trạng thái order = processing
        order.status = "processing"
        order.save(update_fields=["status"])

        return detail


class ComplaintSerializer(ModelSerializer):
    order = OrderSerializer(read_only=True)
    order_code = serializers.CharField(write_only=True)
    buyer = UserSerializer(read_only=True)
    admin = UserSerializer(read_only=True)

    class Meta:
        model = models.Complaint
        fields = ('complaint_code', 'order', 'order_code' , 'buyer', 'admin', 'message', 'evidence_image1', 'evidence_image2',
                  'evidence_image3', 'evidence_video', 'resolved', 'decision', 'created_date', 'updated_date')
        read_only_fields = ['complaint_code', 'order', 'buyer', 'admin', 'created_date', 'updated_date']

    def create(self, validated_data):
        order_code = validated_data.pop("order_code", None)
        if not order_code:
            raise serializers.ValidationError({"order_code": "This field is required."})

        user = self.context["request"].user

        # Lấy order theo code
        try:
            order = models.Order.objects.get(order_code=order_code, active=True)
        except models.Order.DoesNotExist:
            raise serializers.ValidationError({"order_code": "Invalid order_code"})

        # Kiểm tra quyền: buyer hoặc seller
        is_buyer = order.buyer == user
        acc_detail = getattr(order, "acc_detail", None)
        service_detail = getattr(order, "service_detail", None)
        is_seller = (
                (acc_detail and acc_detail.product and acc_detail.product.store.seller == user)
                or (service_detail and service_detail.product and service_detail.product.store.seller == user)
        )

        if not (is_buyer or is_seller):
            raise serializers.ValidationError({"order_code": "Bạn không có quyền tạo khiếu nại cho order này"})

        # Gán thông tin
        validated_data["buyer"] = user  # complaint luôn gắn với user
        validated_data["order"] = order

        # Cập nhật trạng thái order sang complained
        order.status = "complained"
        order.save(update_fields=["status", "updated_date"])

        return models.Complaint.objects.create(**validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.evidence_image1:
            data['evidence_image1'] = instance.evidence_image1.url
        if instance.evidence_image2:
            data['evidence_image2'] = instance.evidence_image2.url
        if instance.evidence_image3:
            data['evidence_image3'] = instance.evidence_image3.url
        return data


class ReviewSerializer(ModelSerializer):
    product = ProductSerializer(read_only=True)
    buyer = UserSerializer(read_only=True)
    product_code = serializers.CharField(write_only=True)
    order = OrderSerializer(read_only=True)
    order_code = serializers.CharField(write_only=True)

    class Meta:
        model = models.Review
        fields = ('review_code', 'product', 'buyer', 'rating', 'comment', 'product_code', 'order' , 'order_code', 'created_date', 'updated_date')
        read_only_fields = ['review_code', 'product', 'buyer', 'order' ,'created_date', 'updated_date']

    def create(self, validated_data):
        product_code = validated_data.pop("product_code", None)
        order_code = validated_data.pop("order_code", None)

        if not product_code:
            raise serializers.ValidationError({"product_code": "This field is required."})
        if not order_code:
            raise serializers.ValidationError({"order_code": "This field is required."})

        # Lấy product
        try:
            product = models.Product.objects.get(product_code=product_code)
        except models.Product.DoesNotExist:
            raise serializers.ValidationError({"product_code": "Invalid product_code"})

        # Lấy order
        try:
            order = models.Order.objects.get(order_code=order_code, buyer=self.context["request"].user, active=True)
        except models.Order.DoesNotExist:
            raise serializers.ValidationError({"order_code": "Invalid order_code"})

        # Kiểm tra đã review chưa (1 order chỉ review 1 lần cho product này)
        if models.Review.objects.filter(product=product, buyer=self.context["request"].user, order=order).exists():
            raise serializers.ValidationError("You already reviewed this product for this order.")

        # Tạo review
        validated_data["buyer"] = self.context["request"].user
        validated_data["product"] = product
        validated_data["order"] = order

        return models.Review.objects.create(**validated_data)


class FavoriteProductSerializer(ModelSerializer):
    product = ProductSerializer(read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = models.FavoriteProduct
        fields = ('favorite_code', 'product', 'user', 'created_date', 'updated_date')
        read_only_fields = ['favorite_code', 'product', 'user', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user  # Gán user là user hiện tại
        return super().create(validated_data)


class TransactionHistorySerializer(ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = models.TransactionHistory
        fields = ('transaction_code', 'user', 'type', 'amount', 'note', 'created_date', 'updated_date')
        read_only_fields = ['transaction_code', 'user', 'created_date', 'updated_date']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user  # Gán user là user hiện tại
        return super().create(validated_data)


class DepositRequestSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = models.DepositRequest
        fields = ('deposit_code', 'user', 'amount', 'transaction_code',  'status', 'created_date', 'updated_date')
        read_only_fields = ['deposit_code', 'user', 'created_date', 'updated_date']

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user

        # Tạo DepositRequest
        deposit = super().create(validated_data)

        # Tạo TransactionHistory
        models.TransactionHistory.objects.create(
            user=user,
            type='deposit',
            amount=deposit.amount,
            note=f"Nạp tiền qua VietQR - {deposit.transaction_code}"
        )

        return deposit

class WithdrawRequestSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = models.WithdrawRequest
        fields = ('withdraw_code', 'user', 'amount', 'status', 'created_date', 'updated_date')
        read_only_fields = ['withdraw_code', 'user', 'created_date', 'updated_date']

    def create(self, validated_data):
        user = self.context['request'].user
        amount = validated_data['amount']

        # Kiểm tra số dư
        if user.balance < amount:
            raise serializers.ValidationError("Số dư không đủ để rút tiền!")

        # Trừ tiền
        user.balance -= amount
        user.save()

        # Tạo WithdrawRequest
        validated_data['user'] = user
        withdraw = super().create(validated_data)

        # Tạo TransactionHistory cho rút tiền
        models.TransactionHistory.objects.create(
            user=user,
            type='withdraw',
            amount=amount,
            note=f"Yêu cầu rút tiền - {withdraw.withdraw_code}"
        )

        return withdraw