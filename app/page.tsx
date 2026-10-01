"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AuthControls } from "@/components/auth-controls";
import { useCart } from "@/components/cart-provider";
import {
  formatPrice,
  products as sampleProducts,
  type ProductCategory,
} from "@/lib/products";

type CategoryFilter = "all" | ProductCategory;

export default function Home() {
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");
  const [addedProduct, setAddedProduct] = useState<string | null>(null);
  const [products, setProducts] = useState(sampleProducts);
  const { add, count: cartCount } = useCart();

  useEffect(() => {
    fetch("/api/products")
      .then(async (response) => {
        if (!response.ok) return;
        const catalog = (await response.json()) as typeof sampleProducts;
        if (Array.isArray(catalog)) setProducts(catalog);
      })
      .catch(() => undefined);
  }, []);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        category === "all" || product.category === category;
      const matchesQuery =
        !normalizedQuery ||
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [category, products, query]);

  function addToCart(productId: string) {
    add(productId);
    setAddedProduct(productId);
    window.setTimeout(() => setAddedProduct(null), 1400);
  }

  return (
    <main className="storefront">
      <header className="site-header">
        <Link
          aria-label="Belmont Technologies home"
          className="brand"
          href="/"
        >
          <span className="brand-mark">B</span>
          <span>
            belmont<span className="brand-light">tech</span>
          </span>
        </Link>
        <nav aria-label="Main navigation" className="main-nav">
          <a className="nav-active" href="#shop">
            Shop
          </a>
          <a href="#products" onClick={() => setCategory("software")}>
            Software
          </a>
          <a href="#products" onClick={() => setCategory("hardware")}>
            Hardware
          </a>
        </nav>
        <Link
          aria-label={`Basket, ${cartCount} items`}
          className="basket-link"
          href="/cart"
        >
          <span aria-hidden="true" className="basket-icon">
            +
          </span>
          <span>Basket</span>
          <span className="basket-count">{cartCount}</span>
        </Link>
        <AuthControls />
      </header>

      <section className="shop-intro" id="shop">
        <div className="intro-copy">
          <p className="eyebrow">
            <span className="eyebrow-dot" /> BELMONT TECHNOLOGIES / SHOP
          </p>
          <h1>
            Good tools.
            <br />
            <span>Better work.</span>
          </h1>
          <p className="intro-description">
            Thoughtful software and dependable hardware for the way you work.
          </p>
          <a className="text-link" href="#products">
            Explore the collection <span aria-hidden="true">↘</span>
          </a>
        </div>
        <div
          aria-label="Laptop and desk setup"
          className="intro-image"
          role="img"
        >
          <div className="image-caption">
            <span>01 / 02</span>
            <span>Tools for moving forward</span>
          </div>
        </div>
      </section>

      <section aria-label="Shop products" className="catalogue" id="products">
        <div className="catalogue-heading">
          <div>
            <p className="eyebrow">THE BELMONT EDIT</p>
            <h2>Shop the collection</h2>
          </div>
          <p className="result-count">
            {visibleProducts.length.toString().padStart(2, "0")} PRODUCTS
          </p>
        </div>
        <div className="catalogue-controls">
          <div
            aria-label="Filter products by category"
            className="filter-tabs"
            role="group"
          >
            {(["all", "software", "hardware"] as const).map((item) => (
              <button
                aria-pressed={category === item}
                className={
                  category === item ? "filter-button selected" : "filter-button"
                }
                key={item}
                onClick={() => setCategory(item)}
                type="button"
              >
                {item === "all"
                  ? "All products"
                  : item === "software"
                  ? "Software"
                  : "Hardware"}
              </button>
            ))}
          </div>
          <label className="search-control">
            <span aria-hidden="true" className="search-glyph" />
            <span className="visually-hidden">Search products</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search the shop"
              type="search"
              value={query}
            />
          </label>
        </div>

        {visibleProducts.length ? (
          <div className="product-grid">
            {visibleProducts.map((product, index) => (
              <article className="product-card" key={product.id}>
                <div
                  aria-label={product.name}
                  className="product-image"
                  role="img"
                  style={{ backgroundImage: `url("${product.imageUrl}")` }}
                >
                  <span className="product-index">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="product-category">
                    {product.category === "software" ? "DIGITAL" : "HARDWARE"}
                  </span>
                </div>
                <div className="product-information">
                  <div className="product-copy">
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                  </div>
                  <div className="product-purchase">
                    <span className="product-price">
                      {formatPrice(product.priceCents)}
                    </span>
                    <button
                      aria-label={`${
                        addedProduct === product.id ? "Added" : "Add"
                      } ${product.name} to basket`}
                      className={
                        addedProduct === product.id
                          ? "add-button added"
                          : "add-button"
                      }
                      onClick={() => addToCart(product.id)}
                      type="button"
                    >
                      {addedProduct === product.id ? "Added" : "Add to basket"}
                      <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-results">
            Nothing matched that search. Try another name or category.
          </p>
        )}
      </section>

      <footer className="site-footer">
        <Link className="brand footer-brand" href="/">
          <span className="brand-mark">B</span>
          <span>
            belmont<span className="brand-light">tech</span>
          </span>
        </Link>
        <p>Useful technology, chosen with care.</p>
        <span className="footer-note">LAGOS, NIGERIA · 2026</span>
      </footer>
    </main>
  );
}
