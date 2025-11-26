import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  addTourToFirestore,
  auth,
  getUserProfile,
  uploadImageToCloudinary,
} from "../../backend/firebaseService";

export default function UploadTourScreen() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🟠 Chọn ảnh từ thư viện
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // 🟢 Gửi dữ liệu tour lên Firestore
  const handleSubmit = async () => {
    if (!name || !location || !price || !description || !imageUri) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ và chọn ảnh!");
      return;
    }

    if (!startDate || Number.isNaN(startDate.getTime())) {
      Alert.alert("Ngày không hợp lệ", "Vui lòng chọn ngày khởi hành hợp lệ.");
      return;
    }

    const now = new Date();
    if (startDate.getTime() <= now.getTime()) {
      Alert.alert(
        "Ngày khởi hành không hợp lệ",
        "Ngày khởi hành phải sau ngày hiện tại."
      );
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("Bạn cần đăng nhập", "Vui lòng đăng nhập để đăng tour mới.");
      return;
    }

    setLoading(true);
    try {
      const userProfile = await getUserProfile(currentUser.uid);
      const imageUrl = await uploadImageToCloudinary(imageUri);
      const ownerName =
        userProfile?.displayName ||
        currentUser.displayName ||
        currentUser.email ||
        "Người dùng";

      await addTourToFirestore({
        name,
        location,
        price,
        description,
        image: imageUrl,
        rating: 4.5,
        startDate: startDate.toISOString(), // ✅ thêm startDate
        ownerId: currentUser.uid,
        ownerName,
        ownerEmail: userProfile?.email || currentUser.email || "",
        ownerPhoto: userProfile?.photoURL || currentUser.photoURL || null,
      });

      Alert.alert("Thành công", "Tour đã được đăng!");
      // Reset form
      setName("");
      setLocation("");
      setPrice("");
      setDescription("");
      setImageUri(null);
      setStartDate(new Date());
    } catch (error) {
      console.error(error);
      Alert.alert("Lỗi", "Không thể đăng tour!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Đăng tour mới</Text>

      <TextInput
        placeholder="Tên tour"
        placeholderTextColor="#b8b8b8ff"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Địa điểm"
        placeholderTextColor="#b8b8b8ff"
        style={styles.input}
        value={location}
        onChangeText={setLocation}
      />

      <TextInput
        placeholder="Giá (VD: $89/Người)"
        placeholderTextColor="#b8b8b8ff"
        style={styles.input}
        value={price}
        onChangeText={setPrice}
      />

      <TextInput
        placeholder="Mô tả"
        placeholderTextColor="#b8b8b8ff"
        style={[styles.input, { height: 100 }]}
        value={description}
        multiline
        onChangeText={setDescription}
      />

      {/* 🗓️ Chọn ngày khởi hành */}
      <TouchableOpacity
        style={[styles.input, { justifyContent: "center" }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={{ color: "#111827", fontSize: 16 }}>
          {`Ngày khởi hành: ${startDate.toLocaleDateString("vi-VN")}`}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          textColor="#111827"
          accentColor="#111827"
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}

      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        ) : (
          <Text style={{ color: "#888" }}>Chọn ảnh từ thiết bị</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Đăng tour</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 18,
    fontSize: 16,
    marginBottom: 12,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 10,
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  submitButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
