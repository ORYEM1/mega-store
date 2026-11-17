
import { useEffect, useMemo, useState } from "react";
import { FaArrowRight, FaBolt } from "react-icons/fa";

import {
  getCategories,
  getProducts,
  getBanners,
} from "../../services/api";

import Navbar from "../../components/Navbar/Navbar";
import ProductCard from "../../components/ProductCard/ProductCard";

import "./Home.css";

/* =====================================
   API RESPONSE HELPER
===================================== */

function getResponseData(response) {
  // Direct array.
  if (Array.isArray(response)) {
    return response;
  }

  // Laravel response: { success: true, data: [...] }
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  // Laravel paginated response: { data: { data: [...] } }
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

/* =====================================
   HOME COMPONENT
===================================== */

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================
     FETCH STORE DATA
  ===================================== */

  useEffect(() => {
    let isMounted = true;

    async function fetchStoreData() {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, categoriesResponse] =
          await Promise.all([
            getProducts(),
            getCategories(),
          ]);

        const productsData = getResponseData(productsResponse);
        const categoriesData = getResponseData(categoriesResponse);

        console.log("PRODUCTS FROM API:", productsData);
        console.log("CATEGORIES FROM API:", categoriesData);

        if (!isMounted) return;

        setProducts(productsData);
        setCategories(categoriesData);

      } catch (err) {
        console.error("Failed to load store data:", err);

        if (isMounted) {
          setError(
            "We could not load the products. Please check your connection and try again."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }

      // Load banners separately.
      // Banner failures should not affect product loading.
      try {
        const bannersResponse = await getBanners();
        const bannersData = getResponseData(bannersResponse);

        if (isMounted) {
          setBanners(bannersData);
        }
      } catch (err) {
        console.error("Failed to load banners:", err);

        if (isMounted) {
          setBanners([]);
        }
      }
    }

    fetchStoreData();

    return () => {
      isMounted = false;
    };
  }, []);

  /* =====================================
     ACTIVE BANNERS
  ===================================== */

  const activeBanners = useMemo(() => {
    return banners
      .filter((banner) => {
        return (
          banner.is_active === true ||
          banner.is_active === 1 ||
          banner.is_active === "1"
        );
      })
      .sort(
        (a, b) =>
          Number(a.sort_order || 0) -
          Number(b.sort_order || 0)
      );
  }, [banners]);

  /* =====================================
     HERO BANNER
  ===================================== */

  const heroBanner = useMemo(() => {
    return activeBanners.find(
      (banner) => banner.position === "hero"
    );
  }, [activeBanners]);

  /* =====================================
     PROMOTIONAL BANNERS
  ===================================== */

  const promotionalBanners = useMemo(() => {
    return activeBanners.filter(
      (banner) => banner.position === "promo"
    );
  }, [activeBanners]);

  /* =====================================
     FLATTEN CATEGORIES
  ===================================== */

  const allCategories = useMemo(() => {
    const flattened = [];

    categories.forEach((category) => {
      flattened.push(category);

      if (Array.isArray(category.children)) {
        category.children.forEach((child) => {
          flattened.push(child);
        });
      }
    });

    // Remove duplicate category IDs.
    return [
      ...new Map(
        flattened.map((category) => [
          Number(category.id),
          category,
        ])
      ).values(),
    ];
  }, [categories]);

  /* =====================================
     SEARCH PRODUCTS
  ===================================== */

  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) {
      return products;
    }

    return products.filter((product) => {
      const name = String(product.name || "").toLowerCase();

      const description = String(
        product.description || ""
      ).toLowerCase();

      const sku = String(product.sku || "").toLowerCase();

      return (
        name.includes(searchTerm) ||
        description.includes(searchTerm) ||
        sku.includes(searchTerm)
      );
    });
  }, [products, search]);

  /* =====================================
     GROUP PRODUCTS BY CATEGORY
  ===================================== */

  const categorySections = useMemo(() => {
    return allCategories
      .map((category) => {
        const categoryId = Number(category.id);

        const categoryProducts = filteredProducts.filter(
          (product) => {
            const productCategoryId = Number(
              product.category?.id ?? product.category_id
            );

            return productCategoryId === categoryId;
          }
        );

        return {
          ...category,
          products: categoryProducts,
        };
      })
      .filter((category) => category.products.length > 0);
  }, [allCategories, filteredProducts]);

  /* =====================================
     UNCATEGORIZED PRODUCTS
  ===================================== */

  const uncategorizedProducts = useMemo(() => {
    const knownCategoryIds = new Set(
      allCategories.map((category) => Number(category.id))
    );

    return filteredProducts.filter((product) => {
      const categoryId = Number(
        product.category?.id ?? product.category_id
      );

      return (
        !product.category &&
        !product.category_id ||
        !knownCategoryIds.has(categoryId)
      );
    });
  }, [filteredProducts, allCategories]);

  /* =====================================
     DEBUGGING
  ===================================== */

  useEffect(() => {
    console.log("TOTAL PRODUCTS:", products.length);
    console.log("TOTAL CATEGORIES:", categories.length);
    console.log("FLATTENED CATEGORIES:", allCategories);
    console.log("CATEGORY SECTIONS:", categorySections);
    console.log("PRODUCTS WITHOUT CATEGORY:", uncategorizedProducts);
  }, [
    products,
    categories,
    allCategories,
    categorySections,
    uncategorizedProducts,
  ]);

  /* =====================================
     SCROLL TO PRODUCTS
  ===================================== */

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  /* =====================================
     BANNER IMAGES
  ===================================== */

  const getBannerImage = (banner) => {
    return banner.image_url || banner.image || "";
  };

  const getMobileBannerImage = (banner) => {
    return (
      banner.mobile_image_url ||
      banner.mobile_image ||
      getBannerImage(banner)
    );
  };

  /* =====================================
     BANNER BUTTON
  ===================================== */

  const renderBannerButton = (banner, className) => {
    if (!banner.button_text) {
      return null;
    }

    const link = banner.button_link || "#products";

    if (
      link.startsWith("http://") ||
      link.startsWith("https://")
    ) {
      return (
        <a
          href={link}
          className={className}
          target="_blank"
          rel="noopener noreferrer"
        >
          {banner.button_text}
          <FaArrowRight />
        </a>
      );
    }

    return (
      <a href={link} className={className}>
        {banner.button_text}
        <FaArrowRight />
      </a>
    );
  };

  /* =====================================
     RENDER
  ===================================== */

  return (
    <div className="store">

      {/* NAVBAR */}
      <Navbar
        categories={categories}
        search={search}
        setSearch={setSearch}
      />

      <main>

        {/* =====================================
            HERO BANNER
        ===================================== */}

        {heroBanner ? (
          <section className="dynamic-hero">

            <picture className="dynamic-hero-picture">
              <source
                media="(max-width: 768px)"
                srcSet={getMobileBannerImage(heroBanner)}
              />

              <img
                src={getBannerImage(heroBanner)}
                alt={heroBanner.title || "Adrian Collections"}
              />
            </picture>

            <div className="dynamic-hero-overlay"></div>

            <div className="dynamic-hero-content">

              <div className="street-hero-tag">
                <FaBolt />
                <span>MEGA STORE</span>
              </div>

              <h1>{heroBanner.title}</h1>

              {heroBanner.subtitle && (
                <p>{heroBanner.subtitle}</p>
              )}

              {renderBannerButton(
                heroBanner,
                "dynamic-hero-button"
              )}

            </div>
          </section>
        ) : (
          <section className="street-hero">

            <div className="street-hero-overlay"></div>

            <div className="street-hero-content">

              <div className="street-hero-tag">
                <FaBolt />
                <span>THE NEW STREET CULTURE</span>
              </div>

              <h1>
                OWN
                <br />
                YOUR <span>STYLE.</span>
              </h1>

              <p>
                More than fashion. It's an attitude.
                <br />
                Discover pieces that define who you are.
              </p>

              <button
                type="button"
                className="street-hero-button"
                onClick={scrollToProducts}
              >
                EXPLORE COLLECTION
                <FaArrowRight />
              </button>

              <div className="street-hero-bottom">
                <span>MEGA STORE COLLECTIONS</span>
                <span>EST. FOR THE BOLD</span>
              </div>

            </div>

            <div className="street-hero-side-text">
              STREETWEAR / EVERYDAY CULTURE
            </div>

          </section>
        )}

        {/* =====================================
            BRAND MARQUEE
        ===================================== */}

        <section className="street-marquee">
          <div className="street-marquee-track">
            <span>BE BOLD</span>
            <span>✳</span>
            <span>BE DIFFERENT</span>
            <span>✳</span>
            <span>OWN YOUR STYLE</span>
            <span>✳</span>
            <span>BE BOLD</span>
            <span>✳</span>
            <span>BE DIFFERENT</span>
            <span>✳</span>
            <span>OWN YOUR STYLE</span>
          </div>
        </section>

        {/* =====================================
            PROMOTIONAL BANNERS
        ===================================== */}

        {promotionalBanners.length > 0 && (
          <section className="home-promotional-banners">

            <div className="promotional-banner-heading">
              <p className="section-eyebrow">
                DISCOVER MORE
              </p>

              <h2>
                EXPLORE OUR <span>COLLECTIONS.</span>
              </h2>
            </div>

            <div className="promotional-banner-grid">

              {promotionalBanners.map((banner) => (
                <article
                  className="promotional-banner"
                  key={banner.id}
                >

                  <picture>
                    <source
                      media="(max-width: 600px)"
                      srcSet={getMobileBannerImage(banner)}
                    />

                    <img
                      src={getBannerImage(banner)}
                      alt={banner.title || "Promotional collection"}
                      loading="lazy"
                    />
                  </picture>

                  <div className="promotional-banner-overlay"></div>

                  <div className="promotional-banner-content">

                    {banner.subtitle && (
                      <p>{banner.subtitle}</p>
                    )}

                    <h3>{banner.title}</h3>

                    {renderBannerButton(
                      banner,
                      "promotional-banner-button"
                    )}

                  </div>

                </article>
              ))}

            </div>
          </section>
        )}

        {/* =====================================
            PRODUCTS
        ===================================== */}

        <section className="store-products" id="products">

          <div className="products-heading">

            <div>
              <p className="section-eyebrow">
                {search.trim()
                  ? "SEARCH THE COLLECTION"
                  : "CURATED FOR YOU"}
              </p>

              <h2>
                {search.trim() ? (
                  <>
                    SEARCH <span>RESULTS</span>
                  </>
                ) : (
                  <>
                    THE <span>COLLECTION.</span>
                  </>
                )}
              </h2>
            </div>

            {!search.trim() && (
              <button
                type="button"
                className="view-all-button"
                onClick={scrollToProducts}
              >
                EXPLORE ALL
                <FaArrowRight />
              </button>
            )}

          </div>

          {/* LOADING */}
          {loading ? (
            <div className="store-message">
              <div className="street-loader"></div>
              <p>LOADING THE COLLECTION...</p>
            </div>

          ) : error ? (

            /* ERROR */
            <div className="store-error">

              <h3>SOMETHING WENT WRONG</h3>

              <p>{error}</p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="retry-button"
              >
                TRY AGAIN
              </button>

            </div>

          ) : filteredProducts.length === 0 ? (

            /* EMPTY SEARCH */
            <div className="store-empty">
              <h3>NOTHING FOUND.</h3>

              <p>
                {search.trim()
                  ? "Try another search term."
                  : "Our collection is being updated. Check back soon."}
              </p>
            </div>

          ) : (

            /* CATEGORY SECTIONS */
            <div className="category-sections">

              {categorySections.map((category) => (
                <section
                  key={category.id}
                  id={`category-${category.id}`}
                  className="category-section"
                >

                  <div className="category-section-heading">

                    <div>
                      <p className="section-eyebrow">
                        EXPLORE THE COLLECTION
                      </p>

                      <h2>{category.name}.</h2>
                    </div>

                    <span className="category-product-count">
                      {String(category.products.length).padStart(2, "0")}{" "}
                      PRODUCTS
                    </span>

                  </div>

                  <div className="product-grid">

                    {category.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}

                  </div>

                </section>
              ))}

              {/* OTHER PRODUCTS */}
              {uncategorizedProducts.length > 0 && (
                <section className="category-section">

                  <div className="category-section-heading">

                    <div>
                      <p className="section-eyebrow">
                        MORE TO EXPLORE
                      </p>

                      <h2>OTHER PRODUCTS.</h2>
                    </div>

                  </div>

                  <div className="product-grid">

                    {uncategorizedProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                      />
                    ))}

                  </div>

                </section>
              )}

              {/* NO CATEGORY MATCHES */}
              {categorySections.length === 0 &&
                uncategorizedProducts.length === 0 && (
                  <div className="store-empty">
                    <h3>NO MATCHES FOUND.</h3>
                    <p>Try another search term.</p>
                  </div>
                )}

            </div>
          )}

        </section>

        {/* =====================================
            CALL TO ACTION
        ===================================== */}

        <section className="street-cta">

          <div>
            <p className="section-eyebrow">
              YOUR STYLE. YOUR RULES.
            </p>

            <h2>
              DON'T FOLLOW.
              <br />
              <span>SET THE TREND.</span>
            </h2>
          </div>

          <button
            type="button"
            className="street-cta-button"
            onClick={scrollToProducts}
          >
            SHOP THE COLLECTION
            <FaArrowRight />
          </button>

        </section>

      </main>

      {/* =====================================
          FOOTER
      ===================================== */}

      <footer className="store-footer">

        <div className="footer-brand">
          MEGA<span>.</span>
          <small>STORE</small>
        </div>

        <p>
          MORE THAN FASHION. IT'S AN ATTITUDE.
        </p>

        <span>
          © {new Date().getFullYear()} MEGA STORE COLLECTIONS.
          All rights reserved.
        </span>

      </footer>

    </div>
  );
}

export default Home;
