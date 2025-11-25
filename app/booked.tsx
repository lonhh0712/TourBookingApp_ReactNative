import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ListRenderItem } from "react-native";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { auth, getBookings } from "../backend/firebaseService";

type BookingItem = {
  id: string;
  tourName?: string | null;
  location?: string | null;
  startDate?: string | null;
  attendees?: number | null;
  paymentStatus?: string | null;
  status?: string | null;
  price?: string | null;
  createdAt?: string | null;
};

export default function BookedScreen() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed">("upcoming");

  const { upcomingBookings, completedBookings } = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const upcoming: BookingItem[] = [];
    const completed: BookingItem[] = [];

    const parseDate = (value?: string | null) => {
      if (!value) {
        return null;
      }
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };

    bookings.forEach((booking) => {
      const parsedDate = parseDate(booking.startDate);

      if (!parsedDate || parsedDate >= startOfToday) {
        upcoming.push(booking);
      } else {
        completed.push(booking);
      }
    });

    const sortByDateAsc = (a: BookingItem, b: BookingItem) => {
      const getTimeValue = (booking: BookingItem) => {
        const parsed = parseDate(booking.startDate);
        return parsed ? parsed.getTime() : Number.MAX_SAFE_INTEGER;
      };

      return getTimeValue(a) - getTimeValue(b);
    };

    return {
      upcomingBookings: upcoming.sort(sortByDateAsc),
      completedBookings: completed.sort(sortByDateAsc),
    };
  }, [bookings]);
  const normalizeBooking = useCallback((raw: Record<string, unknown>): BookingItem => {
    const toStringOrNull = (value: unknown) =>
      typeof value === "string" ? value : value != null ? String(value) : null;

    const toNumberOrNull = (value: unknown) => {
      if (typeof value === "number") return value;
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };

    return {
      id: toStringOrNull(raw.id) ?? crypto.randomUUID(),
      tourName: toStringOrNull(raw.tourName),
      location: toStringOrNull(raw.location),
      startDate: toStringOrNull(raw.startDate),
      attendees: toNumberOrNull(raw.attendees),
      paymentStatus: toStringOrNull(raw.paymentStatus),
      status: toStringOrNull(raw.status),
      price: toStringOrNull(raw.price),
      createdAt: toStringOrNull(raw.createdAt),
    };
  }, []);

  const loadBookings = useCallback(
    async (uid: string, showSpinner = false) => {
      if (showSpinner) {
        setLoading(true);
      }

      try {
        const data = await getBookings(uid);
        setBookings(data.map(normalizeBooking));
      } catch (error) {
        console.error("load bookings failed", error);
        Alert.alert("Lỗi", "Không thể tải danh sách chuyến đi.");
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    [normalizeBooking]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        loadBookings(user.uid, true).catch((error) =>
          console.error("initial bookings load failed", error)
        );
      } else {
        setBookings([]);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadBookings]);

  useFocusEffect(
    useCallback(() => {
      const current = auth.currentUser;
      if (current) {
        loadBookings(current.uid, true).catch((error) =>
          console.error("focus bookings load failed", error)
        );
      }
    }, [loadBookings])
  );

  const handleRefresh = useCallback(async () => {
    const uid = firebaseUser?.uid;
    if (!uid) {
      return;
    }
    setRefreshing(true);
    try {
      await loadBookings(uid);
    } finally {
      setRefreshing(false);
    }
  }, [firebaseUser?.uid, loadBookings]);

  const renderItem = useCallback<ListRenderItem<BookingItem>>(
    ({ item }) => {
      const formattedDate = item.startDate
        ? new Date(item.startDate).toLocaleDateString("vi-VN")
        : "Chưa cập nhật";

      return (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.tourName || "Tour chưa xác định"}</Text>
            <View
              style={[
                styles.statusBadge,
                item.status === "pending" && styles.statusPending,
                item.status === "confirmed" && styles.statusConfirmed,
                item.status === "cancelled" && styles.statusCancelled,
              ]}
            >
              <Text style={styles.statusText}>{item.status || "pending"}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color="#2563EB" />
            <Text style={styles.rowText}>{item.location || "Đang cập nhật"}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={16} color="#2563EB" />
            <Text style={styles.rowText}>{formattedDate}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="people-outline" size={16} color="#2563EB" />
            <Text style={styles.rowText}>{`Số khách: ${item.attendees ?? 1}`}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="card-outline" size={16} color="#2563EB" />
            <Text style={styles.rowText}>{`Thanh toán: ${item.paymentStatus || "pending"}`}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="cash-outline" size={16} color="#2563EB" />
            <Text style={styles.rowText}>{item.price || "Liên hệ"}</Text>
          </View>
        </View>
      );
    },
    []
  );

  const sections = useMemo(
    () => ({
      upcoming: upcomingBookings,
      completed: completedBookings,
    }),
    [completedBookings, upcomingBookings]
  );

  const displayedBookings = useMemo(() => {
    return activeTab === "upcoming" ? sections.upcoming : sections.completed;
  }, [activeTab, sections.completed, sections.upcoming]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      );
    }

    if (!firebaseUser) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Vui lòng đăng nhập để xem lịch sử đặt tour.</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace("/(auth)/sign-in")}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!bookings.length) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Bạn chưa có chuyến đi nào.</Text>
        </View>
      );
    }

    if (!displayedBookings.length) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoText}>
            {activeTab === "upcoming"
              ? "Hiện chưa có chuyến đi sắp tới."
              : "Bạn chưa có chuyến đi đã hoàn thành."}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={displayedBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
    );
  }, [activeTab, bookings.length, displayedBookings, firebaseUser, handleRefresh, loading, refreshing, renderItem, router]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chuyến đã book</Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "upcoming" && styles.tabButtonActive]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[styles.tabText, activeTab === "upcoming" && styles.tabTextActive]}
          >
            Chưa đi
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "completed" && styles.tabButtonActive]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[styles.tabText, activeTab === "completed" && styles.tabTextActive]}
          >
            Đã đi
          </Text>
        </TouchableOpacity>
      </View>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 50 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  infoText: { fontSize: 15, color: "#6B7280", textAlign: "center", marginBottom: 16 },
  loginButton: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  loginButtonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 4,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonActive: {
    backgroundColor: "#2563EB",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  tabTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827", flex: 1, marginRight: 12 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
  },
  statusPending: {
    backgroundColor: "#FEF3C7",
  },
  statusConfirmed: {
    backgroundColor: "#DCFCE7",
  },
  statusCancelled: {
    backgroundColor: "#FEE2E2",
  },
  statusText: { fontSize: 12, fontWeight: "600", color: "#111827" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  rowText: { marginLeft: 8, fontSize: 14, color: "#4B5563" },
});
