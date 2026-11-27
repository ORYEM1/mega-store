import React from "react";
import { Link } from "react-router-dom";
import {
  
  FaHeart,
  FaLeaf,
  FaAward,
  FaSun
  
} from "react-icons/fa";

import "./About.css";

const About = () => {
  return (
    <main className="about-page">

      {/* HERO */}
      <section className="about-hero">
        <div className="about-hero-overlay">
          <span className="about-eyebrow">GET TO KNOW US</span>

          <h1>
            A little more
            <br />
            <span>about Living Earth.</span>
          </h1>

          <p>
            Thoughtfully chosen pieces. Natural inspiration.
            A beautiful way to live every day.
          </p>

          <Link to="/" className="about-hero-button">
            EXPLORE OUR COLLECTION 
          </Link>
        </div>
      </section>

      {/* OUR STORY */}
      <section className="about-story">
        <div className="about-story-image">
          <img
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1100&q=85"
            alt="Beautiful natural home interior"
          />
        </div>

        <div className="about-story-content">
          <span className="about-eyebrow">OUR STORY</span>

          <h2>
            Inspired by nature.
            <br />
            <span>Made for everyday living.</span>
          </h2>

          <p>
            Living Earth was created around a simple idea: everyday
            living can be beautiful, thoughtful and inspired by the
            natural world.
          </p>

          <p>
            We believe the things we choose to surround ourselves with
            should bring comfort, character and a sense of connection
            to the spaces we call home.
          </p>

          <p>
            Our collection brings together carefully selected pieces
            that celebrate simplicity, natural inspiration and
            timeless style.
          </p>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="about-philosophy">
        <div className="about-philosophy-heading">
          <span className="about-eyebrow">WHAT WE BELIEVE</span>

          <h2>
            Less, but better.
            <br />
            <span>Live more beautifully.</span>
          </h2>

          <p>
            We believe that beautiful living is not about having more.
            It is about choosing better and appreciating the little
            things that make everyday life special.
          </p>
        </div>

        <div className="about-values">

          <div className="about-value-card">
            <div className="about-value-icon">
              <FaLeaf />
            </div>
            <h3>Natural Inspiration</h3>
            <p>
              Inspired by the beauty, textures and simplicity of
              the natural world.
            </p>
          </div>

          <div className="about-value-card">
            <div className="about-value-icon">
              <FaHeart />
            </div>
            <h3>Thoughtful Choices</h3>
            <p>
              We appreciate carefully selected pieces that bring
              meaning and character to everyday living.
            </p>
          </div>

          <div className="about-value-card">
            <div className="about-value-icon">
              <FaAward />
            </div>
            <h3>Timeless Style</h3>
            <p>
              We celebrate simple, versatile styles that remain
              beautiful beyond passing trends.
            </p>
          </div>

          <div className="about-value-card">
            <div className="about-value-icon">
              <FaSun/>
            </div>
            <h3>Everyday Beauty</h3>
            <p>
              We believe even the smallest details can make
              ordinary moments feel special.
            </p>
          </div>

        </div>
      </section>

      {/* IMAGE BANNER */}
      <section className="about-image-banner">
        <div className="about-image-banner-content">
          <span className="about-eyebrow">THE LIVING EARTH WAY</span>

          <h2>
            Find beauty in
            <br />
            the everyday.
          </h2>

          <p>
            Create spaces, moments and experiences that feel
            naturally yours.
          </p>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="about-cta">
        <span className="about-eyebrow">MAKE YOURSELF AT HOME</span>

        <h2>
          Your journey to
          <br />
          <span>beautiful living starts here.</span>
        </h2>

        <p>
          Discover pieces selected to bring warmth, simplicity
          and inspiration into your everyday life.
        </p>

        <Link to="/" className="about-cta-button">
          SHOP THE COLLECTION 
        </Link>
      </section>

    </main>
  );
};

export default About;