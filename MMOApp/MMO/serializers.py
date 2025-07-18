from rest_framework.serializers import ModelSerializer
from .models import User, Store


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
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
        u = User(**data)
        u.set_password(u.password)
        u.save()
        return u

class StoreSerializer(ModelSerializer):
    seller = UserSerializer(read_only=True)
    class Meta:
        model = Store
        fields = ['store_code', 'seller', 'name', 'description']
        read_only_fields = ['seller']

    def create(self, validated_data):
        validated_data['seller'] = self.context['request'].user  # Gán seller là user hiện tại
        return super().create(validated_data)

