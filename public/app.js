// Countdown Timer
function updateCountdown() {
  const eventDate = new Date('2026-08-30T17:30:00');
  const now = new Date();
  const diff = eventDate - now;

  if (diff <= 0) {
    document.getElementById('days').textContent = '0';
    document.getElementById('hours').textContent = '0';
    document.getElementById('minutes').textContent = '0';
    document.getElementById('seconds').textContent = '0';
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById('days').textContent = days;
  document.getElementById('hours').textContent = hours;
  document.getElementById('minutes').textContent = minutes;
  document.getElementById('seconds').textContent = seconds;
}

updateCountdown();
setInterval(updateCountdown, 1000);

// Number Input Buttons
document.querySelectorAll('.num-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = document.getElementById(btn.dataset.target);
    const min = parseInt(target.min);
    const max = parseInt(target.max);
    let value = parseInt(target.value) || 0;

    if (btn.classList.contains('plus') && value < max) {
      target.value = value + 1;
    } else if (btn.classList.contains('minus') && value > min) {
      target.value = value - 1;
    }
  });
});

// RSVP Form
const form = document.getElementById('rsvp-form');
const submitBtn = document.getElementById('submit-btn');
const successMsg = document.getElementById('rsvp-success');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const btnText = submitBtn.querySelector('.btn-text');
  const btnLoading = submitBtn.querySelector('.btn-loading');
  btnText.style.display = 'none';
  btnLoading.style.display = 'inline';
  submitBtn.disabled = true;

  const data = {
    familyName: document.getElementById('familyName').value,
    adults: document.getElementById('adults').value,
    children: document.getElementById('children').value,
    message: document.getElementById('message').value
  };

  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (res.ok) {
      form.style.display = 'none';
      successMsg.style.display = 'block';
      launchConfetti();
      loadGuestCount();
    } else {
      alert(result.error || 'Something went wrong. Please try again.');
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      submitBtn.disabled = false;
    }
  } catch (err) {
    alert('Network error. Please try again.');
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
    submitBtn.disabled = false;
  }
});

// Guest Count
async function loadGuestCount() {
  try {
    const res = await fetch('/api/rsvps/count');
    const data = await res.json();
    document.getElementById('family-count').textContent = data.totalFamilies;
  } catch (err) {
    // silently fail
  }
}

loadGuestCount();

// Continuous Confetti & Balloons Animation
(function () {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let animationId = null;
  let running = true;
  let opacity = 1;

  const colors = ['#E8A0A0', '#F0B8B8', '#F5D5D0', '#D4756A', '#C4956A', '#D4A574'];
  const balloonColors = ['#E8A0A0', '#F5D5D0', '#D4A574', '#8BAF8F', '#C4956A'];

  let confetti = [];
  let balloons = [];
  let balloonTimer = 0;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  function createConfettiPiece() {
    return {
      x: Math.random() * canvas.width,
      y: -10,
      w: Math.random() * 8 + 4,
      h: Math.random() * 5 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 2 + 1,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.08,
      drift: (Math.random() - 0.5) * 1.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.03 + 0.01
    };
  }

  function createBalloon() {
    const radius = Math.random() * 16 + 18;
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + radius + 20,
      radius,
      color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
      speed: Math.random() * 1.5 + 1,
      drift: (Math.random() - 0.5) * 0.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleAmp: Math.random() * 20 + 10,
      wobbleSpeed: Math.random() * 0.02 + 0.01,
      stringLength: Math.random() * 30 + 40
    };
  }

  // Seed initial confetti spread across the screen
  for (let i = 0; i < 60; i++) {
    const piece = createConfettiPiece();
    piece.y = Math.random() * canvas.height;
    confetti.push(piece);
  }

  function drawBalloon(b) {
    const wobbleX = Math.sin(b.wobble) * b.wobbleAmp;
    const bx = b.x + wobbleX;

    // String
    ctx.beginPath();
    ctx.moveTo(bx, b.y + b.radius);
    ctx.quadraticCurveTo(
      bx + Math.sin(b.wobble) * 5,
      b.y + b.radius + b.stringLength * 0.5,
      bx + Math.sin(b.wobble) * 3,
      b.y + b.radius + b.stringLength
    );
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Balloon body
    ctx.beginPath();
    ctx.ellipse(bx, b.y, b.radius * 0.85, b.radius, 0, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();

    // Shine highlight
    ctx.beginPath();
    ctx.ellipse(bx - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.2, b.radius * 0.3, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // Knot
    ctx.beginPath();
    ctx.moveTo(bx - 3, b.y + b.radius);
    ctx.lineTo(bx + 3, b.y + b.radius);
    ctx.lineTo(bx, b.y + b.radius + 5);
    ctx.closePath();
    ctx.fillStyle = b.color;
    ctx.fill();
  }

  function animate() {
    if (!running && opacity <= 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      animationId = null;
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = opacity;

    // Spawn new confetti
    if (running && Math.random() < 0.3) {
      confetti.push(createConfettiPiece());
    }

    // Spawn balloons intermittently
    balloonTimer++;
    if (running && balloonTimer > 90 && Math.random() < 0.03) {
      balloons.push(createBalloon());
      balloonTimer = 0;
    }

    // Draw & update confetti
    confetti.forEach(c => {
      ctx.save();
      ctx.translate(c.x + c.w / 2, c.y + c.h / 2);
      ctx.rotate(c.angle);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();

      c.y += c.speed;
      c.wobble += c.wobbleSpeed;
      c.x += c.drift + Math.sin(c.wobble) * 0.5;
      c.angle += c.spin;
    });

    // Remove off-screen confetti
    confetti = confetti.filter(c => c.y < canvas.height + 20);

    // Draw & update balloons
    balloons.forEach(b => {
      drawBalloon(b);
      b.y -= b.speed;
      b.x += b.drift;
      b.wobble += b.wobbleSpeed;
    });

    // Remove off-screen balloons
    balloons = balloons.filter(b => b.y + b.radius + b.stringLength > -50);

    // Fade out when stopped
    if (!running) {
      opacity = Math.max(0, opacity - 0.02);
    }

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Stop animation when scrolling past hero into details
  const detailsSection = document.getElementById('details');

  const stopObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        running = false;
      } else if (entry.boundingClientRect.top > 0) {
        // Only resume if user scrolled back up above details
        running = true;
        opacity = 1;
        if (!animationId) animate();
      }
    });
  }, { threshold: 0.1 });

  stopObserver.observe(detailsSection);
})();

// RSVP success confetti burst
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#E8A0A0', '#F0B8B8', '#F5D5D0', '#D4756A', '#C4956A', '#8BAF8F'];
  const pieces = [];

  for (let i = 0; i < 150; i++) {
    pieces.push({
      x: canvas.width / 2 + (Math.random() - 0.5) * 200,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 15,
      vy: Math.random() * -12 - 5,
      w: Math.random() * 10 + 5,
      h: Math.random() * 6 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.2,
      gravity: 0.3
    });
  }

  let frame = 0;

  function burst() {
    if (frame >= 120) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = frame > 90 ? 1 - (frame - 90) / 30 : 1;

    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.angle += p.spin;
      p.vx *= 0.98;
    });

    frame++;
    requestAnimationFrame(burst);
  }

  burst();
}

// Scroll animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.detail-card, .countdown-item').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});
