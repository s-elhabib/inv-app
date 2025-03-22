import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, FlatList, TextInput } from "react-native"
import { LineChart, PieChart } from "react-native-chart-kit"
import { Dimensions } from "react-native"
import { ArrowUp, ArrowDown, Users, ShoppingBag, DollarSign, TrendingUp, ChevronDown, X, Search, Edit2, Package, Eye, EyeOff } from "lucide-react-native"
import { useState, useEffect, useCallback, useMemo } from "react" // Combined useMemo here
import { supabase } from "../../lib/supabase"
import { useFocusEffect } from "@react-navigation/native"
import { useNavigation } from '@react-navigation/native';

const screenWidth = Dimensions.get("window").width

const DashboardSection = ({ children, onError }) => {
  try {
    return children;
  } catch (error) {
    console.error('Dashboard section error:', error);
    onError(error);
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load section</Text>
      </View>
    );
  }
};

export default function DashboardScreen() {
  const navigation = useNavigation();
  
  const handleOrdersPress = () => {
    console.log('Orders card pressed');
    try {
      navigation.navigate('OrdersList');
      console.log('Navigation to OrdersList attempted');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const [loading, setLoading] = useState(true)
  const [loadingStates, setLoadingStates] = useState({
    revenue: true,
    inventory: true,
    clients: true,
    orders: true
  });
  const [dashboardData, setDashboardData] = useState({
    clientCount: 0,
    productCount: 0,
    totalRevenue: 0,
    totalSales: 0,
    clientGrowth: 0,
    productGrowth: 0,
    revenueGrowth: 0,
    salesGrowth: 0,
    monthlyRevenue: [0, 0, 0, 0, 0, 0],
    monthlyRevenueLabels: [],
    categorySales: [],
    topClients: [],
    totalInventoryValue: 0,
    totalProfit: 0,
    profitGrowth: 0,
    monthlyProfit: [0, 0, 0, 0, 0, 0],
    totalOrders: 0,
    ordersGrowth: 0,
    monthlyOrders: [0, 0, 0, 0, 0, 0],
  })

  // Add these new state variables
  const [selectedClient, setSelectedClient] = useState(null)
  const [showClientSelector, setShowClientSelector] = useState(false)
  const [clientList, setClientList] = useState([])
  const [clientOrders, setClientOrders] = useState([])
  const [loadingClientData, setLoadingClientData] = useState(false)
  const [profitFilter, setProfitFilter] = useState('day'); // 'day', 'week', '15days', 'month'
  const [showProfit, setShowProfit] = useState(false);
  const [salesData, setSalesData] = useState([]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      fetchClients(); // Add this line
    }, [])
  )

  // Add this function to fetch clients
  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      setClientList(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  // Add this function to fetch client orders
  const fetchClientOrders = async (clientId) => {
    if (!clientId) return;
    
    setLoadingClientData(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          sales(
            id,
            quantity,
            amount,
            products:product_id(id, name, sellingPrice)
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClientOrders(data || []);
    } catch (error) {
      console.error('Error fetching client orders:', error);
    } finally {
      setLoadingClientData(false);
    }
  };

  // Add this effect to fetch orders when client changes
  useEffect(() => {
    if (selectedClient) {
      fetchClientOrders(selectedClient.id);
    }
  }, [selectedClient]);

  useEffect(() => {
    // Subscribe to changes in the products table
    const subscription = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
          filter: 'price,stock,sellingPrice'
        },
        (payload) => {
          // Only update specific parts of the dashboard
          if (payload.new.price !== payload.old.price || 
              payload.new.stock !== payload.old.stock || 
              payload.new.sellingPrice !== payload.old.sellingPrice) {
            fetchDashboardData();
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Combine multiple queries into a single parallel request
      const [
        { data: clients, error: clientError },
        { data: products, error: productError },
        { data: sales, error: salesError },
        { data: orders, error: ordersError }
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('id, created_at'),
        
        supabase
          .from('products')
          .select('id, category_id, price, "sellingPrice", created_at, stock'),
        
        supabase
          .from('sales')
          .select(`
            id, 
            amount,
            quantity,
            created_at,
            client_id,
            products (
              price,
              "sellingPrice"
            )
          `),
        
        supabase
          .from('orders')
          .select('id, created_at, total_amount, status')
          .eq('status', 'completed')
      ]);

      if (clientError) throw clientError;
      if (productError) throw productError;
      if (salesError) throw salesError;
      if (ordersError) throw ordersError;

      // Process data in memory instead of making additional queries
      const processedData = {
        clientCount: clients?.length || 0,
        productCount: products?.length || 0,
        totalRevenue: calculateTotalRevenue(sales),
        totalSales: orders?.length || 0,
        clientGrowth: calculateGrowth(clients || [], 'created_at'),
        productGrowth: calculateGrowth(products || [], 'created_at'),
        monthlyRevenue: calculateMonthlyRevenue(sales || []),
        categorySales: calculateCategorySales(sales || [], products || []),
        topClients: calculateTopClients(sales || []),
        totalInventoryValue: calculateInventoryValue(products || []),
        totalProfit: calculateTotalProfit(sales || []),
        profitGrowth: calculateProfitGrowth(sales || []),
        ordersGrowth: calculateGrowth(orders || [], 'created_at'),
        monthlyOrders: calculateMonthlyOrders(orders || [])
      };

      setSalesData(sales || []);
      setDashboardData(processedData);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to process data
  const calculateTotalRevenue = (sales) => {
    return sales?.reduce((sum, sale) => sum + (parseFloat(sale.amount) || 0), 0) || 0;
  };

  const calculateInventoryValue = (products) => {
    return products?.reduce((sum, product) => 
      sum + (product.price * product.stock), 0) || 0;
  };

  const calculateTopClients = (sales) => {
    const clientRevenue = {};
    sales?.forEach(sale => {
      if (sale.client_id) {
        if (!clientRevenue[sale.client_id]) {
          clientRevenue[sale.client_id] = { id: sale.client_id, total: 0 };
        }
        clientRevenue[sale.client_id].total += parseFloat(sale.amount) || 0;
      }
    });
    
    return Object.values(clientRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  };

  const calculateMonthlyRevenue = (sales) => {
    const months = Array(6).fill(0)
    const now = new Date()
    
    const monthNames = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(now.getMonth() - i)
      monthNames.push(d.toLocaleString('default', { month: 'short' }))
    }
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.created_at)
      const monthDiff = (now.getMonth() - saleDate.getMonth()) + 
                       (now.getFullYear() - saleDate.getFullYear()) * 12
      
      if (monthDiff >= 0 && monthDiff < 6) {
        const amount = parseFloat(sale.amount) || 0
        months[5 - monthDiff] += amount
      }
    })
    
    return { data: months, labels: monthNames }
  }

  const calculateCategorySales = (sales, products) => {
    const categories = {
      "Food": { population: 0, color: "#F47B20" },
      "Drink": { population: 0, color: "#2196F3" },
      "Snack": { population: 0, color: "#4CAF50" },
      "Dessert": { population: 0, color: "#9C27B0" }
    }
    
    // Create a map of product_id to category_id
    const productCategories = {}
    products.forEach(product => {
      productCategories[product.id] = product.category_id
    })
    
    // Count sales by category
    sales.forEach(sale => {
      const categoryId = productCategories[sale.product_id]
      const categoryName = getCategoryName(categoryId)
      if (categories[categoryName]) {
        categories[categoryName].population += 1
      }
    })
    
    // Convert to array format needed for PieChart
    return Object.entries(categories).map(([name, data]) => ({
      name,
      population: data.population || 1, // Ensure at least 1 for display
      color: data.color,
      legendFontColor: "#7F7F7F",
      legendFontSize: 12
    }))
  }

  const getCategoryName = (categoryId) => {
    // Map category IDs to names - replace with actual mapping from your database
    const categoryMap = {
      1: "Food",
      2: "Drink",
      3: "Snack",
      4: "Dessert"
    }
    return categoryMap[categoryId] || "Food"
  }

  const calculateGrowth = (items, dateField) => {
    if (!items.length) return 0
    
    const now = new Date()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(now.getMonth() - 1)
    const twoMonthsAgo = new Date()
    twoMonthsAgo.setMonth(now.getMonth() - 2)
    
    const currentPeriodItems = items.filter(item => {
      const date = new Date(item[dateField])
      return date >= oneMonthAgo && date <= now
    })
    
    const previousPeriodItems = items.filter(item => {
      const date = new Date(item[dateField])
      return date >= twoMonthsAgo && date < oneMonthAgo
    })
    
    if (previousPeriodItems.length === 0) return currentPeriodItems.length > 0 ? 100 : 0
    
    return Math.round(((currentPeriodItems.length - previousPeriodItems.length) / previousPeriodItems.length) * 100)
  }

  const calculateSalesGrowth = (sales) => {
    try {
      const now = new Date();
      const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

      // Filter sales for current and previous month
      const currentMonthSales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= oneMonthAgo && saleDate <= now;
      });

      const previousMonthSales = sales.filter(sale => {
        const saleDate = new Date(sale.created_at);
        return saleDate >= twoMonthsAgo && saleDate < oneMonthAgo;
      });

      // Calculate total sales for each period
      const currentTotal = currentMonthSales.length;
      const previousTotal = previousMonthSales.length;

      // Calculate growth percentage
      if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;
      
      const growth = ((currentTotal - previousTotal) / previousTotal) * 100;
      return Math.round(growth);
    } catch (error) {
      console.error("Error calculating sales growth:", error);
      return 0;
    }
  };

  const formatCurrency = (amount) => {
    const value = parseFloat(amount)
    if (value >= 1000) {
      return `${(value / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}k MAD`
    } else {
      return `${value.toLocaleString('en-US', { maximumFractionDigits: 2 })} MAD`
    }
  }

  // Add this helper function to filter profits by date range
  const getFilteredProfit = (sales, filter) => {
    const now = new Date();
    const startDate = new Date();
    
    switch (filter) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case '15days':
        startDate.setDate(now.getDate() - 15);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate.setHours(0, 0, 0, 0);
    }

    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate >= startDate && saleDate <= now;
    });

    const totalProfit = filteredSales.reduce((sum, sale) => {
      const costPrice = parseFloat(sale.products?.price || '0');
      const sellingPrice = parseFloat(sale.products?.sellingPrice || '0');
      const quantity = parseInt(sale.quantity || '1');
      const profitPerUnit = sellingPrice - costPrice;
      return sum + (profitPerUnit * quantity);
    }, 0);

    return totalProfit;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#F47B20" />
        <Text style={styles.loadingText}>Loading dashboard data...</Text>
      </View>
    )
  }

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Admin Dashboard</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <Users size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{dashboardData.clientCount}</Text>
            <Text style={styles.statsLabel}>Total Clients</Text>
            <View style={[
              styles.statsChange,
              dashboardData.clientGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {dashboardData.clientGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={dashboardData.clientGrowth >= 0 ? 
                styles.statsChangeText : 
                styles.statsChangeTextNegative
              }>
                {dashboardData.clientGrowth >= 0 ? '+' : ''}{dashboardData.clientGrowth}%
              </Text>
            </View>
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <ShoppingBag size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{dashboardData.productCount}</Text>
            <Text style={styles.statsLabel}>Total Products</Text>
            <View style={[
              styles.statsChange,
              dashboardData.productGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {dashboardData.productGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={dashboardData.productGrowth >= 0 ? 
                styles.statsChangeText : 
                styles.statsChangeTextNegative
              }>
                {dashboardData.productGrowth >= 0 ? '+' : ''}{dashboardData.productGrowth}%
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statsCard}>
            <View style={styles.statsIconContainer}>
              <DollarSign size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{formatCurrency(dashboardData.totalRevenue)}</Text>
            <Text style={styles.statsLabel}>Total Revenue</Text>
            <View style={[
              styles.statsChange,
              dashboardData.revenueGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {dashboardData.revenueGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={dashboardData.revenueGrowth >= 0 ? 
                styles.statsChangeText : 
                styles.statsChangeTextNegative
              }>
                {dashboardData.revenueGrowth >= 0 ? '+' : ''}{dashboardData.revenueGrowth}%
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.statsCard}
            onPress={handleOrdersPress}
            activeOpacity={0.7}
          >
            <View style={styles.statsIconContainer}>
              <TrendingUp size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{dashboardData.totalSales}</Text>
            <Text style={styles.statsLabel}>Total Orders</Text>
            <View style={[
              styles.statsChange,
              dashboardData.salesGrowth < 0 ? styles.statsChangeNegative : null
            ]}>
              {dashboardData.salesGrowth >= 0 ? 
                <ArrowUp size={12} color="#4CAF50" /> : 
                <ArrowDown size={12} color="#F44336" />
              }
              <Text style={dashboardData.salesGrowth >= 0 ? 
                styles.statsChangeText : 
                styles.statsChangeTextNegative
              }>
                {dashboardData.salesGrowth >= 0 ? '+' : ''}{dashboardData.salesGrowth}%
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statsCard, styles.fullWidthCard]}>
            <View style={styles.statsIconContainer}>
              <Package size={20} color="#F47B20" />
            </View>
            <Text style={styles.statsValue}>{formatCurrency(dashboardData.totalInventoryValue)}</Text>
            <Text style={styles.statsLabel}>Total Inventory Value</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statsCard, styles.fullWidthCard]}>
            <View style={styles.statsHeader}>
              <View style={styles.statsIconContainer}>
                <TrendingUp size={20} color="#F47B20" />
              </View>
              <TouchableOpacity 
                onPress={() => setShowProfit(!showProfit)}
                style={styles.eyeIcon}
              >
                {showProfit ? <Eye size={20} color="#666" /> : <EyeOff size={20} color="#666" />}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.statsValue}>
              {showProfit 
                ? formatCurrency(getFilteredProfit(salesData, profitFilter))
                : '****'
              }
            </Text>
            <Text style={styles.statsLabel}>Total Profit</Text>
            
            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[styles.filterButton, profitFilter === 'day' && styles.filterButtonActive]}
                  onPress={() => setProfitFilter('day')}
                >
                  <Text style={[styles.filterText, profitFilter === 'day' && styles.filterTextActive]}>
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, profitFilter === 'week' && styles.filterButtonActive]}
                  onPress={() => setProfitFilter('week')}
                >
                  <Text style={[styles.filterText, profitFilter === 'week' && styles.filterTextActive]}>
                    This Week
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, profitFilter === '15days' && styles.filterButtonActive]}
                  onPress={() => setProfitFilter('15days')}
                >
                  <Text style={[styles.filterText, profitFilter === '15days' && styles.filterTextActive]}>
                    15 Days
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterButton, profitFilter === 'month' && styles.filterButtonActive]}
                  onPress={() => setProfitFilter('month')}
                >
                  <Text style={[styles.filterText, profitFilter === 'month' && styles.filterTextActive]}>
                    This Month
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Revenue Overview</Text>
        <LineChart
          data={{
            labels: dashboardData.monthlyRevenueLabels || ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [
              {
                data: dashboardData.monthlyRevenue.length > 0 ? 
                  dashboardData.monthlyRevenue : 
                  [20, 45, 28, 80, 99, 43],
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
            data={dashboardData.categorySales.length > 0 ? 
              dashboardData.categorySales : 
              [
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
              ]
            }
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
            {dashboardData.topClients.length > 0 ? (
              dashboardData.topClients.map(client => (
                <View key={client.id} style={styles.clientItem}>
                  <Text style={styles.clientName}>{client.name}</Text>
                  <Text style={styles.clientValue}>{formatCurrency(client.total)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No client data available</Text>
            )}
          </View>
        </View>
      </View>

      {/* Add Client Order History Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Client Order History</Text>
        
        <TouchableOpacity 
          style={styles.clientSelector}
          onPress={() => setShowClientSelector(true)}
        >
          <Text style={styles.clientSelectorText}>
            {selectedClient ? selectedClient.name : 'Select a client'}
          </Text>
          <ChevronDown size={20} color="#666" />
        </TouchableOpacity>
        
        {selectedClient ? (
          loadingClientData ? (
            <ActivityIndicator size="large" color="#F47B20" style={styles.loader} />
          ) : clientOrders.length > 0 ? (
            <View style={styles.ordersList}>
              {clientOrders.map(order => (
                <View key={order.id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
                    <Text style={styles.orderAmount}>{formatCurrency(order.total_amount)}</Text>
                  </View>
                  
                  <View style={styles.orderProducts}>
                    {order.sales.map(sale => (
                      <View key={sale.id} style={styles.productItem}>
                        <Text style={styles.productName}>{sale.products.name}</Text>
                        <View style={styles.productDetails}>
                          <Text style={styles.productQuantity}>x{sale.quantity}</Text>
                          <Text style={styles.productPrice}>{formatCurrency(sale.amount)}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.orderFooter}>
                    <Text style={[
                      styles.orderStatus,
                      order.status === 'completed' ? styles.statusCompleted : styles.statusPending
                    ]}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No orders found for this client</Text>
          )
        ) : (
          <Text style={styles.emptyText}>Select a client to view their order history</Text>
        )}
      </View>
      
      {/* Client Selector Modal */}
      <Modal
        visible={showClientSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowClientSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Client</Text>
              <TouchableOpacity onPress={() => setShowClientSelector(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={clientList}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.clientItem}
                  onPress={() => {
                    setSelectedClient(item);
                    setShowClientSelector(false);
                  }}
                >
                  <Text style={styles.clientItemText}>{item.name}</Text>
                  {selectedClient && selectedClient.id === item.id && (
                    <ShoppingBag size={20} color="#F47B20" />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No clients found</Text>
              }
            />
          </View>
        </View>
      </Modal>
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
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    width: "48%",
    transform: [{ scale: 1 }],
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
  emptyText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    padding: 10,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  // New styles for client order history
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  clientSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  clientSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  ordersList: {
    marginTop: 8,
  },
  orderCard: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F47B20',
  },
  orderProducts: {
    padding: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productName: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  productDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productQuantity: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
    width: 70,
    textAlign: 'right',
  },
  orderFooter: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'flex-end',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#e6f7ed',
    color: '#4CAF50',
  },
  statusPending: {
    backgroundColor: '#fff8e6',
    color: '#FFC107',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 20,
  },
  loader: {
    marginVertical: 20,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  clientItemText: {
    fontSize: 16,
    color: '#333',
  },
  fullWidthCard: {
    width: '100%', // Changed from flex: 1
    marginHorizontal: 0, // Remove horizontal margin if any
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  filterContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#F47B20',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#721c24',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

const calculateTotalProfit = (sales) => {
  return sales.reduce((sum, sale) => {
    const costPrice = parseFloat(sale.products?.price || '0');
    const sellingPrice = parseFloat(sale.products?.sellingPrice || '0');
    const quantity = parseInt(sale.quantity || '1');
    const profitPerUnit = sellingPrice - costPrice;
    return sum + (profitPerUnit * quantity);
  }, 0);
};

const calculateMonthlyProfit = (sales) => {
  const months = Array(6).fill(0);
  const now = new Date();
  
  const monthNames = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    monthNames.push(d.toLocaleString('default', { month: 'short' }));
  }
  
  sales.forEach(sale => {
    const saleDate = new Date(sale.created_at);
    const monthDiff = (now.getMonth() - saleDate.getMonth()) + 
                     (now.getFullYear() - saleDate.getFullYear()) * 12;
    
    if (monthDiff >= 0 && monthDiff < 6) {
      const costPrice = parseFloat(sale.products?.price || '0');
      const sellingPrice = parseFloat(sale.products?.sellingPrice || '0');
      const quantity = parseInt(sale.quantity || '1');
      const profitPerUnit = sellingPrice - costPrice;
      months[5 - monthDiff] += (profitPerUnit * quantity);
    }
  });
  
  return { data: months, labels: monthNames };
};

const calculateProfitGrowth = (sales) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth();
    const lastMonth = currentMonth - 1;
    
    const currentMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.getMonth() === currentMonth;
    });

    const lastMonthSales = sales.filter(sale => {
      const saleDate = new Date(sale.created_at);
      return saleDate.getMonth() === lastMonth;
    });

    const currentProfit = currentMonthSales.reduce((sum, sale) => {
      const costPrice = parseFloat(sale.products?.price || '0');
      const sellingPrice = parseFloat(sale.products?.sellingPrice || '0');
      const quantity = parseInt(sale.quantity || '1');
      return sum + ((sellingPrice - costPrice) * quantity);
    }, 0);

    const lastProfit = lastMonthSales.reduce((sum, sale) => {
      const costPrice = parseFloat(sale.products?.price || '0');
      const sellingPrice = parseFloat(sale.products?.sellingPrice || '0');
      const quantity = parseInt(sale.quantity || '1');
      return sum + ((sellingPrice - costPrice) * quantity);
    }, 0);

    if (lastProfit === 0) return currentProfit > 0 ? 100 : 0;
    return Math.round(((currentProfit - lastProfit) / lastProfit) * 100);
  } catch (error) {
    console.error("Error calculating profit growth:", error);
    return 0;
  }
};

const calculateMonthlyOrders = (orders) => {
  const months = Array(6).fill(0);
  const now = new Date();
  
  const monthNames = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(now.getMonth() - i);
    monthNames.push(d.toLocaleString('default', { month: 'short' }));
  }
  
  orders.forEach(order => {
    const orderDate = new Date(order.created_at);
    const monthDiff = (now.getMonth() - orderDate.getMonth()) + 
                     (now.getFullYear() - orderDate.getFullYear()) * 12;
    
    if (monthDiff >= 0 && monthDiff < 6) {
      months[5 - monthDiff] += 1;
    }
  });
  
  return { data: months, labels: monthNames };
};

const calculateOrdersGrowth = (orders) => {
  try {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());

    const currentMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= oneMonthAgo && orderDate <= now;
    });

    const previousMonthOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= twoMonthsAgo && orderDate < oneMonthAgo;
    });

    const currentCount = currentMonthOrders.length;
    const previousCount = previousMonthOrders.length;

    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    return Math.round(((currentCount - previousCount) / previousCount) * 100);
  } catch (error) {
    console.error("Error calculating orders growth:", error);
    return 0;
  }
};
