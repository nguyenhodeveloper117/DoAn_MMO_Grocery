import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native"
import MyStyles from "../../styles/MyStyles"
import { Button, HelperText, TextInput } from "react-native-paper";
import * as ImagePicker from 'expo-image-picker';
import { useState } from "react";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation } from "@react-navigation/native";

const Register = () => {
    const info = [{
        label: 'Tên',
        field: 'first_name',
        icon: 'text',
        secureTextEntry: false
    }, {
        label: 'Họ và tên lót',
        field: 'last_name',
        icon: 'text',
        secureTextEntry: false
    }, {
        label: 'Tên đăng nhập',
        field: 'username',
        icon: 'account',
        secureTextEntry: false
    }, {
        label: 'Mật khẩu',
        field: 'password',
        icon: 'eye',
        secureTextEntry: true
    }, {
        label: 'Xác nhận mật khẩu',
        field: 'confirm',
        icon: 'eye',
        secureTextEntry: true
    }, {
        label: 'Email',
        field: 'email',
        icon: 'email',
        secureTextEntry: false
    }, {
        label: 'Số điện thoại',
        field: 'phone',
        icon: 'phone',
        secureTextEntry: false
    }];

    const [user, setUser] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [msg, setMsg] = useState();
    const nav = useNavigation();

    const setState = (value, field) => {
        setUser({ ...user, [field]: value });
    };

    const picker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                allowsEditing: true,
                aspect: [1, 1], // Ensure a square aspect ratio for round profile images
                quality: 1,
                mediaTypes: ImagePicker.MediaType
            });

            if (!result.canceled) {
                const selectedAvatar = result.assets[0];
                setState(selectedAvatar, "avatar"); // ✅ Cập nhật avatar vào object `user`
            }
        } catch (error) {
            console.error("Lỗi khi chọn ảnh:", error);
        }
    };


    const validate = () => {
        if (Object.values(user).length === 0) {
            setMsg("Vui lòng nhập thông tin!");
            return false;
        }

        for (let i of info)
            if (!user[i.field]) {
                setMsg(`Vui lòng nhập ${i.label}!`);
                return false;
            }

        if (user.password && user.password !== user.confirm) {
            setMsg("Mật khẩu không khớp!");
            return false;
        }

        setMsg('');
        return true;
    };

    const register = async () => {
        if (validate()) {
            try {
                setLoading(true);
                let form = new FormData();

                for (let key in user) {
                    if (key !== 'confirm') {
                        if (key === 'avatar' && user.avatar?.uri) {
                            const uri = user.avatar.uri;
                            const fileName = uri.split('/').pop();
                            const fileType = user.avatar.type ?? 'image/jpeg';

                            form.append('avatar', {
                                uri: uri,
                                name: fileName,
                                type: fileType
                            });
                        } else {
                            form.append(key, user[key]);
                        }
                    }
                }

                let res = await Apis.post(endpoints['register'], form, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (res.status === 201) nav.navigate('loginScreen');
            } catch (ex) {
                console.error("Đăng ký lỗi:", ex);
                setMsg("Đăng ký thất bại!");
            } finally {
                setLoading(false);
            }
        }
    };


    return (
        <ScrollView contentContainerStyle={{ ...MyStyles.container }}>
            <HelperText type="error" visible={msg}>
                {msg}
            </HelperText>

            {info.map(i => (
                <TextInput
                    key={i.field}
                    style={{ marginBottom: 16 }}
                    label={i.label}
                    secureTextEntry={
                        i.field === 'password' ? !showPassword :
                            i.field === 'confirm' ? !showConfirm :
                                i.secureTextEntry
                    }
                    right={
                        (i.field === 'password' || i.field === 'confirm') && (
                            <TextInput.Icon
                                icon={i.field === 'password' ? (showPassword ? 'eye-off' : 'eye') : (showConfirm ? 'eye-off' : 'eye')}
                                onPress={() => {
                                    if (i.field === 'password') setShowPassword(!showPassword);
                                    if (i.field === 'confirm') setShowConfirm(!showConfirm);
                                }}
                            />
                        )
                    }
                    value={user[i.field]}
                    onChangeText={t => setState(t, i.field)}
                    mode="outlined"
                />
            ))}

            <TouchableOpacity onPress={picker}>
                <Text style={{fontWeight: 'bold', marginBottom: 16 }}>Chọn ảnh đại diện</Text>
            </TouchableOpacity>

            {user?.avatar && <Image source={{ uri: user.avatar.uri }} style={[MyStyles.avatar]} />}

            <Button onPress={register} disabled={loading} loading={loading} style={MyStyles.button} mode="contained">
                Đăng ký
            </Button>
        </ScrollView>
    );
};

export default Register;