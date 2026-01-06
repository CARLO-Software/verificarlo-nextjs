document.addEventListener("DOMContentLoaded", function () {
    // FAQ Section Toggle with improved accessibility
    const faqItems = document.querySelectorAll(".label-buttons");
    faqItems.forEach(function (item) {
        const button = item.querySelector(".frame-427318843");
        const answer = item.querySelector(".frame-427318844");

        if (button && answer) {
            button.addEventListener("click", function (event) {
                event.preventDefault();

                // Close all other FAQ items
                faqItems.forEach(function (otherItem) {
                    if (otherItem !== item) {
                        const otherButton = otherItem.querySelector(".frame-427318843");
                        const otherAnswer = otherItem.querySelector(".frame-427318844");
                        if (otherButton && otherAnswer) {
                            otherButton.classList.remove("open");
                            otherButton.setAttribute("aria-expanded", "false");
                        }
                    }
                });

                // Toggle current FAQ item
                const isOpen = button.classList.contains("open");
                button.classList.toggle("open");
                button.setAttribute("aria-expanded", !isOpen);
            });

            // Initialize ARIA attributes
            button.setAttribute("aria-expanded", "false");
        }
    });

    // FAQ Show More functionality
    const showMoreBtn = document.querySelector(".faq-show-more-btn");
    const faqContainer = document.querySelector(".faq-right");

    if (showMoreBtn && faqContainer) {
        showMoreBtn.addEventListener("click", function (event) {
            event.preventDefault();
            faqContainer.classList.add("faq-expanded");
        });
    }

    // Initialize Splide for the process slider
    if (document.querySelector(".process-slider")) {
        new Splide(".process-slider", {
            // Default options (mobile-first for screens < 360px)
            type: "slide",
            perPage: 1.01,
            gap: "14px",
            focus: "center",
            arrows: false,
            pagination: false,
            rewind: false,
            clampDrag: true,
            padding: { right: "16px", left: "16px" },
            autoWidth: false,
            // Use min-width for breakpoints for a mobile-first approach
            mediaQuery: "min",
            breakpoints: {
                // Small tablets (600px and wider)
                600: {
                    perPage: 2.01,
                    perMove: 2,
                    gap: "8px",
                    padding: { right: "20px", left: "20px" },
                    focus: 0,
                },
                // For screens 1200px and wider
                1200: {
                    fixedWidth: "294px",
                    padding: { right: "0px", left: "0px" },
                    drag: false,
                },
            },
        }).mount();
    }

    // Initialize Splide for the services slider
    if (document.querySelector(".services-slider-div")) {
        new Splide(".services-slider-div", {
            // Mobile-first options
            type: "slide",
            perPage: 1.01,
            gap: "12px",
            focus: "center",
            arrows: false,
            pagination: false,
            rewind: false,
            clampDrag: true,
            padding: { right: "16px", left: "16px" },
            mediaQuery: "min",
            breakpoints: {
                480: {
                    perPage: 1.4,
                    focus: "center",
                },
                600: {
                    perPage: 2.01,
                    gap: "16px",
                    padding: { right: "20px", left: "20px" },
                    focus: 0,
                },
                992: {
                    perPage: 3,
                    gap: "16px",
                    padding: { right: "0px", left: "0px" },
                    drag: false,
                },
            },
        }).mount();
    }

    // Lazy loading for images (improved accessibility)
    const images = document.querySelectorAll('img[loading="lazy"]');
    if ("IntersectionObserver" in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src || img.src;
                    img.classList.remove("lazy");
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach((img) => {
            imageObserver.observe(img);
        });
    }

    // Keyboard navigation improvements
    document.addEventListener("keydown", function (e) {
        // Escape key to close open FAQ items
        if (e.key === "Escape") {
            const openFaqButton = document.querySelector(".frame-427318843.open");
            if (openFaqButton) {
                openFaqButton.classList.remove("open");
                openFaqButton.setAttribute("aria-expanded", "false");
                openFaqButton.focus();
            }
        }
    });
});


