import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
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
  View,
} from "react-native";
import {
  auth,
  deleteTour,
  getTourById,
  updateTour,
  uploadImageToCloudinary,
} from "../backend/firebaseService";

export default function EditTourScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const tourId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date());
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [originalImageUri, setOriginalImageUri] = useState<string | null>(null);
  const [ownerId, setOwnerId] = useState<string | null>(null);

  const loadTour = useCallback(async () => {
    if (!tourId) {
      Alert.alert("Thiếu thông tin", "Không tìm thấy tour cần chỉnh sửa.", [
        {
          text: "Đóng",
          onPress: () => router.back(),
        },
      ]);
      return;
    }

    setLoading(true);
    try {
      const record = await getTourById(tourId);
      if (!record) {
        Alert.alert("Không tìm thấy", "Tour đã bị xoá hoặc không tồn tại.", [
          {
            text: "Quay lại",
            onPress: () => router.back(),
          },
        ]);
        return;
      }

      setName(String(record.name ?? ""));
      setLocation(String(record.location ?? ""));
      setPrice(String(record.price ?? ""));
      setDescription(String(record.description ?? ""));
      setOwnerId(typeof record.ownerId === "string" ? record.ownerId : null);

      if (record.startDate) {
        const parsed = new Date(String(record.startDate));
        if (!Number.isNaN(parsed.getTime())) {
          setStartDate(parsed);
        }
      }

      if (record.image) {
        const remoteUri = String(record.image);
        setOriginalImageUri(remoteUri);
        setImagePreview(remoteUri);
      }
    } catch (error) {
      console.error("load tour error", error);
      Alert.alert("Lỗi", "Không thể tải thông tin tour.");
    } finally {
      setLoading(false);
    }
  }, [router, tourId]);

  useEffect(() => {
    loadTour();
  }, [loadTour]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;
      setImagePreview(selectedUri);
      setLocalImageUri(selectedUri);
    }
  };

  const ensureOwner = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert("Bạn cần đăng nhập", "Vui lòng đăng nhập để chỉnh sửa tour.");
      return false;
    }

    if (ownerId && currentUser.uid !== ownerId) {
      Alert.alert("Không có quyền", "Bạn không thể chỉnh sửa tour này.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!tourId) return;
    if (!name || !location || !price || !description) {
      Alert.alert("Thiếu thông tin", "Vui lòng điền đầy đủ thông tin tour.");
      return;
    }

    if (!ensureOwner()) return;

    setSaving(true);
    try {
      let imageUrl = originalImageUri;
      if (localImageUri) {
        imageUrl = await uploadImageToCloudinary(localImageUri);
        setLocalImageUri(null);
        setOriginalImageUri(imageUrl);
      }

      await updateTour(tourId, {
        name,
        location,
        price,
        description,
        startDate: startDate.toISOString(),
        image: imageUrl,
      });

      Alert.alert("Thành công", "Tour đã được cập nhật.", [
        {
          text: "Đóng",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("update tour error", error);
      Alert.alert("Lỗi", "Không thể cập nhật tour.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (!ensureOwner() || !tourId) return;

    Alert.alert("Xoá tour", "Bạn có chắc muốn xoá tour này?", [
      { text: "Huỷ", style: "cancel" },
      {
        text: "Xoá",
        style: "destructive",
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteTour(tourId);
            Alert.alert("Đã xoá", "Tour của bạn đã được xoá.", [
              {
                text: "Đóng",
                onPress: () => router.replace("/manage-tours"),
              },
            ]);
          } catch (error) {
            console.error("delete tour error", error);
            Alert.alert("Lỗi", "Không thể xoá tour.");
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  if (!tourId) {
    return (
      <View style={styles.loaderContainer}>
        <Text>Không xác định tour cần chỉnh sửa.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa tour</Text>
        <View style={{ width: 32 }} />
      </View>

      <TextInput
        placeholder="Tên tour"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <TextInput
        placeholder="Địa điểm"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={location}
        onChangeText={setLocation}
      />

      <TextInput
        placeholder="Giá"
        placeholderTextColor="#9CA3AF"
        style={styles.input}
        value={price}
        onChangeText={setPrice}
      />

      <TextInput
        placeholder="Mô tả"
        placeholderTextColor="#9CA3AF"
        style={[styles.input, { height: 120 }]}
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={[styles.input, { justifyContent: "center" }]} onPress={() => setShowDatePicker(true)}>
        <Text style={{ color: "#111827" }}>
          {`Ngày khởi hành: ${startDate.toLocaleDateString("vi-VN")}`}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          textColor="#111827"
          accentColor="#111827"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}

      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
        {imagePreview ? (
          <Image source={{ uri: imagePreview }} style={styles.imagePreview} />
        ) : (
          <Text style={{ color: "#6B7280" }}>Chọn ảnh đại diện</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, saving && { opacity: 0.6 }]}
        disabled={saving}
        onPress={handleSave}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Lưu thay đổi</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.dangerButton, deleting && { opacity: 0.6 }]}
        disabled={deleting}
        onPress={confirmDelete}
      >
        {deleting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.dangerText}>Xoá tour</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
  },
  imagePicker: {
    height: 180,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    overflow: "hidden",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  primaryButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  primaryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dangerButton: {
    backgroundColor: "#DC2626",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  dangerText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
