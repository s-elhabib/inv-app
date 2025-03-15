import { View, Text, StyleSheet, ScrollView } from "react-native"
import { LineChart, PieChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { ArrowUp, ArrowDown, Users, ShoppingBag, DollarSign, TrendingUp } from "lucide-react-native"

const screenWidth = Dimensions.get("window").width

export default function DashboardScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Admin Dashboard</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Users size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>24</Text>
            <Text style={styles.statsLabel}>Total Clients</Text>
            <View style={styles.statsChange}>
              <ArrowUp size={12} color="#4CAF50" />
              <Text style={styles.statsChangeText}>+12%</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <ShoppingBag size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>142</Text>
            <Text style={styles.statsLabel}>Total Products</Text>
            <View style={styles.statsChange}>
              <ArrowUp size={12} color="#4CAF50" />
              <Text style={styles.statsChangeText}>+8%</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <DollarSign size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>$45.2k</Text>
            <Text style={styles.statsLabel}>Total Revenue</Text>
            <View style={styles.statsChange}>
              <ArrowUp size={12} color="#4CAF50" />
              <Text style={styles.statsChangeText}>+15%</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <TrendingUp size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>1,234</Text>
            <Text style={styles.statsLabel}>Total Sales</Text>
            <View style={[styles.statsChange, styles.statsChangeNegative]}>
              <ArrowDown size={12} color="#F44336" />
              <Text style={styles.statsChangeTextNegative}>-3%</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Overview</Text>
        <LineChart
          data={{
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                data: [20, 45, 28, 80, 99, 43],
                color: (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
                strokeWidth: 2,
              },
            ],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#fff",
            backgroundGradientFrom: "#fff",
            backgroundGradientTo: "#fff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(244, 123, 32, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#F47B20",
            },
            propsForBackgroundLines: {
              strokeDasharray: "",
              stroke: "#F5F5F5",
            },
          }}
          bezier
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={false}
        />
      </View>

      <View style={styles.chartRow}>
        <View style={[styles.chartCard, styles.halfChart]}>
          <Text style={styles.chartTitle}>Sales by Category</Text>
          <PieChart
            data={[
              {
                name: "Food",
                population: 45,
                color: "#F47B20",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12,
              },
              {
                name: "Drink",
                population: 28,
                color: "#2196F3",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12,
              },
              {
                name: "Snack",
                population: 17,
                color: "#4CAF50",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12,
              },
              {
                name: "Dessert",
                population: 10,
                color: "#9C27B0",
                legendFontColor: "#7F7F7F",
                legendFontSize: 12,
              },
            ]}
            width={screenWidth / 2 - 30}
            height={180}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>

        <View style={[styles.chartCard, styles.halfChart]}>
          <Text style={styles.chartTitle}>Top Clients</Text>
          <View style={styles.clientsList}>
            <View style={styles.clientItem}>
              <Text style={styles.clientName}>Nusantara Restaurant</Text>
              <Text style={styles.clientValue}>$12.5k</Text>
            </View>
            <View style={styles.clientItem}>
              <Text style={styles.clientName}>Spice Garden</Text>
              <Text style={styles.clientValue}>$8.3k</Text>
            </View>
            <View style={styles.clientItem}>
              <Text style={styles.clientName}>Ocean Delight</Text>
              <Text style={styles.clientValue}>$6.7k</Text>
            </View>
            <View style={styles.clientItem}>
              <Text style={styles.clientName}>Urban Bites</Text>
              <Text style={styles.clientValue}>$5.2k</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 15,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  statsGrid: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    width: "48%",
  },
  statsIconContainer: {
    backgroundColor: "rgba(244, 123, 32, 0.1)",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  statsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statsChange: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statsChangeNegative: {
    backgroundColor: "rgba(244, 67, 54, 0.1)",
  },
  statsChangeText: {
    fontSize: 10,
    color: "#4CAF50",
    marginLeft: 2,
  },
  statsChangeTextNegative: {
    fontSize: 10,
    color: "#F44336",
    marginLeft: 2,
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfChart: {
    width: "48%",
  },
  clientsList: {
    marginTop: 10,
  },
  clientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  clientName: {
    fontSize: 12,
    color: "#666",
  },
  clientValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#333",
  },
})

