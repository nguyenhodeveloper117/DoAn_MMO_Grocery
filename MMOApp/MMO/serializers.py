from rest_framework.serializers import ModelSerializer, ValidationError
from . import models


class UserSerializer(ModelSerializer):
    class Meta:
        model = models.User
        # fields = '__all__'
        fields = ['user_code', 'username', 'password', 'first_name', 'last_name', 'avatar', 'role', 'balance', 'phone', 'email', 'is_verified']
        read_only_fields = ['user_code']
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
        fields = ['store_code', 'seller', 'name', 'description']
        read_only_fields = ['store_code', 'seller']

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user  # Gán seller là user hiện tại
        return super().create(validated_data)

class VerificationSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = models.Verification
        fields = 'verification_code', 'user', 'cccd', 'front_id', 'back_id', 'portrait', 'status'
        read_only_fields = ['verification_code' ,'user']

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
        fields = 'product_code', 'store', 'name', 'image', 'description', 'price', 'format', 'type', 'available_quantity', 'warranty_days', 'is_approved'
        read_only_fields = ['product_code', 'store', 'available_quantity', 'is_approved']

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
