import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getTours } from "../../backend/firebaseService"; // ✅ import backend

export default function SearchScreen() {
  const router = useRouter();
  const [tours, setTours] = useState<any[]>([]);
  const [filteredTours, setFilteredTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // 🔹 Lấy dữ liệu Firestore
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTours();
        setTours(data);
        setFilteredTours(data);
      } catch (error) {
        console.error("Lỗi tải dữ liệu Firestore:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🔹 Hàm tìm kiếm
  const handleSearch = (text: string) => {
    setSearchText(text);
    const filtered = tours.filter((item) =>
      item.name.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredTours(filtered);
  };

  const renderCard = ({ item }: any) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/details",
          params: {
            id: item.id,
            name: item.name,
            location: item.location,
            price: item.price,
            image: item.image,
            description: item.description,
            rating: item.rating,
          },
        })
      }
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardLocation}>{item.location}</Text>
        <Text style={styles.cardPrice}>{item.price}</Text>
      </View>
    </TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tìm kiếm</Text>
        <TouchableOpacity onPress={() => setSearchText("")}>
          <Text style={styles.cancelText}>Xoá</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#9CA3AF"
          style={{ marginRight: 8 }}
        />
        <TextInput
          placeholder="Nhập tên địa điểm..."
          placeholderTextColor="#9CA3AF"
          style={styles.input}
          value={searchText}
          onChangeText={handleSearch}
        />
        <Ionicons name="mic-outline" size={20} color="#9CA3AF" />
      </View>

      {/* Kết quả */}
      <Text style={styles.sectionTitle}>Kết quả</Text>

      {filteredTours.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 20 }}>
          Không tìm thấy tour nào.
        </Text>
      ) : (
        <FlatList
          data={filteredTours}
          numColumns={2}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={renderCard}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingTop: 60 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  cancelText: { fontSize: 16, color: "#2563EB" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 16,
  },
  input: { flex: 1, fontSize: 16, color: "#111827" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 20,
    width: "48%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: { padding: 10 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  cardLocation: { fontSize: 13, color: "#6B7280", marginVertical: 2 },
  cardPrice: { fontSize: 14, color: "#2563EB", fontWeight: "500" },
});
