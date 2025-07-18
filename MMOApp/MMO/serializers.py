from rest_framework.serializers import ModelSerializer
from . import models


class UserSerializer(ModelSerializer):
    class Meta:
        model = models.User
        # fields = '__all__'
        fields = ['user_code', 'username', 'password', 'first_name', 'last_name', 'avatar', 'role', 'balance', 'phone', 'email']
        extra_kwargs = {
            'password': {
                'write_only': True
            }
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.avatar:
            data['avatar'] = instance.avatar.url
        return data

    def create(self, validated_data):
        data = validated_data.copy()
        u = models.User(**data)
        u.set_password(u.password)
        u.save()
        return u

class StoreSerializer(ModelSerializer):
    seller = UserSerializer(read_only=True)
    class Meta:
        model = models.Store
        fields = ['store_code', 'seller', 'name', 'description']
        read_only_fields = ['seller']

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user  # Gán seller là user hiện tại
        return super().create(validated_data)

class VerificationSerializer(ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = models.Verification
        fields = 'verification_code', 'user', 'cccd', 'front_id', 'back_id', 'portrait', 'status'
        read_only_fields = ['user']

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

