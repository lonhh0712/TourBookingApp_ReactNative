import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DetailsScreen() {
  const router = useRouter();
  const { name, location, rating, price, image } = useLocalSearchParams();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết</Text>
        <Ionicons name="bookmark-outline" size={22} color="#2563EB" />
      </View>

      {/* Ảnh tour */}
      <Image
        source={
          image
            ? { uri: image }
            : require("../assets/images/nhatrang.jpg")
        }
        style={styles.mainImage}
      />

      {/* Thông tin cơ bản */}
      <View style={styles.infoSection}>
        <Text style={styles.tourName}>{name}</Text>
        <Text style={styles.tourLocation}>{location}</Text>

        <View style={styles.row}>
          <Ionicons name="star" size={16} color="#FBBF24" />
          <Text style={styles.rating}>{rating} / 5.0</Text>
        </View>

        <Text style={styles.price}>{price || "$59/Người"}</Text>
      </View>

      {/* Mô tả chi tiết */}
      <View style={styles.detailBox}>
        <Text style={styles.detailTitle}>Thông tin</Text>
        <Text style={styles.detailText}>
          Tour {name} sẽ đưa bạn đến những địa điểm tuyệt đẹp tại {location}.
          Hành trình bao gồm khách sạn 3*, bữa sáng và phương tiện di chuyển
          thuận tiện.{"\n\n"}
          Bạn sẽ có cơ hội trải nghiệm cảnh quan thiên nhiên, văn hóa địa
          phương và các hoạt động ngoài trời đầy thú vị.
        </Text>
      </View>

      {/* Nút Book Now */}
      <TouchableOpacity
        style={styles.bookButton}
        onPress={() =>
          router.push({
            pathname: "/payment",
            params: { name, location, price, image },
          })
        }
      >
        <Text style={styles.bookButtonText}>Book Now</Text>
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
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#111827" },
  mainImage: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  infoSection: { marginBottom: 20 },
  tourName: { fontSize: 22, fontWeight: "700", color: "#111827" },
  tourLocation: { color: "#6B7280", marginVertical: 4, fontSize: 15 },
  row: { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  rating: { marginLeft: 6, fontSize: 14, color: "#111827" },
  price: { fontSize: 18, color: "#2563EB", fontWeight: "700", marginTop: 6 },
  detailBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 14,
    marginBottom: 30,
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111827",
  },
  detailText: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 20,
  },
  bookButton: {
    backgroundColor: "#2563EB",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
