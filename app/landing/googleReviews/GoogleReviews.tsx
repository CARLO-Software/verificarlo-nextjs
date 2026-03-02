"use client";

import styles from "./GoogleReviews.module.css";

  const reviews = [
    { 
      id: 1,
      rating: 5,
      author: "Alexandra _",
      text:
        "Buen servicio me ayudaron a inspeccionar un vehículo y me brindaron asesoría sobre el mantenimiento y reparaciones por hacer",
    },
    {
      id: 2,
      rating: 5,
      author: "Jesus Chue",
      text:
        "Compré mi auto luego de la segunda inspección. El equipo técnico me ayudó bastante a entender que hacer cuando compre el auto así que los super recomiendo.",
    },
    {
      id: 3,
      rating: 5,
      author: "Dhamara Alcantara",
      text:
        "Muy satisfecha con la atención. Se notaba el profesionalismo de los inspectores y se tomaron el tiempo de explicarme todo. Ya llevo 5 meses con el carro que aprobaron y todo perfecto.",
    },
    {
      id: 4,
      rating: 5,
      author: "Ignacio Lezama",
      text:
        "Buen servicio, contraté para verificar 2 carros, fueron objetivos y ayudaron en mi elección",
    },
    {
      id: 5,
      rating: 5,
      author: "Daniel Castañeda",
      text:
        "Existen muchas empresas para la verificación de vehículos, pero ninguno como VERIFICARLO, ya que se comprometen al 100% en brindar un servicio de calidad.",
    },
    {
      id: 6,
      rating: 5,
      author: "Victoria Ordoñez",
      text: "Excelente servicio, me salvaron de comprar un pésimo auto 🥹…",
    },
  ];

// Componente para mostrar las estrellas
function StarRating({ rating }: { rating: number }) {
  return (
    <div className={styles.stars}>
      {/* Array.from crea un array de 5 elementos para renderizar las estrellas */}
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`${styles.star} ${i < rating ? styles.starFilled : ""}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

// Componente de cada tarjeta de reseña
function ReviewCard({ review }: { review: (typeof reviews)[0] }) {
  return (
    <article className={styles.card}>
      <StarRating rating={review.rating} />
      <p className={styles.text}>{review.text}</p>
      <div className={styles.author}>
        <span className={styles.authorName}>{review.author}</span>
        <span className={styles.source}>Google Reviews</span>
      </div>
    </article>
  );
}

export default function GoogleReviews() {
  return (
    <section className={styles.section} id="testimonios">
      {/* Contenedor del carrusel con overflow hidden */}
      <div className={styles.carouselWrapper}>
        {/* Track que se mueve - duplicamos las reseñas para el efecto infinito */}
        <div className={styles.track}>
          {/* Primera copia de las reseñas */}
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
          {/* Segunda copia para el loop infinito */}
          {reviews.map((review) => (
            <ReviewCard key={`dup-${review.id}`} review={review} />
          ))}
        </div>
      </div>

      {/* Logo de Google Reviews */}
      <div className={styles.googleLogo}>
        <svg viewBox="0 0 272 92" className={styles.googleSvg}>
          {/* Primera o - Roja */}
          <path
            fill="#EA4335"
            d="M115.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18C71.25 34.32 81.24 25 93.5 25s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44S80.99 39.2 80.99 47.18c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
          />
          {/* Segunda o - Amarilla */}
          <path
            fill="#FBBC05"
            d="M163.75 47.18c0 12.77-9.99 22.18-22.25 22.18s-22.25-9.41-22.25-22.18c0-12.85 9.99-22.18 22.25-22.18s22.25 9.32 22.25 22.18zm-9.74 0c0-7.98-5.79-13.44-12.51-13.44s-12.51 5.46-12.51 13.44c0 7.9 5.79 13.44 12.51 13.44s12.51-5.55 12.51-13.44z"
          />
          {/* g - Azul */}
          <path
            fill="#4285F4"
            d="M209.75 26.34v39.82c0 16.38-9.66 23.07-21.08 23.07-10.75 0-17.22-7.19-19.66-13.07l8.48-3.53c1.51 3.61 5.21 7.87 11.17 7.87 7.31 0 11.84-4.51 11.84-13v-3.19h-.34c-2.18 2.69-6.38 5.04-11.68 5.04-11.09 0-21.25-9.66-21.25-22.09 0-12.52 10.16-22.26 21.25-22.26 5.29 0 9.49 2.35 11.68 4.96h.34v-3.61h9.25zm-8.56 20.92c0-7.81-5.21-13.52-11.84-13.52-6.72 0-12.35 5.71-12.35 13.52 0 7.73 5.63 13.36 12.35 13.36 6.63 0 11.84-5.63 11.84-13.36z"
          />
          {/* l - Verde */}
          <path fill="#34A853" d="M225 3v65h-9.5V3h9.5z" />
          {/* e - Roja */}
          <path
            fill="#EA4335"
            d="M262.02 54.48l7.56 5.04c-2.44 3.61-8.32 9.83-18.48 9.83-12.6 0-22.01-9.74-22.01-22.18 0-13.19 9.49-22.18 20.92-22.18 11.51 0 17.14 9.16 18.98 14.11l1.01 2.52-29.65 12.28c2.27 4.45 5.8 6.72 10.75 6.72 4.96 0 8.4-2.44 10.92-6.14zm-23.27-7.98l19.82-8.23c-1.09-2.77-4.37-4.7-8.23-4.7-4.95 0-11.84 4.37-11.59 12.93z"
          />
          {/* G inicial - Azul */}
          <path
            fill="#4285F4"
            d="M35.29 41.41V32H67c.31 1.64.47 3.58.47 5.68 0 7.06-1.93 15.79-8.15 22.01-6.05 6.3-13.78 9.66-24.02 9.66C16.32 69.35.36 53.89.36 34.91.36 15.93 16.32.47 35.3.47c10.5 0 17.98 4.12 23.6 9.49l-6.64 6.64c-4.03-3.78-9.49-6.72-16.97-6.72-13.86 0-24.7 11.17-24.7 25.03 0 13.86 10.84 25.03 24.7 25.03 8.99 0 14.11-3.61 17.39-6.89 2.66-2.66 4.41-6.46 5.1-11.65l-22.49.01z"
          />
        </svg>
        {/* Texto "Reviews" con estrellas */}
        <div className={styles.reviewsBadge}>
          <span className={styles.reviewsText}>Reviews</span>
          <div className={styles.reviewsStars}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={styles.miniStar}>
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
