import { View, Text, StyleSheet, ScrollView } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { ArrowUp, Package, Grid, ShoppingCart, DollarSign } from "lucide-react-native"

const screenWidth = Dimensions.get("window").width

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* Profit Card */}
      <View style={styles.profitCard}>
        <Text style={styles.profitLabel}>Profit amount</Text>
        <Text style={styles.profitAmount}>$ 15.237.000</Text>
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>+15%</Text>
          <Text style={styles.periodText}>From the previous week</Text>
        </View>

        <LineChart
          data={{
            labels: [],
            datasets: [
              {
                data: [
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                  Math.random() * 100,
                ],
              },
            ],
          }}
          width={screenWidth - 60}
          height={100}
          withDots={false}
          withInnerLines={false}
          withOuterLines={false}
          withVerticalLabels={false}
          withHorizontalLabels={false}
          chartConfig={{
            backgroundColor: "#F47B20",
            backgroundGradientFrom: "#F47B20",
            backgroundGradientTo: "#F47B20",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#ffa726",
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Package size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsLabel}>Total Products</Text>
            <View style={styles.statsValueContainer}>
              <Text style={styles.statsValue}>25</Text>
              <View style={styles.statsPercentage}>
                <ArrowUp size={12} color="#4CAF50" />
                <Text style={styles.statsPercentageText}>+15%</Text>
              </View>
            </View>
            <Text style={styles.statsDate}>Update: 20 July 2024</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Grid size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsLabel}>Product Category</Text>
            <View style={styles.statsValueContainer}>
              <Text style={styles.statsValue}>4</Text>
              <View style={styles.statsPercentage}>
                <ArrowUp size={12} color="#4CAF50" />
                <Text style={styles.statsPercentageText}>+15%</Text>
              </View>
            </View>
            <Text style={styles.statsDate}>Update: 20 July 2024</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <ShoppingCart size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsLabel}>Total Sold</Text>
            <View style={styles.statsValueContainer}>
              <Text style={styles.statsValue}>11.967</Text>
              <View style={styles.statsPercentage}>
                <ArrowUp size={12} color="#4CAF50" />
                <Text style={styles.statsPercentageText}>+15%</Text>
              </View>
            </View>
            <Text style={styles.statsDate}>Update: 20 July 2024</Text>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <DollarSign size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsLabel}>Monthly Income</Text>
            <View style={styles.statsValueContainer}>
              <Text style={styles.statsValue}>2.5jt</Text>
              <View style={styles.statsPercentage}>
                <ArrowUp size={12} color="#4CAF50" />
                <Text style={styles.statsPercentageText}>+15%</Text>
              </View>
            </View>
            <Text style={styles.statsDate}>Update: 20 July 2024</Text>
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
  profitCard: {
    backgroundColor: "#F47B20",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  profitLabel: {
    color: "white",
    fontSize: 14,
    marginBottom: 5,
  },
  profitAmount: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  percentageContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  percentageText: {
    color: "white",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 12,
    marginRight: 8,
  },
  periodText: {
    color: "white",
    fontSize: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
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
  statsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statsValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  statsPercentage: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statsPercentageText: {
    fontSize: 10,
    color: "#4CAF50",
    marginLeft: 2,
  },
  statsDate: {
    fontSize: 10,
    color: "#999",
  },
})

