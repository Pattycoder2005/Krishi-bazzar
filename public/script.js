// 🌐 Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      window.scrollTo({
        top: target.offsetTop - 60,
        behavior: "smooth"
      });
    }
  });
});

// 📱 Mobile navigation toggle
const navToggle = document.getElementById("navToggle");
const mainNav = document.querySelector(".main-nav");

if (navToggle) {
  navToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });
}

// 📩 Contact form handling
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const msg = document.getElementById("msg").value.trim();

    if (name && email && msg) {
      alert(`✅ Thank you, ${name}! Your message has been received.`);
      contactForm.reset();
    } else {
      alert("⚠️ Please fill in all fields.");
    }
  });
}

// 📝 Optional: Add hover effect to buttons
document.querySelectorAll(".btn").forEach(btn => {
  btn.addEventListener("mouseenter", () => {
    btn.style.opacity = "0.85";
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.opacity = "1";
  });
});
