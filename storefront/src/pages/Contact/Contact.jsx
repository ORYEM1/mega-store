import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Contact.css";

/*
|--------------------------------------------------------------------------
| LIVING EARTH CONTACT SETTINGS
|--------------------------------------------------------------------------
| Replace these placeholders with your actual business details.
*/

const CONTACT = {
  email: "info@livingearthapparels.com",
  phone: "+256753502796",
  whatsapp: "256753502796",
  location: "Your business location",

  social: {
    facebook: "https://www.facebook.com/livingearthapparel/",
    tiktok: "https://www.tiktok.com/@livingearthapparels",
    
  },
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailSubject = encodeURIComponent(formData.subject);
    const emailBody = encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    );

    window.location.href = `mailto:${CONTACT.email}?subject=${emailSubject}&body=${emailBody}`;

    setSuccess("Your email application is opening. Please send your message there.");
  };

  return (
    <main className="living-contact">

      {/* HERO */}
      <section className="contact-hero">
        <div className="contact-hero-content">
          <span className="contact-eyebrow">WE WOULD LOVE TO HEAR FROM YOU</span>

          <h1>
            Let's start a
            <br />
            <span>conversation.</span>
          </h1>

          <p>
            Questions, ideas or simply want to say hello?
            We're always happy to connect.
          </p>

          <a href="#contact-details" className="contact-hero-button">
            GET IN TOUCH <span>↗</span>
          </a>
        </div>
      </section>

      {/* INTRODUCTION */}
      <section className="contact-intro">
        <span className="contact-eyebrow">HERE FOR YOU</span>

        <h2>
          A little help goes
          <br />
          <span>a long way.</span>
        </h2>

        <p>
          Whether you need help with an order, have a question about
          our collection or would like to work with us, we'd love
          to hear from you.
        </p>
      </section>

      {/* CONTACT DETAILS + FORM */}
      <section className="contact-main" id="contact-details">

        <div className="contact-information">
          <span className="contact-eyebrow">CONTACT INFORMATION</span>

          <h2>
            Reach out.
            <br />
            <span>We're listening.</span>
          </h2>

          <p>
            Choose whichever way is most convenient for you.
          </p>

          <div className="contact-detail">
            <span className="contact-detail-label">EMAIL US</span>
            <a href={`mailto:${CONTACT.email}`}>
              {CONTACT.email}
            </a>
          </div>

          <div className="contact-detail">
            <span className="contact-detail-label">CALL US</span>
            <a href={`tel:${CONTACT.phone}`}>
              {CONTACT.phone}
            </a>
          </div>

          <div className="contact-detail">
            <span className="contact-detail-label">WHATSAPP</span>
            <a
              href={`https://wa.me/${CONTACT.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Chat with us on WhatsApp ↗
            </a>
          </div>

          <div className="contact-detail">
            <span className="contact-detail-label">LOCATION</span>
            <p>{CONTACT.location}</p>
          </div>

          {/* SOCIAL MEDIA */}
          <div className="contact-social-section">
            <span className="contact-detail-label">FOLLOW LIVING EARTH</span>

            <div className="contact-social-links">
              <a
                href={CONTACT.social.instagram}
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram ↗
              </a>

              <a
                href={CONTACT.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook ↗
              </a>

              <a
                href={CONTACT.social.tiktok}
                target="_blank"
                rel="noopener noreferrer"
              >
                TikTok ↗
              </a>

              <a
                href={CONTACT.social.pinterest}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pinterest ↗
              </a>
            </div>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="contact-form-wrapper">
          <span className="contact-eyebrow">SEND US A MESSAGE</span>

          <h2>How can we help?</h2>

          <p>
            Fill in the form below and tell us what's on your mind.
          </p>

          <form className="contact-form" onSubmit={handleSubmit}>

            <div className="contact-form-row">
              <div className="contact-field">
                <label htmlFor="contact-name">YOUR NAME</label>

                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="contact-field">
                <label htmlFor="contact-email">EMAIL ADDRESS</label>

                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="contact-field">
              <label htmlFor="contact-subject">SUBJECT</label>

              <input
                type="text"
                id="contact-subject"
                name="subject"
                placeholder="What is this about?"
                value={formData.subject}
                onChange={handleChange}
                required
              />
            </div>

            <div className="contact-field">
              <label htmlFor="contact-message">YOUR MESSAGE</label>

              <textarea
                id="contact-message"
                name="message"
                rows="6"
                placeholder="Write your message here..."
                value={formData.message}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="contact-submit-button">
              SEND MESSAGE <span>↗</span>
            </button>

            {success && (
              <p className="contact-success">{success}</p>
            )}

          </form>
        </div>

      </section>

      {/* WHATSAPP BANNER */}
      <section className="contact-whatsapp-banner">
        <div>
          <span className="contact-eyebrow">NEED A QUICK RESPONSE?</span>

          <h2>
            Let's talk on
            <br />
            <span>WhatsApp.</span>
          </h2>

          <p>
            Have a quick question? Send us a message and connect
            with Living Earth directly.
          </p>
        </div>

        <a
          href={`https://wa.me/${CONTACT.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-whatsapp-button"
        >
          CHAT WITH US ↗
        </a>
      </section>

      {/* FINAL CTA */}
      <section className="contact-bottom">
        <span className="contact-eyebrow">LIVE BEAUTIFULLY</span>

        <h2>
          Thank you for being
          <br />
          <span>part of our journey.</span>
        </h2>

        <Link to="/" className="contact-shop-button">
          EXPLORE OUR COLLECTION ↗
        </Link>
      </section>

    </main>
  );
};

export default Contact;