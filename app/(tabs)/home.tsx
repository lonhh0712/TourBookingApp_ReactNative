import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getTours } from "../../backend/firebaseService";

export default function HomeScreen() {
  const router = useRouter();
  const [tours, setTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Mỗi lần quay lại tab Home, load lại dữ liệu Firestore
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          setLoading(true);
          const data = await getTours();
          setTours(data);
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [])
  );

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Image
            source={require("../../assets/images/user.png")}
            style={styles.avatar}
          />
          <Text style={styles.username}>User</Text>
        </View>
        <TouchableOpacity style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={22} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.title}>
          Khám phá thế giới <Text style={styles.highlight}>tuyệt đẹp!</Text>
        </Text>
        <Text style={styles.subtitle}>Địa điểm tuyệt vời nhất!</Text>
      </View>

      {/* Danh sách tour */}
      <FlatList
        data={tours}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 50 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/details",
                params: { ...item },
              })
            }
          >
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardLocation}>{item.location}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FBBF24" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  username: { fontSize: 15, fontWeight: "600", color: "#111827" },
  bellButton: {
    backgroundColor: "#F3F4F6",
    padding: 8,
    borderRadius: 12,
  },
  titleBlock: {
    paddingHorizontal: 24,
    marginBottom: 12,
    paddingTop: 10,
  },
  title: {
    fontSize: 38,
    fontWeight: "400",
    color: "#111827",
    flexWrap: "wrap",
    width: "100%",
    lineHeight: 46,
  },
  highlight: { color: "#FF6B00", textDecorationLine: "underline" },
  subtitle: { fontSize: 17, color: "#6B7280", marginVertical: 16 },
  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 20,
    marginBottom: 18,
    overflow: "hidden",
    elevation: 3,
  },
  cardImage: { width: "100%", height: 120, resizeMode: "cover" },
  cardContent: { paddingHorizontal: 10, paddingVertical: 8 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111" },
  cardLocation: { fontSize: 13, color: "#6B7280", marginVertical: 3 },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: { marginLeft: 4, fontSize: 13, color: "#111827" },
});
