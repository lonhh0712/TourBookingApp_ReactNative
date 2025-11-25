import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { auth, createBooking, getUserProfile } from "../backend/firebaseService";

type TourBookingParams = {
  id?: string;
  name?: string;
  location?: string;
  price?: string;
  image?: string;
  rating?: string;
  startDate?: string;
  description?: string;
  peopleCount?: string;
};

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<TourBookingParams>();

  const {
    id,
    name,
    location,
    price,
    image,
    rating,
    startDate,
    description,
    peopleCount: peopleCountParam,
  } = params;

  const [peopleCount, setPeopleCount] = useState<number>(() => {
    const parsed = Number(peopleCountParam);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loadingUserInfo, setLoadingUserInfo] = useState(true);
  const [savingBooking, setSavingBooking] = useState(false);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoadingUserInfo(false);
          return;
        }

        const profile = await getUserProfile(user.uid);
        setFullName(String(profile?.displayName ?? user.displayName ?? ""));
        setEmail(String(profile?.email ?? user.email ?? ""));
        setPhone(String(profile?.phone ?? ""));
      } catch (error) {
        console.error("Load user info failed", error);
      } finally {
        setLoadingUserInfo(false);
      }
    };

    loadUserInfo();
  }, []);

  const increasePeople = () => setPeopleCount((prev) => Math.min(prev + 1, 20));
  const decreasePeople = () =>
    setPeopleCount((prev) => (prev > 1 ? prev - 1 : prev));

  const formattedDate = useMemo(() => {
    if (!startDate) return "Chưa cập nhật";
    const dateObj = new Date(startDate);
    return isNaN(dateObj.getTime())
      ? "Không xác định"
      : dateObj.toLocaleDateString("vi-VN");
  }, [startDate]);

  const tourDescription = useMemo(() => {
    if (!description) return "Thông tin chi tiết sẽ được cập nhật sau.";
    return description.length > 160
      ? `${description.slice(0, 157)}...`
      : description;
  }, [description]);

  const handleConfirmBookTour = async () => {
    if (savingBooking) {
      return;
    }

    if (!fullName.trim() || !email.trim() || !phone.trim()) {
      Alert.alert(
        "Thiếu thông tin",
        "Vui lòng điền đầy đủ họ tên, email và số điện thoại trước khi tiếp tục."
      );
      return;
    }

    const user = auth.currentUser;

    if (!user?.uid) {
      Alert.alert(
        "Cần đăng nhập",
        "Vui lòng đăng nhập trước khi đặt tour.",
        [{ text: "Đăng nhập", onPress: () => router.replace("/(auth)/sign-in") }]
      );
      return;
    }

    try {
      setSavingBooking(true);
      const bookingPayload = {
        userId: user.uid,
        tourId: id ?? null,
        tourName: name ?? null,
        location: location ?? null,
        startDate: startDate ?? null,
        attendees: peopleCount,
        contactName: fullName,
        contactEmail: email,
        contactPhone: phone,
        price: price ?? null,
        rating: rating ?? null,
        image: image ?? null,
      } as Record<string, unknown>;

      const bookingRef = await createBooking(bookingPayload);

      router.push({
        pathname: "/payment",
        params: {
          name,
          location,
          price,
          image,
          rating,
          startDate,
          description,
          peopleCount: String(peopleCount),
          tourId: id,
          fullName,
          contactEmail: email,
          contactPhone: phone,
          bookingId: bookingRef.id,
        },
      });
    } catch (error) {
      console.error("Create booking failed", error);
      Alert.alert(
        "Lỗi",
        "Không thể lưu thông tin đặt tour. Vui lòng thử lại."
      );
    } finally {
      setSavingBooking(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {loadingUserInfo ? (
        <View style={styles.userInfoLoading}>
          <ActivityIndicator size="small" color="#2563EB" />
          <Text style={styles.userInfoLoadingText}>Đang tải thông tin người dùng...</Text>
        </View>
      ) : null}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Tour</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Tour summary */}
      <View style={styles.summaryCard}>
        <Image
          source={
            image
              ? { uri: image }
              : require("../assets/images/nhatrang.jpg")
          }
          style={styles.image}
        />
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <Text style={styles.name}>{name || "Tour chưa xác định"}</Text>
          <Text style={styles.location}>{location || "Đang cập nhật"}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.metaText}>{rating || "4.5"}</Text>
          </View>
          <Text style={styles.price}>{price || "Liên hệ"}</Text>
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Ngày khởi hành</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={18} color="#2563EB" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Điểm đến</Text>
            <Text style={styles.infoValue}>{location || "Đang cập nhật"}</Text>
          </View>
        </View>
        <View style={styles.descriptionBlock}>
          <Text style={styles.infoLabel}>Mô tả tour</Text>
          <Text style={styles.descriptionText}>{tourDescription}</Text>
        </View>
      </View>

      <View style={styles.peopleCard}>
        <Text style={styles.infoLabel}>Số lượng khách</Text>
        <View style={styles.peopleControls}>
          <TouchableOpacity
            style={[styles.peopleButton, peopleCount <= 1 && styles.peopleButtonDisabled]}
            onPress={decreasePeople}
            disabled={peopleCount <= 1}
          >
            <Ionicons name="remove" size={18} color={peopleCount <= 1 ? "#9CA3AF" : "#111"} />
          </TouchableOpacity>
          <Text style={styles.peopleValue}>{peopleCount}</Text>
          <TouchableOpacity style={styles.peopleButton} onPress={increasePeople}>
            <Ionicons name="add" size={18} color="#111" />
          </TouchableOpacity>
        </View>
        <Text style={styles.peopleHint}>Tối đa 20 khách cho mỗi lượt đặt.</Text>
      </View>

      {/* Form thanh toán */}
      <View style={styles.form}>
        <Text style={styles.label}>Họ và tên</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập họ và tên"
          placeholderTextColor="#9CA3AF"
          value={fullName}
          onChangeText={setFullName}
        />
        {!fullName.trim() && !loadingUserInfo ? (
          <Text style={styles.missingHint}>Vui lòng nhập họ và tên của bạn.</Text>
        ) : null}

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        {!email.trim() && !loadingUserInfo ? (
          <Text style={styles.missingHint}>Chúng tôi cần email để gửi xác nhận.</Text>
        ) : null}

        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput
          style={styles.input}
          placeholder="0123456789"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
        {!phone.trim() && !loadingUserInfo ? (
          <Text style={styles.missingHint}>Vui lòng nhập số điện thoại để chúng tôi liên hệ.</Text>
        ) : null}

      </View>

      {/* Nút xác nhận */}
      <TouchableOpacity
        style={[styles.button, savingBooking && styles.buttonDisabled]}
        onPress={handleConfirmBookTour}
        disabled={savingBooking}
      >
        {savingBooking ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác nhận đặt tour</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, paddingTop: 50 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
  },
  image: { width: 100, height: 100 },
  name: { fontSize: 17, fontWeight: "700", color: "#111827" },
  location: { fontSize: 14, color: "#6B7280", marginVertical: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  metaText: { marginLeft: 4, fontSize: 13, color: "#111827" },
  price: { color: "#2563EB", fontWeight: "600", fontSize: 15 },
  infoCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoContent: { marginLeft: 12 },
  infoLabel: { fontSize: 14, color: "#6B7280" },
  infoValue: { fontSize: 15, color: "#111827", fontWeight: "600" },
  descriptionBlock: { marginTop: 8 },
  descriptionText: { fontSize: 14, color: "#374151", lineHeight: 20 },
  peopleCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  peopleControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  peopleButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  peopleButtonDisabled: {
    backgroundColor: "#F3F4F6",
  },
  peopleValue: { fontSize: 20, fontWeight: "700", color: "#111827" },
  peopleHint: { marginTop: 8, fontSize: 13, color: "#6B7280" },
  form: { marginTop: 10, marginBottom: 40 },
  label: { fontSize: 15, color: "#374151", marginBottom: 6 },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  userInfoLoading: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
  },
  userInfoLoadingText: { marginLeft: 10, fontSize: 13, color: "#2563EB" },
  missingHint: {
    fontSize: 12,
    color: "#DC2626",
    marginTop: -8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
