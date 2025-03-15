"use client"

import { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native"
import { LineChart, BarChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { Calendar, ArrowUp, ArrowDown } from "lucide-react-native"

const screenWidth = Dimensions.get("window").width

export default function AnalyticsScreen() {
  const [timeframe, setTimeframe] = useState("Monthly")
  const [activeTab, setActiveTab] = useState("Revenue")

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Analytics</Text>
        <TouchableOpacity style={styles.timeframeButton}>
          <Calendar size={16} color="#666" />
          <Text style={styles.timeframeText}>{timeframe}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Revenue" && styles.activeTab]}
          onPress={() => setActiveTab("Revenue")}
        >
          <Text style={[styles.tabText, activeTab === "Revenue" && styles.activeTabText]}>Revenue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Sales" && styles.activeTab]}
          onPress={() => setActiveTab("Sales")}
        >
          <Text style={[styles.tabText, activeTab === "Sales" && styles.activeTabText]}>Sales</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Products" && styles.activeTab]}
          onPress={() => setActiveTab("Products")}
        >
          <Text style={[styles.tabText, activeTab === "Products" && styles.activeTabText]}>Products</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "Clients" && styles.activeTab]}
          onPress={() => setActiveTab("Clients")}
        >
          <Text style={[styles.tabText, activeTab === "Clients" && styles.activeTabText]}>Clients</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartCard}>
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

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Total Revenue</Text>
            <Text style={styles.statsValue}>$45,237</Text>
            <View style={styles.statsChange}>
              <ArrowUp size={12} color="#4CAF50" />
              <Text style={styles.statsChangeText}>+15% vs last period</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Average Order</Text>
            <Text style={styles.statsValue}>$128</Text>
            <View style={styles.statsChange}>
              <ArrowUp size={12} color="#4CAF50" />
              <Text style={styles.statsChangeText}>+3% vs last period</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Conversion Rate</Text>
            <Text style={styles.statsValue}>24.8%</Text>
            <View style={[styles.statsChange, styles.statsChangeNegative]}>
              <ArrowDown size={12} color="#F44336" />
              <Text style={styles.statsChangeTextNegative}>-2% vs last period</Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Active Clients</Text>
            <Text style={styles.statsValue}>18</Text>
            <View style={styles.statsChange}>
              <ArrowUp size={12} color="#4CAF50" />
              <Text style={styles.statsChangeText}>+4 vs last period</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Sales by Category</Text>
        <BarChart
          data={{
            labels: ["Food", "Drink", "Snack", "Dessert"],
            datasets: [
              {
                data: [45, 28, 17, 10],
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
            barPercentage: 0.7,
            propsForBackgroundLines: {
              strokeDasharray: "",
              stroke: "#F5F5F5",
            },
          }}
          style={styles.chart}
          withInnerLines={false}
          withOuterLines={false}
          showBarTops={false}
          fromZero={true}
        />
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  timeframeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  timeframeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 8,
    marginBottom: 15,
    padding: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#F47B20",
    borderRadius: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#666",
  },
  activeTabText: {
    color: "white",
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
  statsLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
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
})

