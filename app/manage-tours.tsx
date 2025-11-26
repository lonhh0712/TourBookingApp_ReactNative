import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { useCallback, useEffect, useState } from "react";

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
import { auth, getToursByOwner } from "../backend/firebaseService";

export default function ManageToursScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return unsubscribe;
  }, []);

  const fetchTours = useCallback(async () => {
    if (!user) {
      setTours([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const ownerTours = await getToursByOwner(user.uid);
      setTours(ownerTours);
    } catch (error) {
      console.error("Failed to load owner tours", error);
      Alert.alert("Lỗi", "Không thể tải danh sách tour của bạn.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchTours();
    }, [fetchTours])
  );

  const onRefresh = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      await fetchTours();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTours, user]);

  const handleManageTour = (tour: any) => {
    router.push({
      pathname: "/edit-tour",
      params: { id: tour.id },
    });
  };

  if (!user) {
    return (
      <View style={styles.authPrompt}>
        <Text style={styles.title}>Bạn cần đăng nhập</Text>
        <Text style={styles.subtitle}>Hãy đăng nhập để quản lý các tour đã đăng.</Text>
        <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/(auth)/sign-in")}>
          <Text style={styles.ctaText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản lý tour đã đăng</Text>
        <View style={{ width: 32 }} />
      </View>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      ) : (
        <FlatList
          data={tours}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={tours.length ? undefined : styles.emptyWrapper}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <AntDesign name="inbox" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>Bạn chưa đăng tour nào</Text>
              <Text style={styles.emptySubtitle}>Bắt đầu chia sẻ hành trình của bạn để thu hút du khách.</Text>
              <TouchableOpacity style={styles.ctaButton} onPress={() => router.push("/(tabs)/upload-tour")}>
                <Text style={styles.ctaText}>Đăng tour ngay</Text>
              </TouchableOpacity>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => handleManageTour(item)}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardLocation}>{item.location}</Text>
                {item.startDate ? (
                  <Text style={styles.cardDate}>
                    Khởi hành: {new Date(item.startDate).toLocaleDateString("vi-VN")}
                  </Text>
                ) : null}
                <Text style={styles.cardPrice}>{item.price}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
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
  authPrompt: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyWrapper: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingHorizontal: 30,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "600",
    color: "#111827",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 15,
    textAlign: "center",
    color: "#6B7280",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  cardImage: {
    width: 110,
    height: 110,
  },
  cardContent: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  cardLocation: {
    marginTop: 4,
    color: "#6B7280",
  },
  cardDate: {
    marginTop: 4,
    color: "#6B7280",
    fontSize: 14,
  },
  cardPrice: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 24,
  },
  ctaButton: {
    backgroundColor: "#FF6B00",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 20,
  },
  ctaText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
