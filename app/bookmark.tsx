import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import {
    auth,
    getBookmarks,
    getToursByIds,
    removeBookmark,
} from "../backend/firebaseService";

type BookmarkedTour = {
  id: string;
  name?: string;
  location?: string;
  price?: string;
  image?: string;
  rating?: number | string;
  startDate?: string;
  description?: string;
};

export default function BookmarkScreen() {
  const router = useRouter();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tours, setTours] = useState<BookmarkedTour[]>([]);

  const normalizeTours = useCallback(
    (rawTours: Array<Record<string, unknown> & { id: string }>): BookmarkedTour[] => {
      return rawTours.map((tour) => ({
        id: String(tour.id),
        name: typeof tour.name === "string" ? tour.name : undefined,
        location: typeof tour.location === "string" ? tour.location : undefined,
        price: typeof tour.price === "string" ? tour.price : undefined,
        image: typeof tour.image === "string" ? tour.image : undefined,
        rating:
          typeof tour.rating === "number" || typeof tour.rating === "string"
            ? tour.rating
            : undefined,
        startDate: typeof tour.startDate === "string" ? tour.startDate : undefined,
        description:
          typeof tour.description === "string" ? tour.description : undefined,
      }));
    },
    []
  );

  const loadBookmarks = useCallback(
    async (uid: string, showSpinner = false) => {
      if (showSpinner) {
        setLoading(true);
      }

      try {
        const bookmarkIds = await getBookmarks(uid);
        if (!bookmarkIds.length) {
          setTours([]);
          return;
        }

        const rawTours = await getToursByIds(bookmarkIds);
        setTours(normalizeTours(rawTours));
      } catch (error) {
        console.error("load bookmarks failed", error);
        Alert.alert("Lỗi", "Không thể tải danh sách tour đã lưu.");
      } finally {
        if (showSpinner) {
          setLoading(false);
        }
      }
    },
    [normalizeTours]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        loadBookmarks(user.uid, true).catch((error) =>
          console.error("initial bookmark load failed", error)
        );
      } else {
        setTours([]);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [loadBookmarks]);

  useFocusEffect(
    useCallback(() => {
      const current = auth.currentUser;
      if (current) {
        loadBookmarks(current.uid, true).catch((error) =>
          console.error("focus bookmark load failed", error)
        );
      }
    }, [loadBookmarks])
  );

  const handleRefresh = useCallback(async () => {
    const uid = firebaseUser?.uid;
    if (!uid) {
      return;
    }
    setRefreshing(true);
    try {
      await loadBookmarks(uid);
    } finally {
      setRefreshing(false);
    }
  }, [firebaseUser?.uid, loadBookmarks]);

  const handleRemove = useCallback(
    async (tourId: string) => {
      const uid = firebaseUser?.uid;
      if (!uid) {
        router.replace("/(auth)/sign-in");
        return;
      }

      try {
        await removeBookmark(uid, tourId);
        setTours((prev) => prev.filter((tour) => tour.id !== tourId));
      } catch (error) {
        console.error("remove bookmark failed", error);
        Alert.alert("Lỗi", "Không thể xoá tour này khỏi danh sách lưu.");
      }
    },
    [firebaseUser?.uid, router]
  );

  const renderItem = useCallback(
    ({ item }: { item: BookmarkedTour }) => (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() =>
          router.push({
            pathname: "/details",
            params: {
              id: item.id,
              name: item.name,
              location: item.location,
              price: item.price,
              image: item.image,
              rating: item.rating,
              startDate: item.startDate,
              description: item.description,
            },
          })
        }
      >
        <Image
          source={
            item.image
              ? { uri: item.image }
              : require("../assets/images/nhatrang.jpg")
          }
          style={styles.cardImage}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name || "Tour chưa xác định"}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemove(item.id)}
            >
              <Ionicons name="bookmark" size={18} color="#FBBF24" />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardLocation} numberOfLines={1}>
            {item.location || "Đang cập nhật"}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaGroup}>
              <Ionicons name="star" size={14} color="#FBBF24" />
              <Text style={styles.metaText}>{item.rating ?? "4.5"}</Text>
            </View>
            <Text style={styles.cardPrice}>{item.price || "Liên hệ"}</Text>
          </View>
        </View>
      </TouchableOpacity>
    ),
    [handleRemove, router]
  );

  const listContent = useMemo(() => {
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
          <Text style={styles.infoText}>Vui lòng đăng nhập để xem tour đã lưu.</Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.replace("/(auth)/sign-in")}
          >
            <Text style={styles.loginButtonText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!tours.length) {
      return (
        <View style={styles.centered}>
          <Text style={styles.infoText}>Bạn chưa lưu tour nào.</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    );
  }, [firebaseUser, handleRefresh, loading, refreshing, renderItem, router, tours]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tour đã lưu</Text>
        <View style={{ width: 32 }} />
      </View>
      {listContent}
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
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardImage: { width: "100%", height: 160, resizeMode: "cover" },
  cardContent: { padding: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#111827", flex: 1, marginRight: 12 },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLocation: { marginTop: 6, fontSize: 14, color: "#6B7280" },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  metaGroup: { flexDirection: "row", alignItems: "center" },
  metaText: { marginLeft: 4, fontSize: 13, color: "#111827" },
  cardPrice: { fontSize: 15, fontWeight: "600", color: "#2563EB" },
});
