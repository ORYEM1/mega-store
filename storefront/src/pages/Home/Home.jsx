import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  FaArrowRight,
  FaLeaf,
  FaTruck,
  FaShieldAlt,
  FaHeart,
} from "react-icons/fa";

import {
  getCategories,
  getProducts,
  getBanners,
} from "../../services/api";

import Navbar from "../../components/Navbar/Navbar";
import ProductCard from "../../components/ProductCard/ProductCard";

import "./Home.css";

/* =====================================
   COLLECTION CONFIGURATION
===================================== */

const COLLECTIONS = {
  men: {
    name: "Men",
    title: "Living Earth Men",
    heroTitle: "Style That Feels Natural",

    heroDescription:
      "Discover timeless men's fashion, premium shirts, trousers and everyday essentials at Living Earth.",

    heroTagline: "Simple. Stylish. Timeless.",

    description:
      "Discover timeless men's fashion, premium shirts, trousers, shoes and everyday essentials at Living Earth.",

    slugs: [
      "men-shirt",
      "men-suite",
      "jeans",
      "shoes",
      "watches",
      "jacket",
      "head-wear",
      "under-wear",
    ],
  },

  ladies: {
    name: "Ladies",
    title: "Living Earth Ladies",
    heroTitle: "Elegance, Naturally",

    heroDescription:
      "Discover elegant dresses, beautiful suits and timeless ladies' fashion designed for every occasion.",

    heroTagline: "Elegant. Confident. Timeless.",

    description:
      "Explore elegant dresses, beautiful suits, kitenge and timeless ladies' fashion at Living Earth.",

    slugs: [
      "ladies-dress",
      "ladies-suite",
      
    ],
  },
};

/* =====================================
   PRODUCT CLASSIFICATIONS
===================================== */

const EXECUTIVE_CATEGORIES = [
  {
    value: "premium",
    label: "Premium",
  },
  {
    value: "luxury",
    label: "Luxury",
  },
  {
    value: "designer",
    label: "Designer",
  },
  {
    value: "exclusive",
    label: "Exclusive",
  },
];

/* =====================================
   COLLECTION BANNER CONFIGURATION
===================================== */

const COLLECTION_BANNER_TYPES = [
  {
    level: "affordable",
    eyebrow: "EVERYDAY STYLE",
    fallbackTitle: "Affordable Collection",
    fallbackDescription:
      "Stylish and comfortable outfits for your everyday life.",
    fallbackButton: "Shop Affordable",
  },
  {
    level: "executive",
    eyebrow: "REFINED STYLE",
    fallbackTitle: "Executive Collection",
    fallbackDescription:
      "Sophisticated designs for a distinguished look.",
    fallbackButton: "Shop Executive",
  },
];

/* =====================================
   HELPER FUNCTIONS
===================================== */

function getResponseData(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

/* =====================================
   NORMALIZE VALUES
===================================== */

function normalize(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

/* =====================================
   CHECK BOOLEAN VALUES
===================================== */

function isTrue(value) {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

/* =====================================
   FORMAT UGX PRICE
===================================== */

function formatPrice(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return `UGX ${new Intl.NumberFormat("en-UG", {
    maximumFractionDigits: 0,
  }).format(amount)}`;
}

/* =====================================
   GET BANNER PRICE RANGE
===================================== */

function getBannerPriceRange(banner) {
  const minimum = formatPrice(banner?.min_price);
  const maximum = formatPrice(banner?.max_price);

  if (minimum && maximum) {
    return `${minimum} – ${maximum}`;
  }

  if (minimum) {
    return `From ${minimum}`;
  }

  if (maximum) {
    return `Up to ${maximum}`;
  }

  return null;
}

/* =====================================
   FLATTEN NESTED CATEGORIES
===================================== */

function flattenCategories(categories) {
  const flattened = [];
  const visited = new Set();

  function addCategory(category) {
    if (!category || typeof category !== "object") {
      return;
    }

    const categoryId = Number(category.id);

    if (
      Number.isFinite(categoryId) &&
      visited.has(categoryId)
    ) {
      return;
    }

    if (Number.isFinite(categoryId)) {
      visited.add(categoryId);
    }

    flattened.push(category);

    if (Array.isArray(category.children)) {
      category.children.forEach(addCategory);
    }
  }

  categories.forEach(addCategory);

  return flattened;
}

/* =====================================
   BANNER COLLECTION TARGET
===================================== */

function getBannerCollection(banner) {
  return normalize(
    banner?.collection ||
      banner?.gender ||
      banner?.target_collection ||
      "all"
  );
}

/* =====================================
   CHECK BANNER COLLECTION
===================================== */

function bannerMatchesCollection(banner, collection) {
  const target = getBannerCollection(banner);

  if (
    !target ||
    target === "all" ||
    target === "both"
  ) {
    return true;
  }

  if (collection === "men") {
    return [
      "men",
      "male",
      "mens",
      "men's",
    ].includes(target);
  }

  if (collection === "ladies") {
    return [
      "ladies",
      "lady",
      "women",
      "female",
      "womens",
      "women's",
    ].includes(target);
  }

  return false;
}

/* =====================================
   HOME COMPONENT
===================================== */

function Home() {
  const [searchParams, setSearchParams] = useSearchParams();

  /* =====================================
     URL FILTERS
  ===================================== */

  const selectedCollection =
    searchParams.get("collection") === "ladies"
      ? "ladies"
      : "men";

  const selectedCollectionConfig =
    COLLECTIONS[selectedCollection];

  const selectedCategoryId =
    searchParams.get("category");

  const selectedProductLevel =
    searchParams.get("level") || "all";

  const selectedExecutiveCategory =
    searchParams.get("executive_category") || "";

  /* =====================================
     STATE
  ===================================== */

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================
     ENSURE COLLECTION EXISTS IN URL
  ===================================== */

  useEffect(() => {
    if (!searchParams.has("collection")) {
      const nextParams = new URLSearchParams(searchParams);

      nextParams.set("collection", "men");

      setSearchParams(nextParams, {
        replace: true,
      });
    }
  }, [searchParams, setSearchParams]);

  /* =====================================
     FETCH STORE DATA
  ===================================== */

  useEffect(() => {
    let isMounted = true;

    async function fetchStoreData() {
      setLoading(true);
      setError("");

      const [ productsResult, categoriesResult, bannersResult] = await Promise.allSettled([getProducts(),getCategories(),getBanners()]);

      if (!isMounted) return;

      if (productsResult.status === "fulfilled") {
        setProducts(
          getResponseData(productsResult.value)
        );
      } else {
        console.error(
          "Failed to load products:",
          productsResult.reason
        );

        setProducts([]);

        setError(
          "We could not load our collection. Please try again."
        );
      }

      if (categoriesResult.status === "fulfilled") {
        setCategories(
          getResponseData(categoriesResult.value)
        );
      } else {
        console.error(
          "Failed to load categories:",
          categoriesResult.reason
        );

        setCategories([]);
      }

      if (bannersResult.status === "fulfilled") {
        setBanners(
          getResponseData(bannersResult.value)
        );
      } else {
        console.error(
          "Failed to load banners:",
          bannersResult.reason
        );

        setBanners([]);
      }

      setLoading(false);
    }

    fetchStoreData();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =====================================
     FLATTEN CATEGORIES
  ===================================== */

  const allCategories = useMemo(() => {
    return flattenCategories(categories);
  }, [categories]);

  /* =====================================
     FILTER CATEGORIES BY COLLECTION
  ===================================== */

  const collectionCategories = useMemo(() => {
    const allowedSlugs =
      selectedCollectionConfig.slugs;

    return allCategories.filter((category) =>
      allowedSlugs.includes(normalize(category.slug))
    );
  }, [
    allCategories,
    selectedCollectionConfig,
  ]);

  /* =====================================
     CATEGORY SLUG LOOKUP
  ===================================== */

  const categorySlugsById = useMemo(() => {
    return new Map(
      allCategories.map((category) => [
        Number(category.id),
        normalize(category.slug),
      ])
    );
  }, [allCategories]);

  /* =====================================
     FILTER PRODUCTS BY COLLECTION
  ===================================== */

  const collectionProducts = useMemo(() => {
    const allowedSlugs =
      selectedCollectionConfig.slugs;

    return products.filter((product) => {
      const categoryId = Number(
        product.category?.id ??
          product.category_id
      );

      const productCategorySlug = normalize(
        product.category?.slug ||
          categorySlugsById.get(categoryId)
      );

      return allowedSlugs.includes(
        productCategorySlug
      );
    });
  }, [
    products,
    categorySlugsById,
    selectedCollectionConfig,
  ]);

  /* =====================================
     FILTER PRODUCTS BY CLASSIFICATION
  ===================================== */

  const classificationProducts = useMemo(() => {
    let result = [...collectionProducts];

    if (selectedProductLevel === "affordable") {
      result = result.filter(
        (product) =>
          normalize(
            product.product_level || "affordable"
          ) === "affordable"
      );
    }

    if (selectedProductLevel === "executive") {
      result = result.filter(
        (product) =>
          normalize(product.product_level) ===
          "executive"
      );

      if (selectedExecutiveCategory) {
        result = result.filter(
          (product) =>
            normalize(product.executive_category) ===
            normalize(selectedExecutiveCategory)
        );
      }
    }

    return result;
  }, [
    collectionProducts,
    selectedProductLevel,
    selectedExecutiveCategory,
  ]);

  /* =====================================
     REMOVE INVALID CATEGORY FILTER
  ===================================== */

  useEffect(() => {
    if (
      !selectedCategoryId ||
      categories.length === 0
    ) {
      return;
    }

    const categoryExists =
      collectionCategories.some(
        (category) =>
          Number(category.id) ===
          Number(selectedCategoryId)
      );

    if (!categoryExists) {
      const nextParams = new URLSearchParams(searchParams);

      nextParams.delete("category");

      setSearchParams(nextParams, {
        replace: true,
      });
    }
  }, [
    selectedCategoryId,
    collectionCategories,
    categories.length,
    searchParams,
    setSearchParams,
  ]);

  /* =====================================
     SELECTED CATEGORY
  ===================================== */

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) {
      return null;
    }

    return (
      collectionCategories.find(
        (category) =>
          Number(category.id) ===
          Number(selectedCategoryId)
      ) || null
    );
  }, [
    collectionCategories,
    selectedCategoryId,
  ]);

  /* =====================================
     SEO
  ===================================== */

  useEffect(() => {
    const siteName =
      selectedCollectionConfig.title;

    document.title = selectedCategory
      ? `${selectedCategory.name} | ${siteName}`
      : `${siteName} | Grounded in Nature`;

    const description = selectedCategory
      ? `Explore the ${selectedCategory.name} collection at ${siteName}.`
      : selectedCollectionConfig.description;

    let meta = document.querySelector(
      'meta[name="description"]'
    );

    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }

    meta.setAttribute("content", description);
  }, [
    selectedCategory,
    selectedCollectionConfig,
  ]);

  /* =====================================
     FILTER PRODUCTS
  ===================================== */

  const filteredProducts = useMemo(() => {
    let result = [...classificationProducts];

    if (selectedCategoryId && selectedCategory) {
      result = result.filter((product) => {
        const categoryId = Number(
          product.category?.id ??
            product.category_id
        );

        return (
          categoryId === Number(selectedCategoryId)
        );
      });
    }

    const searchTerm = normalize(search);

    if (searchTerm) {
      result = result.filter((product) => {
        const name = normalize(product.name);
        const description = normalize(product.description);
        const sku = normalize(product.sku);

        return (
          name.includes(searchTerm) ||
          description.includes(searchTerm) ||
          sku.includes(searchTerm)
        );
      });
    }

    return result;
  }, [
    classificationProducts,
    search,
    selectedCategoryId,
    selectedCategory,
  ]);

  /* =====================================
     FEATURED PRODUCTS
  ===================================== */

  const featuredProducts = useMemo(() => {
    const sorted = [...classificationProducts].sort(
      (a, b) => {
        const aScore =
          (isTrue(a.is_best_seller) ? 2 : 0) +
          (isTrue(a.is_featured) ? 1 : 0);

        const bScore =
          (isTrue(b.is_best_seller) ? 2 : 0) +
          (isTrue(b.is_featured) ? 1 : 0);

        return bScore - aScore;
      }
    );

    return sorted.slice(0, 5);
  }, [classificationProducts]);

  /* =====================================
     CATEGORY SECTIONS
  ===================================== */

  const categorySections = useMemo(() => {
    return collectionCategories
      .map((category) => {
        const categoryProducts =
          filteredProducts.filter((product) => {
            const categoryId = Number(
              product.category?.id ??
                product.category_id
            );

            return (
              categoryId === Number(category.id)
            );
          });

        return {
          ...category,
          products: categoryProducts,
        };
      })
      .filter(
        (category) =>
          category.products.length > 0
      );
  }, [
    collectionCategories,
    filteredProducts,
  ]);

  /* =====================================
     ACTIVE BANNERS
  ===================================== */

  const activeBanners = useMemo(() => {
    return banners
      .filter((banner) => {
        if (!isTrue(banner.is_active)) {
          return false;
        }

        return bannerMatchesCollection(
          banner,
          selectedCollection
        );
      })
      .sort((a, b) => {
        const aTarget = getBannerCollection(a);
        const bTarget = getBannerCollection(b);

        const aSpecific =
          aTarget === selectedCollection ? 1 : 0;

        const bSpecific =
          bTarget === selectedCollection ? 1 : 0;

        if (aSpecific !== bSpecific) {
          return bSpecific - aSpecific;
        }

        return (
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
        );
      });
  }, [
    banners,
    selectedCollection,
  ]);

  /* =====================================
     HERO BANNER
  ===================================== */

  const heroBanner = useMemo(() => {
    const heroBanners = activeBanners.filter(
      (banner) =>
        normalize(banner.position) === "hero"
    );

    const collectionBanner = heroBanners.find(
      (banner) =>
        getBannerCollection(banner) ===
        selectedCollection
    );

    if (collectionBanner) {
      return collectionBanner;
    }

    return (
      heroBanners.find((banner) => {
        const collection =
          getBannerCollection(banner);

        return (
          !collection ||
          collection === "all" ||
          collection === "both"
        );
      }) || null
    );
  }, [
    activeBanners,
    selectedCollection,
  ]);

  /* =====================================
     AFFORDABLE & EXECUTIVE BANNERS

     Each product level has its own banner.
  ===================================== */

  const collectionBanners = useMemo(() => {
    const promotionalBanners = activeBanners.filter(
      (banner) =>
        normalize(banner.position) === "promo"
    );

    return COLLECTION_BANNER_TYPES.map((config) => {
      const banner = promotionalBanners.find(
        (item) =>
          normalize(item.product_level) ===
          config.level
      );

      return {
        ...config,
        banner: banner || null,
      };
    });
  }, [activeBanners]);

  /* =====================================
     BANNER IMAGE HELPERS
  ===================================== */

  const getBannerImage = (banner) => {
    return (
      banner?.image_url ||
      banner?.image ||
      ""
    );
  };

  const getMobileBannerImage = (banner) => {
    return (
      banner?.mobile_image_url ||
      banner?.mobile_image ||
      getBannerImage(banner)
    );
  };

  /* =====================================
     SCROLL HELPERS
  ===================================== */

  const scrollToProducts = () => {
    document
      .getElementById("products")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =====================================
     CLEAR CATEGORY FILTER
  ===================================== */

  const clearCategoryFilter = () => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete("category");

    setSearchParams(nextParams);

    setSearch("");

    scrollToTop();
  };

  /* =====================================
     BANNER BUTTON
     Used by hero banner.
  ===================================== */

  const renderBannerButton = (
    banner,
    className
  ) => {
    if (!banner?.button_text) {
      return null;
    }

    const link = banner.button_link || "#products";

    return (
      <a
        href={link}
        className={className}
        target={
          link.startsWith("http")
            ? "_blank"
            : undefined
        }
        rel={
          link.startsWith("http")
            ? "noopener noreferrer"
            : undefined
        }
      >
        {banner.button_text}
        <FaArrowRight />
      </a>
    );
  };

  /* =====================================
     CATEGORY NAVIGATION
  ===================================== */

  const selectCategory = (categoryId) => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("collection", selectedCollection);
    nextParams.set("category", String(categoryId));

    setSearchParams(nextParams);

    setSearch("");

    scrollToProducts();
  };

  /* =====================================
     PRODUCT CLASSIFICATION NAVIGATION
  ===================================== */

  const selectProductLevel = (
    level,
    executiveCategory = ""
  ) => {
    const nextParams = new URLSearchParams(searchParams);

    nextParams.set("collection", selectedCollection);

    if (level === "all") {
      nextParams.delete("level");
    } else {
      nextParams.set("level", level);
    }

    nextParams.delete("category");
    nextParams.delete("executive_category");

    if (
      level === "executive" &&
      executiveCategory
    ) {
      nextParams.set(
        "executive_category",
        executiveCategory
      );
    }

    setSearchParams(nextParams);

    setSearch("");

    scrollToProducts();
  };

  /* =====================================
     COLLECTION BANNER BUTTON
     Automatically filters products.
  ===================================== */

  const renderCollectionBannerButton = (
    banner,
    config
  ) => {
    const buttonText =
      banner?.button_text || config.fallbackButton;

    const link = banner?.button_link || "";

    // Preserve explicitly configured external links.
    if (link.startsWith("http://") || link.startsWith("https://")) {
      return (
        <a
          href={link}
          className="earth-button earth-button-small"
          target="_blank"
          rel="noopener noreferrer"
        >
          {buttonText}
          <FaArrowRight />
        </a>
      );
    }

    return (
      <button
        type="button"
        className="earth-button earth-button-small"
        onClick={() =>
          selectProductLevel(config.level)
        }
      >
        {buttonText}
        <FaArrowRight />
      </button>
    );
  };

  /* =====================================
     EXECUTIVE CATEGORY LABEL
  ===================================== */

  const selectedExecutiveCategoryLabel =
    EXECUTIVE_CATEGORIES.find(
      (category) =>
        category.value === selectedExecutiveCategory
    )?.label;

  /* =====================================
     RENDER
  ===================================== */

  return (
    <div className="store living-earth">

      {/* =====================================
          ANNOUNCEMENT BAR
      ===================================== */}

      <div className="earth-announcement">

        <div className="earth-announcement-inner">

         <div>
            <span>Grounded in Nature</span>
            <i></i>
            <span>Timeless Style</span>
            <i></i>
            <span>Made for You</span>
          </div>

          <div className="earth-social-top">
            <span>f</span>
            <span>◎</span>
            <span>♪</span>
            <span>▶</span>
          </div>

        </div>

      </div>

      {/* =====================================
          NAVIGATION
      ===================================== */}

      <Navbar
        categories={collectionCategories}
        search={search}
        setSearch={setSearch}
      />

      <main>

        {/* =====================================
            HERO SECTION
        ===================================== */}

        <section className="earth-hero">

          <div className="earth-hero-inner">

            <div className="earth-hero-content">

              <span className="earth-eyebrow">
                {selectedCollectionConfig.title.toUpperCase()}
              </span>

              <h1>
                {heroBanner?.title ||
                  selectedCollectionConfig.heroTitle}
              </h1>

              <p>
                {heroBanner?.subtitle ||
                  selectedCollectionConfig.heroDescription}
              </p>

              {heroBanner?.button_text ? (
                renderBannerButton(
                  heroBanner,
                  "earth-button"
                )
              ) : (
                <button
                  type="button"
                  className="earth-button"
                  onClick={scrollToProducts}
                >
                  Explore {selectedCollectionConfig.name}
                  <FaArrowRight />
                </button>
              )}

              <div className="earth-hero-tagline">
                <FaLeaf />

                <span>
                  {selectedCollectionConfig.heroTagline}
                </span>
              </div>

            </div>

            {heroBanner && getBannerImage(heroBanner) ? (

              <picture className="earth-hero-image">

                <source
                  media="(max-width: 768px)"
                  srcSet={getMobileBannerImage(heroBanner)}
                />

                <img
                  src={getBannerImage(heroBanner)}
                  alt={
                    heroBanner.title ||
                    selectedCollectionConfig.title
                  }
                  fetchPriority="high"
                />

              </picture>

            ) : (

              <div className="earth-hero-image earth-hero-image-placeholder">

                <div>
                  <FaLeaf />
                  <span>Living Earth</span>
                </div>

              </div>

            )}

          </div>

        </section>

        {/* =====================================
            AFFORDABLE & EXECUTIVE COLLECTIONS
        ===================================== */}

        <section className="earth-collections">

          <div className="earth-collection-grid">

            {collectionBanners.map((config) => {
              const banner = config.banner;

              const image = getBannerImage(banner);

              const mobileImage =
                getMobileBannerImage(banner);

              const title =
                banner?.title || config.fallbackTitle;

              const description =
                banner?.subtitle ||
                config.fallbackDescription;

              const priceRange =
                getBannerPriceRange(banner);

              return (

                <article
                  className={`earth-collection-card earth-${config.level}-banner`}
                  key={config.level}
                >

                  {image ? (

                    <picture>

                      <source
                        media="(max-width: 600px)"
                        srcSet={mobileImage}
                      />

                      <img
                        src={image}
                        alt={title}
                        loading="lazy"
                      />

                    </picture>

                  ) : (

                    <div className="earth-collection-placeholder">
                      <FaLeaf />
                    </div>

                  )}

                  <div className="earth-collection-content">

                    <span className="earth-collection-eyebrow">
                      {config.eyebrow}
                    </span>

                    <h2>
                      {title}
                    </h2>

                    <p>
                      {description}
                    </p>

                    {priceRange && (
                      <div className="earth-collection-price">
                        {priceRange}
                      </div>
                    )}

                    {renderCollectionBannerButton(
                      banner,
                      config
                    )}

                  </div>

                </article>

              );
            })}

          </div>

        </section>

        {/* =====================================
            BEST SELLERS
        ===================================== */}

        {!selectedCategoryId && !search.trim() && (

          <section className="earth-best-sellers">

            <div className="earth-section-title">

              <span></span>

              <h2>
                {selectedProductLevel === "affordable"
                  ? "Affordable Best Sellers"
                  : selectedProductLevel === "executive"
                    ? "Executive Best Sellers"
                    : selectedCollection === "ladies"
                      ? "Ladies Best Sellers"
                      : "Men's Best Sellers"}
              </h2>

              <span></span>

            </div>

            {loading ? (

              <div className="earth-loading">
                Loading our collection...
              </div>

            ) : (

              <div className="earth-best-grid">

                {featuredProducts.map((product) => (

                  <ProductCard
                    key={product.id}
                    product={product}
                  />

                ))}

              </div>

            )}

            <button
              type="button"
              className="earth-text-button"
              onClick={scrollToProducts}
            >
              Explore All Products
              <FaArrowRight />
            </button>

          </section>

        )}

        {/* =====================================
            SHOPPING BENEFITS
        ===================================== */}

        <section className="earth-benefits">

          <div className="earth-benefit">
            <FaLeaf />

            <div>
              <strong>Quality Fabrics</strong>
              <span>Comfort & Style</span>
            </div>
          </div>

          <div className="earth-benefit">
            <FaTruck />

            <div>
              <strong>Fast & Reliable</strong>
              <span>Delivery</span>
            </div>
          </div>

          <div className="earth-benefit">
            <FaShieldAlt />

            <div>
              <strong>Secure</strong>
              <span>Payments</span>
            </div>
          </div>

          <div className="earth-benefit">
            <FaHeart />

            <div>
              <strong>Made for You</strong>
              <span>Timeless Designs</span>
            </div>
          </div>

        </section>

        {/* =====================================
            ALL PRODUCTS
        ===================================== */}

        <section
          className="earth-products"
          id="products"
        >

          <div className="earth-section-title">

            <span></span>

            <h2>
              {search.trim()
                ? "Search Results"
                : selectedCategory
                  ? `${selectedCategory.name} Collection`
                  : selectedProductLevel === "affordable"
                    ? "Affordable Collection"
                    : selectedProductLevel === "executive"
                      ? selectedExecutiveCategoryLabel
                        ? `${selectedExecutiveCategoryLabel} Collection`
                        : "Executive Collection"
                      : selectedCollection === "ladies"
                        ? "Explore Ladies' Collections"
                        : "Explore Men's Collections"}
            </h2>

            <span></span>

          </div>

          {/* ACTIVE CATEGORY FILTER */}

          {selectedCategoryId && (

            <div className="earth-active-filter">

              <span>
                {selectedCategory?.name || "Selected category"}
              </span>

              <button
                type="button"
                onClick={clearCategoryFilter}
              >
                View All Products
              </button>

            </div>

          )}

          {/* PRODUCT CLASSIFICATIONS */}

          {!search.trim() && (

            <div className="earth-classification-wrapper">

              <div className="earth-classification-heading">

                <span>SHOP BY STYLE</span>

                <h3>Find Your Collection</h3>

                <p>
                  Discover everyday essentials or explore
                  our refined executive collections.
                </p>

              </div>

              <div className="earth-classification-tabs">

                <button
                  type="button"
                  className={
                    selectedProductLevel === "all"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    selectProductLevel("all")
                  }
                >
                  All Products
                </button>

                <button
                  type="button"
                  className={
                    selectedProductLevel === "affordable"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    selectProductLevel("affordable")
                  }
                >
                  Affordable
                </button>

                <button
                  type="button"
                  className={
                    selectedProductLevel === "executive"
                      ? "active"
                      : ""
                  }
                  onClick={() =>
                    selectProductLevel("executive")
                  }
                >
                  Executive
                </button>

              </div>

              {/* EXECUTIVE SUBCATEGORIES */}

              {selectedProductLevel === "executive" && (

                <div className="earth-executive-categories">

                  <button
                    type="button"
                    className={
                      !selectedExecutiveCategory
                        ? "active"
                        : ""
                    }
                    onClick={() =>
                      selectProductLevel("executive")
                    }
                  >
                    All Executive
                  </button>

                  {EXECUTIVE_CATEGORIES.map((category) => (

                    <button
                      type="button"
                      key={category.value}
                      className={
                        selectedExecutiveCategory ===
                        category.value
                          ? "active"
                          : ""
                      }
                      onClick={() =>
                        selectProductLevel(
                          "executive",
                          category.value
                        )
                      }
                    >
                      {category.label}
                    </button>

                  ))}

                </div>

              )}

            </div>

          )}

          {/* CATEGORY FILTER LINKS */}

          {!selectedCategoryId && !search.trim() && (

            <div className="earth-category-links">

              {collectionCategories.map((category) => (

                <button
                  type="button"
                  key={category.id}
                  onClick={() =>
                    selectCategory(category.id)
                  }
                >
                  {category.name}
                </button>

              ))}

            </div>

          )}

          {/* PRODUCT RESULTS */}

          {loading ? (

            <div className="earth-loading">
              Loading our collection...
            </div>

          ) : error ? (

            <div className="earth-message">

              <h3>Unable to load products</h3>

              <p>{error}</p>

              <button
                type="button"
                onClick={() =>
                  window.location.reload()
                }
              >
                Try Again
              </button>

            </div>

          ) : filteredProducts.length === 0 ? (

            <div className="earth-message">

              <h3>No Products Found</h3>

              <p>
                {search.trim()
                  ? "Try another search term."
                  : selectedExecutiveCategoryLabel
                    ? `There are currently no ${selectedExecutiveCategoryLabel.toLowerCase()} products in this collection.`
                    : selectedProductLevel === "affordable"
                      ? "There are currently no affordable products in this collection."
                      : selectedProductLevel === "executive"
                        ? "There are currently no executive products in this collection."
                        : `There are currently no products in the ${selectedCollectionConfig.name.toLowerCase()}'s collection.`}
              </p>

              <button
                type="button"
                onClick={clearCategoryFilter}
              >
                View All Products
              </button>

            </div>

          ) : (

            <div className="earth-category-sections">

              {categorySections.map((category) => (

                <section
                  key={category.id}
                  className="earth-category-section"
                >

                  <div className="earth-category-heading">

                    <h3>
                      {category.name}
                    </h3>

                    <span>
                      {category.products.length} Products
                    </span>

                  </div>

                  <div className="earth-product-grid">

                    {category.products.map((product) => (

                      <ProductCard
                        key={product.id}
                        product={product}
                      />

                    ))}

                  </div>

                </section>

              ))}

            </div>

          )}

        </section>

        {/* =====================================
            COMMUNITY SECTION
        ===================================== */}

        <section className="earth-community">

          <div>

            <span>
              LIVE NATURALLY. DRESS TIMELESSLY.
            </span>

            <h2>
              Made for You.
              <br />
              Grounded in Nature.
            </h2>

            <p>
              Discover timeless designs and everyday
              essentials from Living Earth.
            </p>

          </div>

          <button
            type="button"
            onClick={scrollToProducts}
            className="earth-button"
          >
            Shop Living Earth
            <FaArrowRight />
          </button>

        </section>

      </main>

      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="earth-footer">

        <div className="earth-footer-main">

          <div className="earth-footer-brand">

            <div className="earth-footer-logo">

              <FaLeaf />

              <div>
                <h2>LIVING EARTH</h2>

                <span>
                  {selectedCollection.toUpperCase()}
                </span>
              </div>

            </div>

            <p>Grounded in Nature</p>

          </div>

          <nav className="earth-footer-links">

            <button
              type="button"
              onClick={scrollToTop}
            >
              Home
            </button>

            <button
              type="button"
              onClick={scrollToProducts}
            >
              Collections
            </button>

            <a href="/about">
              About Us
            </a>

            <a href="/size-guide">
              Size Guide
            </a>

            <a href="/contact">
              Contact
            </a>

          </nav>

          <div className="earth-footer-social">
            <span>f</span>
            <span>◎</span>
            <span>♪</span>
            <span>▶</span>
          </div>

        </div>

        <div className="earth-footer-bottom">

          <span>
            Grounded in Nature
          </span>

          <span>
            © {new Date().getFullYear()} Living Earth.
            All rights reserved.
          </span>

        </div>

      </footer>

    </div>
  );
}

export default Home;