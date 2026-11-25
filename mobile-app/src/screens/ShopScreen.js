import React, { useEffect, useMemo, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Image,
    FlatList,
    ActivityIndicator,
    RefreshControl,
} from "react-native";

import { getProducts, getCategories } from "../services/storeService";
import colors from "../theme/colors";

const API_ROOT = process.env.EXPO_PUBLIC_API_URL?.replace(/\/api\/?$/, "");

function getProductImage(product) {
    const image = product.photo || product.image || product.image_url;

    if (!image) return null;
    if (image.startsWith("http")) return image;

    return `${API_ROOT}/storage/${image.replace(/^\/+/, "")}`;
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-UG", {
        style: "currency",
        currency: "UGX",
        maximumFractionDigits: 0,
    }).format(Number(price || 0));
}

function getDiscount(product) {
    const price = Number(product.price || 0);
    const original = Number(product.compare_at_price || 0);

    if (original <= price || original <= 0) return 0;

    return Math.round(((original - price) / original) * 100);
}

function getCategoryId(product) {
    return String(product.category?.id || product.category_id || "");
}

export default function ShopScreen({ navigation, route }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");

    const [selectedCategory, setSelectedCategory] = useState(
        String(route?.params?.categoryId || "all")
    );

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (route?.params?.categoryId) {
            setSelectedCategory(String(route.params.categoryId));
        }
    }, [route?.params?.categoryId]);

    async function loadData() {
        try {
            setError("");

            const [productData, categoryData] = await Promise.all([
                getProducts(),
                getCategories(),
            ]);

            setProducts(Array.isArray(productData) ? productData : []);
            setCategories(Array.isArray(categoryData) ? categoryData : []);

        } catch (err) {
            console.log(
                "Shop error:",
                err.response?.data || err.message
            );

            setError("Unable to load products. Check your connection.");

        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    const filteredProducts = useMemo(() => {
        const searchTerm = search.trim().toLowerCase();

        return products.filter((product) => {
            const matchesSearch =
                !searchTerm ||
                String(product.name || "").toLowerCase().includes(searchTerm) ||
                String(product.description || "").toLowerCase().includes(searchTerm) ||
                String(product.sku || "").toLowerCase().includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                getCategoryId(product) === selectedCategory;

            return matchesSearch && matchesCategory;
        });
    }, [products, search, selectedCategory]);

    function renderCategory({ item }) {
        const categoryId = String(item.id || item.category_id);
        const isSelected = selectedCategory === categoryId;

        return (
            <TouchableOpacity
                style={[
                    styles.categoryButton,
                    isSelected && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(categoryId)}
                activeOpacity={0.8}
            >
                <Text
                    style={[
                        styles.categoryText,
                        isSelected && styles.categoryTextActive,
                    ]}
                >
                    {item.name}
                </Text>
            </TouchableOpacity>
        );
    }

    function renderProduct({ item }) {
        const imageUrl = getProductImage(item);
        const inStock = Number(item.stock_quantity || 0) > 0;
        const discount = getDiscount(item);

        const description = String(
            item.description || ""
        ).trim();

        return (
            <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.85}
                onPress={() =>
                    navigation.navigate("ProductDetails", {
                        product: item,
                    })
                }
            >
                <View style={styles.imageContainer}>
                    {imageUrl ? (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.productImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <Text style={styles.placeholderText}>
                                MS
                            </Text>
                        </View>
                    )}

                    {discount > 0 && (
                        <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>
                                -{discount}%
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.productInfo}>
                    <Text
                        style={styles.productName}
                        numberOfLines={2}
                    >
                        {item.name}
                    </Text>

                    {!!description && (
                        <Text
                            style={styles.productDescription}
                            numberOfLines={2}
                        >
                            {description}
                        </Text>
                    )}

                    <Text style={styles.productPrice}>
                        {formatPrice(item.price)}
                    </Text>

                    {discount > 0 && (
                        <View style={styles.priceMeta}>
                            <Text style={styles.originalPrice}>
                                {formatPrice(item.compare_at_price)}
                            </Text>

                            <Text style={styles.savingsText}>
                                Save{" "}
                                {formatPrice(
                                    Number(item.compare_at_price) -
                                    Number(item.price)
                                )}
                            </Text>
                        </View>
                    )}

                    <Text
                        style={[
                            styles.stockText,
                            !inStock && styles.outOfStock,
                        ]}
                    >
                        {inStock
                            ? "● IN STOCK"
                            : "● OUT OF STOCK"}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    }

    const header = (
        <View>
            <View style={styles.header}>
                <View>
                    <Text style={styles.brand}>
                        MEGA STORE
                    </Text>

                    <Text style={styles.brandSub}>
                        COLLECTIONS
                    </Text>
                </View>

                <Text style={styles.headerLabel}>
                    SHOP
                </Text>
            </View>

            <Text style={styles.pageTitle}>
                EXPLORE
            </Text>

            <Text style={styles.pageSubtitle}>
                Find your next favourite style.
            </Text>

            <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>
                    ⌕
                </Text>

                <TextInput
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Search products..."
                    placeholderTextColor={colors.muted}
                    style={styles.searchInput}
                />

                {search.length > 0 && (
                    <TouchableOpacity
                        onPress={() => setSearch("")}
                    >
                        <Text style={styles.clearButton}>
                            ✕
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <Text
                style={[
                    styles.sectionTitle,
                    styles.categoryHeading,
                ]}
            >
                CATEGORIES
            </Text>

            <FlatList
                data={[
                    { id: "all", name: "ALL" },
                    ...categories,
                ]}
                horizontal
                renderItem={renderCategory}
                keyExtractor={(item, index) =>
                    String(
                        item.id ||
                        item.category_id ||
                        index
                    )
                }
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
            />

            <View style={styles.resultsHeader}>
                <Text style={styles.sectionTitle}>
                    {selectedCategory === "all"
                        ? "ALL PRODUCTS"
                        : "CATEGORY PRODUCTS"}
                </Text>

                <Text style={styles.resultsCount}>
                    {filteredProducts.length} PRODUCTS
                </Text>
            </View>

            {!!error && (
                <View style={styles.errorBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>

                    <TouchableOpacity onPress={loadData}>
                        <Text style={styles.retryText}>
                            TRY AGAIN
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={colors.primary}
                />

                <Text style={styles.loadingText}>
                    LOADING PRODUCTS...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                key="shop-grid"
                data={filteredProducts}
                renderItem={renderProduct}
                keyExtractor={(item, index) =>
                    String(
                        item.id ||
                        item.product_id ||
                        index
                    )
                }
                numColumns={2}
                columnWrapperStyle={styles.productRow}
                ListHeaderComponent={header}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>
                            ✦
                        </Text>

                        <Text style={styles.emptyTitle}>
                            NO PRODUCTS FOUND
                        </Text>

                        <Text style={styles.emptyDescription}>
                            Try another search or category.
                        </Text>
                    </View>
                }
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => {
                            setRefreshing(true);
                            loadData();
                        }}
                        tintColor={colors.primary}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    listContent: {
        paddingBottom: 25,
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 25,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    brand: {
        color: colors.white,
        fontSize: 25,
        fontWeight: "900",
        letterSpacing: 3,
    },

    brandSub: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 5,
    },

    headerLabel: {
        color: colors.primary,
        fontWeight: "900",
        letterSpacing: 2,
    },

    pageTitle: {
        color: colors.white,
        fontSize: 32,
        fontWeight: "900",
        marginHorizontal: 20,
    },

    pageSubtitle: {
        color: colors.muted,
        marginHorizontal: 20,
        marginTop: 5,
        fontSize: 13,
    },

    searchBox: {
        marginHorizontal: 20,
        marginTop: 22,
        height: 52,
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 15,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
    },

    searchIcon: {
        color: colors.primary,
        fontSize: 25,
        marginRight: 10,
    },

    searchInput: {
        flex: 1,
        color: colors.white,
        fontSize: 14,
    },

    clearButton: {
        color: colors.primary,
        fontSize: 18,
        padding: 5,
    },

    sectionTitle: {
        color: colors.white,
        fontSize: 15,
        fontWeight: "900",
        letterSpacing: 1,
    },

    categoryHeading: {
        marginHorizontal: 20,
        marginTop: 25,
    },

    categoryList: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
        gap: 10,
    },

    categoryButton: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 18,
        paddingVertical: 11,
        borderRadius: 25,
    },

    categoryButtonActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },

    categoryText: {
        color: colors.white,
        fontWeight: "800",
        fontSize: 11,
    },

    categoryTextActive: {
        color: colors.background,
    },

    resultsHeader: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    resultsCount: {
        color: colors.muted,
        fontSize: 10,
        fontWeight: "800",
    },

    productRow: {
        paddingHorizontal: 20,
        gap: 12,
        marginBottom: 15,
    },

    productCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: colors.border,
    },

    imageContainer: {
        position: "relative",
    },

    productImage: {
        width: "100%",
        height: 175,
        backgroundColor: colors.surfaceLight,
    },

    imagePlaceholder: {
        height: 175,
        backgroundColor: colors.surfaceLight,
        justifyContent: "center",
        alignItems: "center",
    },

    placeholderText: {
        color: colors.primary,
        fontSize: 35,
        fontWeight: "900",
    },

    discountBadge: {
        position: "absolute",
        top: 10,
        left: 10,
        backgroundColor: colors.primary,
        borderRadius: 6,
        paddingHorizontal: 9,
        paddingVertical: 6,
    },

    discountBadgeText: {
        color: colors.background,
        fontSize: 10,
        fontWeight: "900",
    },

    productInfo: {
        padding: 12,
    },

    productName: {
        color: colors.white,
        fontWeight: "800",
        fontSize: 12,
        minHeight: 34,
    },

    productDescription: {
        color: colors.muted,
        fontSize: 10,
        lineHeight: 15,
        marginTop: 5,
        minHeight: 30,
    },

    productPrice: {
        color: colors.primary,
        fontWeight: "900",
        fontSize: 14,
        marginTop: 9,
    },

    priceMeta: {
        flexDirection: "row",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        marginTop: 3,
    },

    originalPrice: {
        color: colors.muted,
        fontSize: 10,
        textDecorationLine: "line-through",
    },

    savingsText: {
        color: colors.primary,
        fontSize: 9,
        fontWeight: "800",
    },

    stockText: {
        color: colors.primary,
        fontSize: 9,
        fontWeight: "900",
        marginTop: 9,
    },

    outOfStock: {
        color: colors.danger,
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
    },

    loadingText: {
        color: colors.muted,
        fontSize: 11,
        fontWeight: "800",
        marginTop: 15,
    },

    emptyContainer: {
        padding: 40,
        alignItems: "center",
    },

    emptyIcon: {
        color: colors.primary,
        fontSize: 35,
    },

    emptyTitle: {
        color: colors.white,
        fontWeight: "900",
        marginTop: 15,
    },

    emptyDescription: {
        color: colors.muted,
        fontSize: 12,
        marginTop: 8,
        textAlign: "center",
    },

    errorBox: {
        margin: 20,
        padding: 15,
        backgroundColor: colors.surface,
        borderRadius: 10,
    },

    errorText: {
        color: colors.danger,
    },

    retryText: {
        color: colors.primary,
        fontWeight: "900",
        marginTop: 10,
    },
});