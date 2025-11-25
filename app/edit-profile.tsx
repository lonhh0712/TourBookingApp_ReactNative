import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { onAuthStateChanged, updateProfile, User } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  auth,
  getUserProfile,
  updateUserProfile,
  uploadImageToCloudinary,
} from "../backend/firebaseService";

export default function EditProfileScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [avatarSource, setAvatarSource] = useState<ImageSourcePropType>(
    require("../assets/images/user.png")
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.replace("/(auth)/sign-in");
        return;
      }

      setUid(firebaseUser.uid);
      setCurrentUser(firebaseUser);
      setLoading(true);

      try {
        const profile = await getUserProfile(firebaseUser.uid);
        const displayName = String(
          profile?.displayName ?? firebaseUser.displayName ?? ""
        );
        const profileAddress = String(profile?.address ?? "");
        const profilePhone = String(profile?.phone ?? "");
        const profilePhoto = String(
          profile?.photoURL ?? firebaseUser.photoURL ?? ""
        );

        setFullName(displayName);
        setAddress(profileAddress);
        setPhone(profilePhone);
        setPhotoURL(profilePhoto);
        setAvatarSource(
          profilePhoto ? { uri: profilePhoto } : require("../assets/images/user.png")
        );
      } catch (error) {
        console.error("Load profile failed", error);
        Alert.alert("Lỗi", "Không thể tải thông tin hồ sơ.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [router]);

  useEffect(() => {
    setAvatarSource(
      photoURL ? { uri: photoURL } : require("../assets/images/user.png")
    );
  }, [photoURL]);

  const handleSave = async () => {
    if (!uid || !currentUser || uploadingPhoto) return;

    if (!fullName.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập họ và tên.");
      return;
    }

    try {
      setSaving(true);
      await updateUserProfile(uid, {
        displayName: fullName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        photoURL: photoURL.trim(),
      });

      await updateProfile(currentUser, {
        displayName: fullName.trim(),
        photoURL: photoURL.trim() || undefined,
      });

      Alert.alert("Thành công", "Đã cập nhật hồ sơ.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Update profile failed", error);
      Alert.alert("Lỗi", "Không thể cập nhật hồ sơ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Quyền truy cập bị từ chối",
          "Ứng dụng cần quyền truy cập thư viện ảnh để thay đổi avatar."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const picked = result.assets[0];
      setAvatarSource({ uri: picked.uri });
      setUploadingPhoto(true);

      const uploadedUrl = await uploadImageToCloudinary(picked.uri);
      setPhotoURL(uploadedUrl);

      Alert.alert("Thành công", "Ảnh đại diện đã được cập nhật.");
    } catch (error) {
      console.error("Upload avatar failed", error);
      Alert.alert("Lỗi", "Không thể tải ảnh lên. Vui lòng thử lại.");
      setAvatarSource(
        photoURL ? { uri: photoURL } : require("../assets/images/user.png")
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007BFF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving || uploadingPhoto}
          style={saving || uploadingPhoto ? styles.doneButtonDisabled : undefined}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : uploadingPhoto ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Text style={styles.doneText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Avatar */}
      <View style={styles.profileSection}>
        <Image source={avatarSource} style={styles.avatar} />
        <Text style={styles.username}>{fullName || "User"}</Text>
        <TouchableOpacity onPress={handlePickAvatar} disabled={uploadingPhoto}>
          <Text style={styles.changePhoto}>
            {uploadingPhoto ? "Đang cập nhật ảnh..." : "Chọn ảnh từ thiết bị"}
          </Text>
        </TouchableOpacity>
        <Text style={styles.helperText}>Hoặc dán URL ảnh vào ô bên dưới.</Text>
      </View>

      {/* Input fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Họ và tên</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="VD: Nguyễn Văn A"
            value={fullName}
            onChangeText={setFullName}
          />
          <Ionicons name="person" size={20} color="#3B82F6" />
        </View>

        <Text style={styles.label}>Địa chỉ</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="VD: 123 Lê Lợi, TP. HCM"
            value={address}
            onChangeText={setAddress}
          />
          <Ionicons name="location-outline" size={20} color="#3B82F6" />
        </View>

        <Text style={styles.label}>Số điện thoại</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="VD: 0987654321"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <Ionicons name="call-outline" size={20} color="#3B82F6" />
        </View>

        <Text style={styles.label}>Ảnh đại diện (URL)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            value={photoURL}
            onChangeText={setPhotoURL}
            autoCapitalize="none"
          />
          <Ionicons name="image-outline" size={20} color="#3B82F6" />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 20 },
  header: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  doneText: { color: "#3B82F6", fontSize: 16, fontWeight: "600" },
  doneButtonDisabled: { opacity: 0.6 },
  profileSection: { alignItems: "center", marginTop: 25, marginBottom: 30 },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  username: { fontSize: 20, fontWeight: "700", color: "#111827", marginTop: 10 },
  changePhoto: { fontSize: 14, color: "#3B82F6", marginTop: 8 },
  helperText: { fontSize: 13, color: "#6B7280", marginTop: 6, textAlign: "center" },
  inputGroup: { marginBottom: 40 },
  label: { fontSize: 14, color: "#111827", fontWeight: "600", marginBottom: 6, marginLeft: 2 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    justifyContent: "space-between",
  },
  input: { flex: 1, fontSize: 15, color: "#111827" },
});
