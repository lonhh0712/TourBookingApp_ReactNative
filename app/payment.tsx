import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, createBooking, createPayment, updatePaymentStatus } from "../backend/firebaseService";

type PaymentParams = {
  name?: string;
  location?: string;
  price?: string;
  image?: string;
  rating?: string;
  startDate?: string;
  description?: string;
  peopleCount?: string;
  tourId?: string;
  fullName?: string;
  contactEmail?: string;
  contactPhone?: string;
  bookingId?: string;
};

export default function PaymentScreen() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<"MoMo" | "PayOS">("MoMo");
  const [processing, setProcessing] = useState(false);
  const {
    name,
    location,
    price,
    image,
    rating,
    startDate,
    description,
    peopleCount,
    tourId,
    fullName: fullNameParam,
    contactEmail: contactEmailParam,
    contactPhone: contactPhoneParam,
    bookingId: bookingIdParam,
  } = useLocalSearchParams<PaymentParams>();

  const normalizeParam = useMemo(
    () =>
      function normalize(value?: string | string[] | null): string | undefined {
        if (!value) return undefined;
        return Array.isArray(value) ? value[0] : value;
      },
    []
  );

  const fullName = normalizeParam(fullNameParam) ?? "";
  const contactEmail = normalizeParam(contactEmailParam) ?? "";
  const contactPhone = normalizeParam(contactPhoneParam) ?? "";
  const normalizedTourId = normalizeParam(tourId);
  const existingBookingId = normalizeParam(bookingIdParam);

  const tourName = normalizeParam(name);
  const tourLocation = normalizeParam(location);
  const tourPrice = normalizeParam(price);
  const tourImage = normalizeParam(image);
  const tourRating = normalizeParam(rating);
  const tourStartDate = normalizeParam(startDate);
  const tourDescription = normalizeParam(description);
  const tourPeopleCount = normalizeParam(peopleCount);

  const attendeeCount = useMemo(() => {
    const parsed = Number(tourPeopleCount);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
  }, [tourPeopleCount]);

  const displayPrice = tourPrice || "Liên hệ";

  const pricePerPerson = useMemo(() => {
    if (!tourPrice) return undefined;
    const numericPart = tourPrice.replace(/[^0-9]/g, "");
    if (!numericPart) return undefined;
    const parsed = Number(numericPart);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }, [tourPrice]);

  const totalAmountLabel = useMemo(() => {
    if (!pricePerPerson) return displayPrice;
    const total = pricePerPerson * attendeeCount;

    if (tourPrice?.includes("$")) {
      return `$${total}`;
    }

    if (/đ/i.test(tourPrice ?? "")) {
      return `${total.toLocaleString("vi-VN")}đ`;
    }

    return total.toLocaleString("vi-VN");
  }, [pricePerPerson, attendeeCount, tourPrice, displayPrice]);

  const amountBreakdown = useMemo(() => {
    if (!pricePerPerson || !tourPrice) return undefined;
    return `${tourPrice} x ${attendeeCount} khách`;
  }, [pricePerPerson, tourPrice, attendeeCount]);

  const handleConfirmPayment = async () => {
    if (processing) return;

    const user = auth.currentUser;
    const userId = user?.uid;

    if (!userId) {
      Alert.alert(
        "Cần đăng nhập",
        "Vui lòng đăng nhập trước khi thanh toán.",
        [{ text: "Đăng nhập", onPress: () => router.replace("/(auth)/sign-in") }]
      );
      return;
    }

    let paymentId: string | null = null;
    let bookingId = existingBookingId ?? null;
    const bookingPayload = {
      userId,
      tourName: tourName ?? null,
      tourId: normalizedTourId ?? null,
      location: tourLocation ?? null,
      startDate: tourStartDate ?? null,
      attendees: attendeeCount,
      contactName: fullName ?? null,
      contactEmail: contactEmail ?? null,
      contactPhone: contactPhone ?? null,
      price: tourPrice,
      paymentMethod,
    } as Record<string, unknown>;

    try {
      setProcessing(true);
      if (!bookingId) {
        const bookingRef = await createBooking(bookingPayload);
        bookingId = bookingRef.id;
      }

      const paymentRef = await createPayment({
        bookingId,
        userId,
        amount: pricePerPerson ? pricePerPerson * attendeeCount : null,
        currency: tourPrice?.includes("$") ? "USD" : undefined,
        paymentMethod,
        contactEmail,
        contactPhone,
        contactName: fullName,
        tourName,
        tourId: normalizedTourId,
      });
      paymentId = paymentRef.id;

      if (paymentId) {
        await updatePaymentStatus(paymentId, "paid");
      }

      Alert.alert(
        "Thanh toán thành công 🎉",
        `Cảm ơn bạn đã hoàn tất thanh toán cho tour ${tourName || "đã chọn"}!\nPhương thức: ${paymentMethod}`,
        [{ text: "Về trang chủ", onPress: () => router.replace("/(tabs)/home") }]
      );
    } catch (error) {
      console.error("Payment confirmation failed", error);
      Alert.alert(
        "Lỗi",
        "Không thể hoàn tất thanh toán. Vui lòng thử lại."
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.summaryCard}>
        <Image
          source={
            tourImage
              ? { uri: tourImage }
              : require("../assets/images/nhatrang.jpg")
          }
          style={styles.image}
        />
        <View style={{ flex: 1, paddingLeft: 10 }}>
          <Text style={styles.name}>{tourName || "Tour chưa xác định"}</Text>
          <Text style={styles.location}>{tourLocation || "Đang cập nhật"}</Text>
          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={styles.metaText}>{tourRating || "4.5"}</Text>
          </View>
          <Text style={styles.price}>{tourPrice || "Liên hệ"}</Text>
        </View>
      </View>

      <View style={styles.extraInfo}>
        <Text style={styles.sectionTitle}>Thông tin tour</Text>
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={18} color="#2563EB" />
          <Text style={styles.infoText}>
            Ngày khởi hành: {tourStartDate ? new Date(tourStartDate).toLocaleDateString("vi-VN") : "Chưa cập nhật"}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={18} color="#2563EB" />
          <Text style={styles.infoText}>
            Số lượng khách: {attendeeCount}
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={18} color="#2563EB" />
          <Text style={styles.infoText}>
            {tourDescription || "Thông tin chi tiết sẽ được cập nhật sau."}
          </Text>
        </View>
      </View>

      <View style={styles.amountCard}>
        <Text style={styles.sectionTitle}>Số tiền cần thanh toán</Text>
        <Text style={styles.amountText}>{totalAmountLabel}</Text>
        {amountBreakdown ? (
          <Text style={styles.amountBreakdown}>{amountBreakdown}</Text>
        ) : null}
      </View>

      <View style={styles.methodCard}>
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.methodList}>
          <TouchableOpacity
            style={[
              styles.methodItem,
              paymentMethod === "MoMo" && styles.methodItemActive,
            ]}
            onPress={() => setPaymentMethod("MoMo")}
          >
            <Ionicons
              name="wallet-outline"
              size={20}
              color={paymentMethod === "MoMo" ? "#fff" : "#111827"}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === "MoMo" && styles.methodTextActive,
              ]}
            >
              MoMo
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.methodItem,
              paymentMethod === "PayOS" && styles.methodItemActive,
            ]}
            onPress={() => setPaymentMethod("PayOS")}
          >
            <Ionicons
              name="card-outline"
              size={20}
              color={paymentMethod === "PayOS" ? "#fff" : "#111827"}
            />
            <Text
              style={[
                styles.methodText,
                paymentMethod === "PayOS" && styles.methodTextActive,
              ]}
            >
              PayOS
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, processing && styles.buttonDisabled]}
        onPress={handleConfirmPayment}
        disabled={processing}
      >
        {processing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Xác nhận thanh toán</Text>
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
  extraInfo: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  infoText: { marginLeft: 8, fontSize: 14, color: "#374151", flex: 1 },
  amountCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  amountText: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "700",
    color: "#2563EB",
  },
  amountBreakdown: {
    marginTop: 6,
    fontSize: 13,
    color: "#6B7280",
  },
  methodCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
  },
  methodList: {
    flexDirection: "row",
    columnGap: 12,
    marginTop: 12,
  },
  methodItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#fff",
  },
  methodItemActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  methodText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  methodTextActive: {
    color: "#fff",
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
