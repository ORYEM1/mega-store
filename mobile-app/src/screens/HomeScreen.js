import React, { useEffect, useMemo, useState } from "react";

import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    FlatList,
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

export default function HomeScreen({ navigation }) {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        loadStoreData();
    }, []);

    async function loadStoreData() {
        try {
            setLoading(true);
            setError("");

            const [productData, categoryData] = await Promise.all([
                getProducts(),
                getCategories(),
            ]);

            setProducts(Array.isArray(productData) ? productData : []);
            setCategories(Array.isArray(categoryData) ? categoryData : []);

        } catch (err) {
            console.log(
                "Store API error:",
                err.response?.data || err.message
            );

            setError(
                "Unable to load store data. Please check your connection."
            );

        } finally {
            setLoading(false);
        }
    }

    const searchedProducts = useMemo(() => {
        const term = search.trim().toLowerCase();

        if (!term) return products;

        return products.filter((product) =>
            `${product.name || ""} ${product.description || ""} ${product.sku || ""}`
                .toLowerCase()
                .includes(term)
        );
    }, [products, search]);

    function openProduct(item) {
        navigation.navigate("ProductDetails", {
            product: item,
        });
    }

    function openShop(categoryId) {
        navigation.navigate(
            "Shop",
            categoryId
                ? { categoryId: String(categoryId) }
                : undefined
        );
    }

    function renderProduct({ item }) {
        const imageUrl = getProductImage(item);
        const inStock = Number(item.stock_quantity || 0) > 0;
        const discount = getDiscount(item);

        return (
            <TouchableOpacity
                style={styles.productCard}
                activeOpacity={0.85}
                onPress={() => openProduct(item)}
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

                    {!!item.description && (
                        <Text
                            style={styles.productDescription}
                            numberOfLines={2}
                        >
                            {item.description}
                        </Text>
                    )}

                    <Text style={styles.productPrice}>
                        {formatPrice(item.price)}
                    </Text>

                    {discount > 0 && (
                        <Text style={styles.originalPrice}>
                            {formatPrice(item.compare_at_price)}
                        </Text>
                    )}

                    <Text
                        style={[
                            styles.productStock,
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

    return (
        <ScrollView
            style={styles.container}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
        >
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.brand}>
                        MEGA STORE
                    </Text>

                    <Text style={styles.brandSub}>
                        COLLECTIONS
                    </Text>
                </View>

                <TouchableOpacity
                    style={styles.cartButton}
                    onPress={() =>
                        navigation.navigate("MainTabs", {
                            screen: "Cart",
                        })
                    }
                >
                    <Text style={styles.cartIcon}>
                        🛍
                    </Text>
                </TouchableOpacity>
            </View>

            {/* HERO SECTION */}
            <View style={styles.hero}>
                <Text style={styles.heroSmall}>
                    WELCOME TO MEGA STORE COLLECTIONS
                </Text>

                <Text style={styles.heroTitle}>
                    YOUR STYLE.
                </Text>

                <Text style={styles.heroTitle}>
                    YOUR RULES.
                </Text>

                <Text style={styles.heroDescription}>
                    Discover the latest fashion and street culture.
                </Text>

                <TouchableOpacity
                    style={styles.shopButton}
                    onPress={() => openShop()}
                    activeOpacity={0.85}
                >
                    <Text style={styles.shopButtonText}>
                        SHOP NOW →
                    </Text>
                </TouchableOpacity>
            </View>

            {/* SEARCH */}
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
                    returnKeyType="search"
                />

                {!!search && (
                    <TouchableOpacity
                        onPress={() => setSearch("")}
                    >
                        <Text style={styles.clearButton}>
                            ✕
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* ERROR MESSAGE */}
            {!!error && (
                <View style={styles.messageBox}>
                    <Text style={styles.errorText}>
                        {error}
                    </Text>

                    <TouchableOpacity onPress={loadStoreData}>
                        <Text style={styles.retryText}>
                            TAP TO RETRY
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* CATEGORIES */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    CATEGORIES
                </Text>

                <TouchableOpacity
                    onPress={() => openShop()}
                >
                    <Text style={styles.seeAll}>
                        VIEW ALL →
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator
                    color={colors.primary}
                    size="large"
                    style={styles.loader}
                />
            ) : (
                <View style={styles.categoryGrid}>
                    {categories.map((category) => (
                        <TouchableOpacity
                            key={
                                category.id ||
                                category.category_id ||
                                category.name
                            }
                            style={styles.categoryCard}
                            onPress={() =>
                                openShop(
                                    category.id ||
                                    category.category_id
                                )
                            }
                            activeOpacity={0.8}
                        >
                            <Text
                                style={styles.categoryName}
                                numberOfLines={2}
                            >
                                {category.name}
                            </Text>

                            <Text style={styles.categoryArrow}>
                                →
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* LATEST PRODUCTS */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    {search
                        ? "SEARCH RESULTS"
                        : "LATEST PRODUCTS"}
                </Text>

                <TouchableOpacity
                    onPress={() => openShop()}
                >
                    <Text style={styles.seeAll}>
                        VIEW ALL →
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator
                    color={colors.primary}
                    size="large"
                    style={styles.loader}
                />
            ) : (
                <FlatList
                    data={searchedProducts.slice(0, 10)}
                    renderItem={renderProduct}
                    keyExtractor={(item, index) =>
                        String(
                            item.id ||
                            item.product_id ||
                            index
                        )
                    }
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.productList}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>
                            No matching products available.
                        </Text>
                    }
                />
            )}

            {/* FOOTER */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    MEGA STORE COLLECTIONS © 2026
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 55,
        paddingBottom: 20,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    brand: {
        color: colors.white,
        fontSize: 27,
        fontWeight: "900",
        letterSpacing: 3,
    },

    brandSub: {
        color: colors.primary,
        fontSize: 10,
        fontWeight: "800",
        letterSpacing: 5,
    },

    cartButton: {
        width: 45,
        height: 45,
        borderRadius: 12,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },

    cartIcon: {
        fontSize: 22,
    },

    hero: {
        margin: 20,
        padding: 25,
        backgroundColor: colors.surface,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
    },

    heroSmall: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "800",
        letterSpacing: 2,
        marginBottom: 15,
    },

    heroTitle: {
        color: colors.white,
        fontSize: 36,
        fontWeight: "900",
        lineHeight: 42,
    },

    heroDescription: {
        color: colors.muted,
        fontSize: 13,
        marginTop: 15,
        lineHeight: 20,
    },

    shopButton: {
        backgroundColor: colors.primary,
        padding: 15,
        borderRadius: 10,
        marginTop: 22,
        alignSelf: "flex-start",
    },

    shopButtonText: {
        color: colors.background,
        fontWeight: "900",
        fontSize: 13,
    },

    searchBox: {
        marginHorizontal: 20,
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 52,
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

    sectionHeader: {
        marginHorizontal: 20,
        marginTop: 30,
        marginBottom: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    sectionTitle: {
        color: colors.white,
        fontSize: 16,
        fontWeight: "900",
        letterSpacing: 1,
    },

    seeAll: {
        color: colors.primary,
        fontSize: 11,
        fontWeight: "800",
    },

    categoryGrid: {
        marginHorizontal: 20,
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },

    categoryCard: {
        width: "48%",
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    categoryName: {
        color: colors.white,
        fontWeight: "800",
        fontSize: 12,
        flex: 1,
        paddingRight: 8,
    },

    categoryArrow: {
        color: colors.primary,
        fontSize: 18,
    },

    loader: {
        marginVertical: 25,
    },

    productList: {
        paddingHorizontal: 20,
        gap: 14,
    },

    productCard: {
        width: 175,
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
        fontSize: 13,
        fontWeight: "800",
        minHeight: 36,
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
        fontSize: 14,
        fontWeight: "900",
        marginTop: 8,
    },

    originalPrice: {
        color: colors.muted,
        fontSize: 10,
        textDecorationLine: "line-through",
        marginTop: 3,
    },

    productStock: {
        color: colors.primary,
        fontSize: 9,
        marginTop: 7,
        fontWeight: "800",
    },

    outOfStock: {
        color: colors.danger,
    },

    messageBox: {
        margin: 20,
        padding: 15,
        backgroundColor: colors.surface,
        borderRadius: 10,
    },

    errorText: {
        color: colors.danger,
        fontSize: 13,
    },

    retryText: {
        color: colors.primary,
        fontWeight: "800",
        marginTop: 10,
    },

    emptyText: {
        color: colors.muted,
        padding: 20,
    },

    footer: {
        padding: 30,
        alignItems: "center",
    },

    footerText: {
        color: colors.muted,
        fontSize: 10,
        letterSpacing: 2,
    },
});