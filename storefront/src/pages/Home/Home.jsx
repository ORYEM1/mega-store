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

function getResponseData(response) {
  // Case 1: API returns an array directly.
  if (Array.isArray(response)) {
    return response;
  }

  // Case 2: Axios response containing an array.
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  // Case 3: Laravel paginated response.
  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  return [];
}

function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners] = useState([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch products, categories and banners from Laravel.
  useEffect(() => {
    async function fetchStoreData() {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, categoriesResponse] =
          await Promise.all([
            getProducts(),
            getCategories(),
          ]);

        setProducts(getResponseData(productsResponse));
        setCategories(getResponseData(categoriesResponse));
      } catch (err) {
        console.error("Failed to load store data:", err);

        setError(
          "We could not load the products. Please check your connection and try again."
        );
      } finally {
        setLoading(false);
      }

      // Load banners separately so a banner API failure
      // does not prevent the products from displaying.
      try {
        const bannersResponse = await getBanners();

        setBanners(getResponseData(bannersResponse));
      } catch (err) {
        console.error("Failed to load banners:", err);
        setBanners([]);
      }
    }

    fetchStoreData();
  }, []);

  // Only display active banners.
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
          Number(a.sort_order || 0) - Number(b.sort_order || 0)
      );
  }, [banners]);

  // Get the main hero banner.
  const heroBanner = useMemo(() => {
    return activeBanners.find(
      (banner) => banner.position === "hero"
    );
  }, [activeBanners]);

  // Get smaller promotional banners.
  const promotionalBanners = useMemo(() => {
    return activeBanners.filter(
      (banner) => banner.position === "promo"
    );
  }, [activeBanners]);

  // Flatten parent categories and their subcategories.
  const allCategories = useMemo(() => {
    return categories.flatMap((category) => [
      category,
      ...(category.children || []),
    ]);
  }, [categories]);

  // Search products by name, description, or SKU.
  const filteredProducts = useMemo(() => {
    const searchTerm = search.trim().toLowerCase();

    if (!searchTerm) return products;

    return products.filter((product) => {
      const name = product.name?.toLowerCase() || "";
      const description = product.description?.toLowerCase() || "";
      const sku = product.sku?.toLowerCase() || "";

      return (
        name.includes(searchTerm) ||
        description.includes(searchTerm) ||
        sku.includes(searchTerm)
      );
    });
  }, [products, search]);

  // Group products by category.
  const categorySections = useMemo(() => {
    return allCategories
      .map((category) => {
        const categoryProducts = filteredProducts.filter(
          (product) =>
            Number(product.category?.id) === Number(category.id)
        );

        return {
          ...category,
          products: categoryProducts,
        };
      })
      .filter((category) => category.products.length > 0);
  }, [allCategories, filteredProducts]);

  // Products without a category.
  const uncategorizedProducts = useMemo(() => {
    const knownCategoryIds = new Set(
      allCategories.map((category) => Number(category.id))
    );

    return filteredProducts.filter(
      (product) =>
        !product.category ||
        !knownCategoryIds.has(Number(product.category.id))
    );
  }, [filteredProducts, allCategories]);

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  // Render a banner image using desktop and optional mobile images.
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

  const renderBannerButton = (banner, className) => {
    if (!banner.button_text) return null;

    const link = banner.button_link || "#products";

    if (link.startsWith("http://") || link.startsWith("https://")) {
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

  return (
    <div className="store">
      <Navbar
        categories={categories}
        search={search}
        setSearch={setSearch}
      />

      <main>
        {/* HERO BANNER */}
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
          /* DEFAULT HERO WHEN NO HERO BANNER EXISTS */
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
                <span>ADRIAN COLLECTIONS</span>
                <span>EST. FOR THE BOLD</span>
              </div>
            </div>

            <div className="street-hero-side-text">
              STREETWEAR / EVERYDAY CULTURE
            </div>
          </section>
        )}

        {/* BRAND MESSAGE */}
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

        {/* PROMOTIONAL BANNERS */}
        {promotionalBanners.length > 0 && (
          <section className="home-promotional-banners">
            <div className="promotional-banner-heading">
              <p className="section-eyebrow">DISCOVER MORE</p>
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

        {/* PRODUCTS SECTION */}
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

          {loading ? (
            <div className="store-message">
              <div className="street-loader"></div>
              <p>LOADING THE COLLECTION...</p>
            </div>
          ) : error ? (
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
            <div className="store-empty">
              <h3>NOTHING FOUND.</h3>
              <p>
                {search.trim()
                  ? "Try another search term."
                  : "Our collection is being updated. Check back soon."}
              </p>
            </div>
          ) : (
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

        {/* CALL TO ACTION */}
        <section className="street-cta">
          <div>
            <p className="section-eyebrow">YOUR STYLE. YOUR RULES.</p>
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

      {/* FOOTER */}
      <footer className="store-footer">
        <div className="footer-brand">
          MEGA<span>.</span>
          <small>STORE</small>
        </div>

        <p>MORE THAN FASHION. IT'S AN ATTITUDE.</p>

        <span>
          © {new Date().getFullYear()} Adrian Collections. All rights reserved.
        </span>
      </footer>
    </div>
  );
}

export default Home;