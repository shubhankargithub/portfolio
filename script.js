/* ========================================
   THREE.JS 3D HERO SCENE
   ======================================== */
(function () {
    if (typeof THREE === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const wrapper = canvas.parentElement;
    const glow = document.getElementById('heroGlow');

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Objects container
    const objects = [];
    const floatObjects = [];
    const particles = [];

    // Geometry & Materials
    const createMaterial = (color, wireframe = false) => new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.2,
        roughness: 0.5,
        wireframe: wireframe,
        transparent: wireframe,
        opacity: wireframe ? 0.15 : 0.8,
        side: wireframe ? THREE.DoubleSide : THREE.FrontSide
    });

    // Main rotating geometric shapes
    const geometries = [
        { geometry: new THREE.IcosahedronGeometry(1.0, 0), color: 0x00d4ff, wireframe: true, speed: { x: 0.001, y: 0.0015, z: 0.0008 } },
        { geometry: new THREE.OctahedronGeometry(0.75, 0), color: 0x8b5cf6, wireframe: false, speed: { x: -0.0008, y: 0.0012, z: -0.0006 } },
        { geometry: new THREE.TetrahedronGeometry(0.6, 0), color: 0x00d4ff, wireframe: true, speed: { x: 0.0015, y: -0.0008, z: 0.0012 } }
    ];

    geometries.forEach((g, i) => {
        const mesh = new THREE.Mesh(g.geometry, createMaterial(g.color, g.wireframe));
        mesh.position.set(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 1.5 - 1
        );
        mesh.userData = {
            basePosition: mesh.position.clone(),
            speed: g.speed,
            floatOffset: Math.random() * Math.PI * 2,
            floatSpeed: 0.2 + Math.random() * 0.3,
            floatAmplitude: 0.08 + Math.random() * 0.1,
            rotationOffset: new THREE.Euler(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            )
        };
        scene.add(mesh);
        objects.push(mesh);
    });

    // Floating particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        const radius = 3 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi) - 2;

        sizes[i] = Math.random() * 1.5 + 0.3;

        const colorChoice = Math.random();
        if (colorChoice < 0.5) {
            colors[i * 3] = 0;
            colors[i * 3 + 1] = 212 / 255;
            colors[i * 3 + 2] = 1;
        } else {
            colors[i * 3] = 139 / 255;
            colors[i * 3 + 1] = 92 / 255;
            colors[i * 3 + 2] = 246 / 255;
        }

        alphas[i] = Math.random() * 0.3 + 0.05;

        velocities[i * 3] = (Math.random() - 0.5) * 0.001;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.001;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    const particleMaterial = new THREE.PointsMaterial({
        size: 1,
        vertexColors: true,
        transparent: true,
        opacity: 0.6,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);
    particles.push(particleSystem);

    // Connection lines between particles (subtle)
    const lineGeometry = new THREE.BufferGeometry();
    const linePositions = [];
    const lineColors = [];
    const connectionDistance = 0.8;
    const maxConnections = 3000;
    let connectionCount = 0;

    for (let i = 0; i < particleCount; i++) {
        for (let j = i + 1; j < particleCount && connectionCount < maxConnections; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if (dist < connectionDistance) {
                linePositions.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
                linePositions.push(positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]);
                lineColors.push(0, 212 / 255, 1, 0.05);
                lineColors.push(0, 212 / 255, 1, 0.05);
                connectionCount++;
            }
        }
    }

    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeometry.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 4));

    const lineMaterial = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const lineSystem = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSystem);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00d4ff, 1.2, 10);
    pointLight1.position.set(3, 3, 3);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x8b5cf6, 1.2, 10);
    pointLight2.position.set(-3, -2, 2);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 0.6, 10);
    pointLight3.position.set(0, 5, 5);
    scene.add(pointLight3);

    // Scroll tracking
    let scrollY = 0;
    let targetScrollY = 0;
    let scrollProgress = 0;

    // Mouse interaction
    const mouse = new THREE.Vector2(-10, -10);
    const raycaster = new THREE.Raycaster();

    function onMouseMove(event) {
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function onTouchMove(event) {
        if (event.touches.length > 0) {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((event.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
        }
    }

    function onMouseLeave() {
        mouse.set(-10, -10);
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Scroll handler
    function onScroll() {
        scrollY = window.pageYOffset;
        const heroHeight = document.getElementById('home').offsetHeight;
        targetScrollY = scrollY;
        scrollProgress = Math.min(scrollY / (heroHeight * 0.8), 1.5);
    }

    window.addEventListener('scroll', onScroll, { passive: true });

    // Resize handler
    function onResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();

        renderer.setSize(width, height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    window.addEventListener('resize', onResize);

    // Animation loop
    let time = 0;
    let lastTime = 0;

    function animate(currentTime) {
        requestAnimationFrame(animate);

        const deltaTime = (currentTime - lastTime) * 0.001;
        lastTime = currentTime;
        time += deltaTime;

        // Smooth scroll interpolation
        scrollY += (targetScrollY - scrollY) * 0.1;

        // Camera movement based on scroll
        camera.position.y = scrollY * 0.0008;
        camera.position.z = 5 + scrollProgress * 2;

        // Rotate objects based on scroll
        objects.forEach((obj, i) => {
            const ud = obj.userData;

            // Base rotation
            obj.rotation.x += ud.speed.x * 60 * deltaTime;
            obj.rotation.y += ud.speed.y * 60 * deltaTime;
            obj.rotation.z += ud.speed.z * 60 * deltaTime;

            // Scroll-based rotation boost
            const scrollRotation = scrollProgress * (i % 2 === 0 ? 1 : -1) * 0.3;
            obj.rotation.y += scrollRotation * deltaTime * 1.5;

            // Floating animation
            obj.position.y = ud.basePosition.y + Math.sin(time * ud.floatSpeed + ud.floatOffset) * ud.floatAmplitude;
            obj.position.x = ud.basePosition.x + Math.cos(time * ud.floatSpeed * 0.7 + ud.floatOffset) * ud.floatAmplitude * 0.5;

            // Mouse interaction
            const mouseInfluence = 0.15;
            obj.position.x += (mouse.x * 0.3 - obj.position.x) * mouseInfluence * 0.01;
            obj.position.y += (-mouse.y * 0.3 - obj.position.y) * mouseInfluence * 0.01;
        });

        // Animate particles
        const posAttr = particleGeometry.getAttribute('position');
        const alphaAttr = particleGeometry.getAttribute('alpha');

        for (let i = 0; i < particleCount; i++) {
            // Gentle drift
            posAttr.array[i * 3] += velocities[i * 3] * 60 * deltaTime;
            posAttr.array[i * 3 + 1] += velocities[i * 3 + 1] * 60 * deltaTime;
            posAttr.array[i * 3 + 2] += velocities[i * 3 + 2] * 60 * deltaTime;

            // Scroll influence on particles
            posAttr.array[i * 3 + 1] -= scrollProgress * 0.0005;

            // Mouse attraction
            const mx = mouse.x * 4;
            const my = -mouse.y * 4;
            const dx = mx - posAttr.array[i * 3];
            const dy = my - posAttr.array[i * 3 + 1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 2 && dist > 0) {
                const force = (2 - dist) * 0.001;
                posAttr.array[i * 3] += dx * force;
                posAttr.array[i * 3 + 1] += dy * force;
            }

            // Boundary wrap
            if (posAttr.array[i * 3 + 2] < -6) posAttr.array[i * 3 + 2] = 6;
            if (posAttr.array[i * 3 + 2] > 6) posAttr.array[i * 3 + 2] = -6;

            // Pulsing alpha
            alphaAttr.array[i] = 0.1 + 0.35 * (0.5 + 0.5 * Math.sin(time * 2 + i * 0.1));
        }

        posAttr.needsUpdate = true;
        alphaAttr.needsUpdate = true;

        // Rotate particle system slowly
        particleSystem.rotation.y += 0.0001;
        particleSystem.rotation.x += 0.00005;
        lineSystem.rotation.y += 0.0001;
        lineSystem.rotation.x += 0.00005;

        // Animate lights
        pointLight1.position.x = Math.sin(time * 0.3) * 4;
        pointLight1.position.z = Math.cos(time * 0.3) * 4;
        pointLight2.position.x = Math.cos(time * 0.2) * 4;
        pointLight2.position.z = Math.sin(time * 0.2) * 4;

        // Update glow position
        if (glow) {
            glow.style.opacity = 0.3 + 0.2 * Math.sin(time * 0.5);
        }

        renderer.render(scene, camera);
    }

    requestAnimationFrame(animate);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        canvas.removeEventListener('mousemove', onMouseMove);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('mouseleave', onMouseLeave);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
        renderer.dispose();
        geometries.forEach(g => g.geometry.dispose());
        particleGeometry.dispose();
        lineGeometry.dispose();
        particleMaterial.dispose();
        lineMaterial.dispose();
    });
})();

/* ========================================
   PAGE LOADER
   ======================================== */
window.addEventListener('load', function () {
    setTimeout(function () {
        var loader = document.getElementById('pageLoader');
        if (loader) loader.classList.add('hidden');
    }, 600);
});

/* ========================================
   NAVIGATION
   ======================================== */
var nav = document.getElementById('nav');
var navToggle = document.getElementById('navToggle');
var mobileMenu = document.getElementById('mobileMenu');
var navLinks = document.querySelectorAll('.nav-link');
var mobileLinks = document.querySelectorAll('.mobile-link');
var sections = document.querySelectorAll('.section, .hero');

var lastScroll = 0;
window.addEventListener('scroll', function () {
    var scrollY = window.pageYOffset;

    if (scrollY > 50) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }

    lastScroll = scrollY;
});

if (navToggle) {
    navToggle.addEventListener('click', function () {
        navToggle.classList.toggle('open');
        mobileMenu.classList.toggle('open');
        document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
    });
}

mobileLinks.forEach(function (link) {
    link.addEventListener('click', function () {
        navToggle.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
    });
});

function updateActiveNav() {
    var scrollY = window.pageYOffset + 100;
    sections.forEach(function (section) {
        var top = section.offsetTop;
        var height = section.offsetHeight;
        var id = section.getAttribute('id');
        if (scrollY >= top && scrollY < top + height) {
            navLinks.forEach(function (link) {
                link.classList.remove('active');
                if (link.getAttribute('href') === '#' + id) {
                    link.classList.add('active');
                }
            });
        }
    });
}

window.addEventListener('scroll', updateActiveNav);

/* ========================================
   SCROLL PROGRESS
   ======================================== */
var scrollProgress = document.getElementById('scrollProgress');
window.addEventListener('scroll', function () {
    var scrollTop = window.pageYOffset;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    var progress = (scrollTop / docHeight) * 100;
    scrollProgress.style.width = progress + '%';
});

/* ========================================
   BACK TO TOP
   ======================================== */
var backToTop = document.getElementById('backToTop');
window.addEventListener('scroll', function () {
    if (window.pageYOffset > 600) {
        backToTop.classList.add('visible');
    } else {
        backToTop.classList.remove('visible');
    }
});

if (backToTop) {
    backToTop.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ========================================
   SCROLL REVEAL (Enhanced)
   ======================================== */
var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveal() {
    var reveals = document.querySelectorAll('.reveal');

    if (prefersReducedMotion) {
        reveals.forEach(function (el) { el.classList.add('visible'); });
        return;
    }

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var delay = parseFloat(entry.target.style.getPropertyValue('--delay')) || 0;
                entry.target.style.transitionDelay = delay + 's';
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(function (el) { observer.observe(el); });
}

initReveal();

/* ========================================
   COUNTER ANIMATION
   ======================================== */
var counters = document.querySelectorAll('.stat-number[data-count]');
var counterObserved = false;

function animateCounters() {
    counters.forEach(function (counter) {
        var target = parseInt(counter.getAttribute('data-count'), 10);
        var current = 0;
        var increment = target / 40;
        var timer = setInterval(function () {
            current += increment;
            if (current >= target) {
                counter.textContent = target + '+';
                clearInterval(timer);
            } else {
                counter.textContent = Math.floor(current) + '+';
            }
        }, 35);
    });
}

if (counters.length > 0) {
    var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting && !counterObserved) {
                counterObserved = true;
                animateCounters();
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counterObserver.observe(counters[0].closest('.about-stats'));
}

/* ========================================
   PROJECT FILTERING
   ======================================== */
var filterBtns = document.querySelectorAll('.filter-btn');
var projectCards = document.querySelectorAll('.project-card');

filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');

        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        projectCards.forEach(function (card, index) {
            var categories = card.getAttribute('data-categories');
            if (filter === 'all' || categories.indexOf(filter) !== -1) {
                card.classList.remove('hidden');
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px) scale(0.95)';
                requestAnimationFrame(function () {
                    requestAnimationFrame(function () {
                        card.style.transition = 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
                        card.style.transitionDelay = (index * 0.05) + 's';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0) scale(1)';
                    });
                });
            } else {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px) scale(0.95)';
                setTimeout(function () { card.classList.add('hidden'); }, 300);
            }
        });
    });
});

/* ========================================
   SECURITY FLOW ANIMATION
   ======================================== */
(function () {
    if (prefersReducedMotion) return;

    var flowItems = document.querySelectorAll('.sec-flow-item');
    var flowObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                flowItems.forEach(function (item, index) {
                    setTimeout(function () {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0) scale(1)';
                    }, index * 100);
                });
                flowObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    if (flowItems.length > 0) {
        flowItems.forEach(function (item) {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px) scale(0.95)';
            item.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        });
        flowObserver.observe(flowItems[0].parentElement);
    }
})();

/* ========================================
   AI FLOW ANIMATION
   ======================================== */
(function () {
    if (prefersReducedMotion) return;

    var aiItems = document.querySelectorAll('.ai-flow-item');
    var aiObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                aiItems.forEach(function (item, index) {
                    setTimeout(function () {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0) scale(1)';
                    }, index * 80);
                });
                aiObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    if (aiItems.length > 0) {
        aiItems.forEach(function (item) {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px) scale(0.95)';
            item.style.transition = 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        });
        aiObserver.observe(aiItems[0].parentElement);
    }
})();

/* ========================================
   CERTIFICATION CARD HOVER GLOW
   ======================================== */
document.querySelectorAll('.cert-card.featured').forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        card.style.background = 'radial-gradient(circle 250px at ' + x + 'px ' + y + 'px, rgba(0, 212, 255, 0.08), var(--bg-card))';
    });

    card.addEventListener('mouseleave', function () {
        card.style.background = 'linear-gradient(135deg, var(--bg-card), rgba(0, 212, 255, 0.03))';
    });
});

/* ========================================
   PARALLAX EFFECTS ON SCROLL
   ======================================== */
(function () {
    if (prefersReducedMotion) return;

    var parallaxElements = document.querySelectorAll('[data-parallax]');

    window.addEventListener('scroll', function () {
        var scrollY = window.pageYOffset;

        parallaxElements.forEach(function (el) {
            var speed = parseFloat(el.getAttribute('data-parallax')) || 0.3;
            var yPos = scrollY * speed;
            el.style.transform = 'translate3d(0, ' + yPos + 'px, 0)';
        });
    }, { passive: true });
})();

/* ========================================
   SMOOTH SCROLL FOR ANCHOR LINKS
   ======================================== */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
        var targetId = this.getAttribute('href');
        if (targetId === '#') return;
        var target = document.querySelector(targetId);
        if (target) {
            e.preventDefault();
            var offset = 80;
            var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    });
});

/* ========================================
   KEYBOARD NAVIGATION
   ======================================== */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        if (mobileMenu && mobileMenu.classList.contains('open')) {
            navToggle.classList.remove('open');
            mobileMenu.classList.remove('open');
            document.body.style.overflow = '';
        }
    }
});

/* ========================================
   MAGNETIC BUTTON EFFECT
   ======================================== */
if (!prefersReducedMotion) {
    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-outline').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            var rect = btn.getBoundingClientRect();
            var x = e.clientX - rect.left - rect.width / 2;
            var y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
        });

        btn.addEventListener('mouseleave', function () {
            btn.style.transform = 'translate(0, 0)';
        });
    });
}

/* ========================================
   TEXT REVEAL ANIMATION (Split Text)
   ======================================== */
(function () {
    if (prefersReducedMotion) return;

    var textElements = document.querySelectorAll('.section-title, .hero-line');

    textElements.forEach(function (el) {
        if (el.dataset.splitDone) return;
        var text = el.textContent;
        el.textContent = '';
        el.dataset.splitDone = 'true';

        var chars = text.split('');
        chars.forEach(function (char, i) {
            var span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char;
            span.style.display = 'inline-block';
            span.style.opacity = '0';
            span.style.transform = 'translateY(100%)';
            span.style.transition = 'opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
            span.style.transitionDelay = (i * 0.02) + 's';
            el.appendChild(span);
        });
    });

    var textObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                var spans = entry.target.querySelectorAll('span');
                spans.forEach(function (span, i) {
                    setTimeout(function () {
                        span.style.opacity = '1';
                        span.style.transform = 'translateY(0)';
                    }, i * 15);
                });
                textObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    textElements.forEach(function (el) { textObserver.observe(el); });
})();

/* ========================================
   SECTION 3D BACKGROUNDS
   ======================================== */
(function () {
    if (typeof THREE === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    const sections = document.querySelectorAll('[data-3d-bg]');
    if (!sections.length) return;

    const sectionScenes = new Map();

    function createSectionScene(section, type) {
        const container = section.querySelector('.container') || section;
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'section-3d-bg';
        canvasWrapper.style.position = 'absolute';
        canvasWrapper.style.inset = '0';
        canvasWrapper.style.pointerEvents = 'none';
        canvasWrapper.style.zIndex = '0';
        canvasWrapper.style.opacity = '0.12';
        section.insertBefore(canvasWrapper, section.firstChild);

        const canvas = document.createElement('canvas');
        canvasWrapper.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.z = 10;

        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setClearColor(0x000000, 0);

        const objects = [];
        const time = { value: 0 };

        // Create objects based on section type
        const createMaterial = (color, wireframe) => new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.2,
            roughness: 0.5,
            wireframe: wireframe,
            transparent: wireframe,
            opacity: wireframe ? 0.1 : 1,
            side: wireframe ? THREE.DoubleSide : THREE.FrontSide
        });

        if (type === 'cyber') {
            // Hexagon grid / network nodes
            for (let i = 0; i < 20; i++) {
                const geo = new THREE.CircleGeometry(0.3 + Math.random() * 0.3, 6);
                const mat = createMaterial(Math.random() > 0.5 ? 0x00d4ff : 0x8b5cf6, true);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 8 - 3
                );
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    speed: 0.1 + Math.random() * 0.2,
                    offset: Math.random() * Math.PI * 2,
                    rotSpeed: (Math.random() - 0.5) * 0.005
                };
                scene.add(mesh);
                objects.push(mesh);
            }
            // Connection lines
            const lineGeo = new THREE.BufferGeometry();
            const linePos = [];
            for (let i = 0; i < objects.length; i++) {
                for (let j = i + 1; j < objects.length; j++) {
                    const dx = objects[i].position.x - objects[j].position.x;
                    const dy = objects[i].position.y - objects[j].position.y;
                    const dz = objects[i].position.z - objects[j].position.z;
                    if (Math.sqrt(dx*dx + dy*dy + dz*dz) < 4) {
                        linePos.push(objects[i].position.x, objects[i].position.y, objects[i].position.z);
                        linePos.push(objects[j].position.x, objects[j].position.y, objects[j].position.z);
                    }
                }
            }
            lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePos, 3));
            const lineMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.15, depthWrite: false });
            const lines = new THREE.LineSegments(lineGeo, lineMat);
            scene.add(lines);
            objects.push(lines);
        } else if (type === 'ai') {
            // Neural network nodes
            for (let i = 0; i < 30; i++) {
                const geo = new THREE.SphereGeometry(0.15 + Math.random() * 0.15, 8, 8);
                const mat = createMaterial(Math.random() > 0.5 ? 0x8b5cf6 : 0x00d4ff, false);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 18,
                    (Math.random() - 0.5) * 14,
                    (Math.random() - 0.5) * 10 - 4
                );
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    speed: 0.05 + Math.random() * 0.15,
                    offset: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.5 + Math.random() * 1,
                    pulseAmp: 0.05 + Math.random() * 0.1
                };
                scene.add(mesh);
                objects.push(mesh);
            }
        } else if (type === 'skills') {
            // Floating polyhedrons
            const shapes = [
                () => new THREE.TetrahedronGeometry(0.4),
                () => new THREE.OctahedronGeometry(0.35),
                () => new THREE.IcosahedronGeometry(0.3),
                () => new THREE.BoxGeometry(0.5, 0.5, 0.5)
            ];
            for (let i = 0; i < 15; i++) {
                const geo = shapes[Math.floor(Math.random() * shapes.length)]();
                const mat = createMaterial(Math.random() > 0.5 ? 0x00d4ff : 0x8b5cf6, Math.random() > 0.5);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 16,
                    (Math.random() - 0.5) * 13,
                    (Math.random() - 0.5) * 8 - 3
                );
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    rotSpeed: new THREE.Euler(
                        (Math.random() - 0.5) * 0.003,
                        (Math.random() - 0.5) * 0.003,
                        (Math.random() - 0.5) * 0.003
                    ),
                    floatSpeed: 0.2 + Math.random() * 0.3,
                    floatAmp: 0.2 + Math.random() * 0.3,
                    offset: Math.random() * Math.PI * 2
                };
                scene.add(mesh);
                objects.push(mesh);
            }
        } else if (type === 'contact') {
            // Signal waves / particles
            const particleGeo = new THREE.BufferGeometry();
            const count = 200;
            const pos = new Float32Array(count * 3);
            const col = new Float32Array(count * 3);
            const size = new Float32Array(count);
            for (let i = 0; i < count; i++) {
                pos[i*3] = (Math.random() - 0.5) * 20;
                pos[i*3+1] = (Math.random() - 0.5) * 15;
                pos[i*3+2] = (Math.random() - 0.5) * 10 - 4;
                const c = Math.random() > 0.5 ? 0x00d4ff : 0x8b5cf6;
                col[i*3] = (c >> 16 & 255) / 255;
                col[i*3+1] = (c >> 8 & 255) / 255;
                col[i*3+2] = (c & 255) / 255;
                size[i] = Math.random() * 1.5 + 0.5;
            }
            particleGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            particleGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
            particleGeo.setAttribute('size', new Float32BufferAttribute(size, 1));
            const particleMat = new THREE.PointsMaterial({
                size: 1, vertexColors: true, transparent: true, opacity: 0.6,
                sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
            });
            const particles = new THREE.Points(particleGeo, particleMat);
            scene.add(particles);
            objects.push(particles);
            objects[0].userData = { isParticles: true, geo: particleGeo };
        } else if (type === 'experience') {
            // 3D Timeline with floating nodes and connecting lines
            const nodeCount = 8;
            for (let i = 0; i < nodeCount; i++) {
                const geo = new THREE.SphereGeometry(0.25 + Math.random() * 0.2, 16, 16);
                const mat = createMaterial(Math.random() > 0.5 ? 0x00d4ff : 0x8b5cf6, false);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 14,
                    (i - nodeCount/2) * 2.5 + (Math.random() - 0.5) * 1,
                    (Math.random() - 0.5) * 6 - 2
                );
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    floatSpeed: 0.3 + Math.random() * 0.4,
                    floatAmp: 0.3 + Math.random() * 0.3,
                    offset: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.8 + Math.random() * 1.2,
                    pulseAmp: 0.1 + Math.random() * 0.15
                };
                scene.add(mesh);
                objects.push(mesh);
            }
            // Connection lines between timeline nodes
            const lineGeo = new THREE.BufferGeometry();
            const linePos = [];
            for (let i = 0; i < objects.length; i++) {
                for (let j = i + 1; j < objects.length; j++) {
                    const dx = objects[i].position.x - objects[j].position.x;
                    const dy = objects[i].position.y - objects[j].position.y;
                    const dz = objects[i].position.z - objects[j].position.z;
                    const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                    if (dist < 3.5) {
                        linePos.push(objects[i].position.x, objects[i].position.y, objects[i].position.z);
                        linePos.push(objects[j].position.x, objects[j].position.y, objects[j].position.z);
                    }
                }
            }
            lineGeo.setAttribute('position', new Float32BufferAttribute(linePos, 3));
            const lineMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.12, depthWrite: false });
            const lines = new THREE.LineSegments(lineGeo, lineMat);
            scene.add(lines);
            objects.push(lines);
        } else if (type === 'projects') {
            // Floating code brackets and tech symbols
            const symbols = ['{ }', '< />', '[ ]', '( )', ';', '=>', '() =>', 'async'];
            for (let i = 0; i < 20; i++) {
                const geo = new THREE.BoxGeometry(0.6, 0.6, 0.15);
                const mat = createMaterial(Math.random() > 0.5 ? 0x00d4ff : 0x8b5cf6, Math.random() > 0.6);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 18,
                    (Math.random() - 0.5) * 14,
                    (Math.random() - 0.5) * 8 - 3
                );
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    rotSpeed: new THREE.Euler(
                        (Math.random() - 0.5) * 0.002,
                        (Math.random() - 0.5) * 0.003,
                        (Math.random() - 0.5) * 0.001
                    ),
                    floatSpeed: 0.15 + Math.random() * 0.25,
                    floatAmp: 0.4 + Math.random() * 0.5,
                    offset: Math.random() * Math.PI * 2
                };
                scene.add(mesh);
                objects.push(mesh);
            }
            // Floating particles around code symbols
            const particleGeo = new THREE.BufferGeometry();
            const pCount = 150;
            const pPos = new Float32Array(pCount * 3);
            const pCol = new Float32Array(pCount * 3);
            const pSize = new Float32Array(pCount);
            for (let i = 0; i < pCount; i++) {
                pPos[i*3] = (Math.random() - 0.5) * 20;
                pPos[i*3+1] = (Math.random() - 0.5) * 16;
                pPos[i*3+2] = (Math.random() - 0.5) * 10 - 4;
                const c = Math.random() > 0.5 ? 0x00d4ff : 0x8b5cf6;
                pCol[i*3] = (c >> 16 & 255) / 255;
                pCol[i*3+1] = (c >> 8 & 255) / 255;
                pCol[i*3+2] = (c & 255) / 255;
                pSize[i] = Math.random() * 1 + 0.3;
            }
            particleGeo.setAttribute('position', new Float32BufferAttribute(pPos, 3));
            particleGeo.setAttribute('color', new Float32BufferAttribute(pCol, 3));
            particleGeo.setAttribute('size', new Float32BufferAttribute(pSize, 1));
            const pMat = new THREE.PointsMaterial({
                size: 1, vertexColors: true, transparent: true, opacity: 0.4,
                sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
            });
            const particles = new THREE.Points(particleGeo, pMat);
            scene.add(particles);
            objects.push(particles);
            objects[objects.length-1].userData = { isParticles: true, geo: particleGeo, type: 'projects' };
        } else if (type === 'about') {
            // Floating geometric shapes around profile area
            const shapes = [
                () => new THREE.TorusGeometry(0.4, 0.12, 8, 16),
                () => new THREE.OctahedronGeometry(0.35),
                () => new THREE.IcosahedronGeometry(0.3),
                () => new THREE.ConeGeometry(0.3, 0.6, 5),
                () => new THREE.TetrahedronGeometry(0.3)
            ];
            for (let i = 0; i < 12; i++) {
                const geo = shapes[Math.floor(Math.random() * shapes.length)]();
                const mat = createMaterial(Math.random() > 0.5 ? 0x00d4ff : 0x8b5cf6, Math.random() > 0.4);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 6 - 2
                );
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    rotSpeed: new THREE.Euler(
                        (Math.random() - 0.5) * 0.004,
                        (Math.random() - 0.5) * 0.005,
                        (Math.random() - 0.5) * 0.003
                    ),
                    floatSpeed: 0.2 + Math.random() * 0.3,
                    floatAmp: 0.5 + Math.random() * 0.5,
                    offset: Math.random() * Math.PI * 2
                };
                scene.add(mesh);
                objects.push(mesh);
            }
            // Central glowing orb
            const coreGeo = new THREE.SphereGeometry(0.8, 32, 32);
            const coreMat = new THREE.MeshBasicMaterial({
                color: 0x00d4ff,
                transparent: true,
                opacity: 0.15,
                side: THREE.DoubleSide
            });
            const core = new THREE.Mesh(coreGeo, coreMat);
            core.position.set(0, 0, -1);
            core.userData = { isCore: true, pulseSpeed: 1.5, pulseAmp: 0.3 };
            scene.add(core);
            objects.push(core);
        } else if (type === 'certifications') {
            // Floating certificate-like cards and badges
            for (let i = 0; i < 10; i++) {
                const geo = new THREE.BoxGeometry(1.2, 0.9, 0.05);
                const mat = createMaterial(Math.random() > 0.5 ? 0x00d4ff : 0x8b5cf6, true);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 16,
                    (Math.random() - 0.5) * 12,
                    (Math.random() - 0.5) * 6 - 2
                );
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    rotSpeed: new THREE.Euler(
                        (Math.random() - 0.5) * 0.0015,
                        (Math.random() - 0.5) * 0.002,
                        0
                    ),
                    floatSpeed: 0.1 + Math.random() * 0.2,
                    floatAmp: 0.3 + Math.random() * 0.4,
                    offset: Math.random() * Math.PI * 2
                };
                scene.add(mesh);
                objects.push(mesh);
            }
            // Golden accent particles
            const particleGeo = new THREE.BufferGeometry();
            const pCount = 200;
            const pPos = new Float32Array(pCount * 3);
            const pCol = new Float32Array(pCount * 3);
            const pSize = new Float32Array(pCount);
            for (let i = 0; i < pCount; i++) {
                pPos[i*3] = (Math.random() - 0.5) * 18;
                pPos[i*3+1] = (Math.random() - 0.5) * 14;
                pPos[i*3+2] = (Math.random() - 0.5) * 8 - 3;
                pCol[i*3] = 1;
                pCol[i*3+1] = 0.85 + Math.random() * 0.15;
                pCol[i*3+2] = 0.2 + Math.random() * 0.3;
                pSize[i] = Math.random() * 1.5 + 0.5;
            }
            particleGeo.setAttribute('position', new Float32BufferAttribute(pPos, 3));
            particleGeo.setAttribute('color', new Float32BufferAttribute(pCol, 3));
            particleGeo.setAttribute('size', new Float32BufferAttribute(pSize, 1));
            const pMat = new THREE.PointsMaterial({
                size: 1, vertexColors: true, transparent: true, opacity: 0.5,
                sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
            });
            const particles = new THREE.Points(particleGeo, pMat);
            scene.add(particles);
            objects.push(particles);
            objects[objects.length-1].userData = { isParticles: true, geo: particleGeo, type: 'certifications' };
        } else if (type === 'beyond') {
            // Creative floating shapes - music notes, weights, guitar picks, etc.
            for (let i = 0; i < 15; i++) {
                const shapeType = Math.random();
                let geo;
                if (shapeType < 0.25) {
                    geo = new THREE.TorusGeometry(0.3, 0.08, 6, 12); // ring
                } else if (shapeType < 0.5) {
                    geo = new THREE.ConeGeometry(0.25, 0.7, 4); // guitar pick
                } else if (shapeType < 0.75) {
                    geo = new THREE.CylinderGeometry(0.15, 0.15, 0.8, 8); // dumbbell bar
                } else {
                    geo = new THREE.SphereGeometry(0.25, 12, 12); // music note head
                }
                const mat = createMaterial(Math.random() > 0.5 ? 0x8b5cf6 : 0x00d4ff, Math.random() > 0.5);
                const mesh = new THREE.Mesh(geo, mat);
                mesh.position.set(
                    (Math.random() - 0.5) * 18,
                    (Math.random() - 0.5) * 14,
                    (Math.random() - 0.5) * 8 - 3
                );
                mesh.userData = {
                    basePos: mesh.position.clone(),
                    rotSpeed: new THREE.Euler(
                        (Math.random() - 0.5) * 0.003,
                        (Math.random() - 0.5) * 0.004,
                        (Math.random() - 0.5) * 0.002
                    ),
                    floatSpeed: 0.15 + Math.random() * 0.25,
                    floatAmp: 0.6 + Math.random() * 0.6,
                    offset: Math.random() * Math.PI * 2
                };
                scene.add(mesh);
                objects.push(mesh);
            }
            // Flowing particle stream
            const particleGeo = new THREE.BufferGeometry();
            const pCount = 180;
            const pPos = new Float32Array(pCount * 3);
            const pCol = new Float32Array(pCount * 3);
            const pSize = new Float32Array(pCount);
            const pVel = new Float32Array(pCount * 3);
            for (let i = 0; i < pCount; i++) {
                pPos[i*3] = (Math.random() - 0.5) * 20;
                pPos[i*3+1] = (Math.random() - 0.5) * 16;
                pPos[i*3+2] = (Math.random() - 0.5) * 10 - 4;
                const c = Math.random() > 0.5 ? 0x8b5cf6 : 0x00d4ff;
                pCol[i*3] = (c >> 16 & 255) / 255;
                pCol[i*3+1] = (c >> 8 & 255) / 255;
                pCol[i*3+2] = (c & 255) / 255;
                pSize[i] = Math.random() * 1.2 + 0.4;
                pVel[i*3] = (Math.random() - 0.5) * 0.002;
                pVel[i*3+1] = (Math.random() - 0.5) * 0.002;
                pVel[i*3+2] = (Math.random() - 0.5) * 0.002;
            }
            particleGeo.setAttribute('position', new Float32BufferAttribute(pPos, 3));
            particleGeo.setAttribute('color', new Float32BufferAttribute(pCol, 3));
            particleGeo.setAttribute('size', new Float32BufferAttribute(pSize, 1));
            particleGeo.setAttribute('velocity', new Float32BufferAttribute(pVel, 3));
            const pMat = new THREE.PointsMaterial({
                size: 1, vertexColors: true, transparent: true, opacity: 0.45,
                sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
            });
            const particles = new THREE.Points(particleGeo, pMat);
            scene.add(particles);
            objects.push(particles);
            objects[objects.length-1].userData = { isParticles: true, geo: particleGeo, type: 'beyond', velocities: pVel };
        }

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const light1 = new THREE.PointLight(0x00d4ff, 0.8, 20);
        light1.position.set(5, 5, 5);
        scene.add(light1);
        const light2 = new THREE.PointLight(0x8b5cf6, 0.8, 20);
        light2.position.set(-5, -3, 3);
        scene.add(light2);

        function animate() {
            requestAnimationFrame(animate);
            time.value += 0.016;

            objects.forEach(obj => {
                if (obj.userData.isParticles) {
                    const positions = obj.userData.geo.getAttribute('position');
                    const type = obj.userData.type || 'default';
                    
                    if (type === 'projects' || type === 'certifications') {
                        // Gentle floating for project/cert particles
                        for (let i = 0; i < positions.count; i++) {
                            positions.array[i*3+1] += Math.sin(time.value * 1.5 + i * 0.1) * 0.0015;
                            positions.array[i*3] += Math.cos(time.value * 1.2 + i * 0.1) * 0.001;
                            positions.array[i*3+2] += Math.sin(time.value * 0.8 + i * 0.1) * 0.0005;
                        }
                    } else if (type === 'beyond') {
                        // Flowing stream with velocity
                        const velocities = obj.userData.velocities;
                        for (let i = 0; i < positions.count; i++) {
                            positions.array[i*3] += velocities[i*3];
                            positions.array[i*3+1] += velocities[i*3+1];
                            positions.array[i*3+2] += velocities[i*3+2];
                            // Wave motion
                            positions.array[i*3+1] += Math.sin(time.value * 2 + i * 0.15) * 0.002;
                            positions.array[i*3] += Math.cos(time.value * 1.8 + i * 0.15) * 0.0015;
                            
                            // Wrap around
                            if (positions.array[i*3] > 10) positions.array[i*3] = -10;
                            if (positions.array[i*3] < -10) positions.array[i*3] = 10;
                            if (positions.array[i*3+1] > 8) positions.array[i*3+1] = -8;
                            if (positions.array[i*3+1] < -8) positions.array[i*3+1] = 8;
                            if (positions.array[i*3+2] > 3) positions.array[i*3+2] = -6;
                            if (positions.array[i*3+2] < -6) positions.array[i*3+2] = 3;
                        }
                    } else {
                        // Default contact particles
                        for (let i = 0; i < positions.count; i++) {
                            positions.array[i*3+1] += Math.sin(time.value * 2 + i * 0.1) * 0.002;
                            positions.array[i*3] += Math.cos(time.value * 1.5 + i * 0.1) * 0.001;
                        }
                    }
                    positions.needsUpdate = true;
                    obj.rotation.y += 0.0001;
                } else if (obj.userData.isCore) {
                    // Pulsing core orb
                    const scale = 1 + Math.sin(time.value * obj.userData.pulseSpeed) * obj.userData.pulseAmp;
                    obj.scale.setScalar(scale);
                    obj.rotation.y += 0.0005;
                    obj.rotation.x += 0.0003;
                } else {
                    obj.rotation.x += obj.userData.rotSpeed?.x || 0;
                    obj.rotation.y += obj.userData.rotSpeed?.y || 0;
                    obj.rotation.z += obj.userData.rotSpeed?.z || 0;
                    if (obj.userData.floatSpeed) {
                        obj.position.y = obj.userData.basePos.y + Math.sin(time.value * obj.userData.floatSpeed + obj.userData.offset) * obj.userData.floatAmp;
                        obj.position.x = obj.userData.basePos.x + Math.cos(time.value * obj.userData.floatSpeed * 0.7 + obj.userData.offset) * obj.userData.floatAmp * 0.5;
                    }
                    if (obj.userData.pulseSpeed) {
                        const scale = 1 + Math.sin(time.value * obj.userData.pulseSpeed) * obj.userData.pulseAmp;
                        obj.scale.setScalar(scale);
                    }
                }
            });

            // Slow camera drift
            camera.position.x = Math.sin(time.value * 0.05) * 0.5;
            camera.position.y = Math.cos(time.value * 0.03) * 0.3;

            renderer.render(scene, camera);
        }

        animate();

        return { scene, camera, renderer, canvasWrapper, container };
    }

    sections.forEach(section => {
        const type = section.getAttribute('data-3d-bg');
        const sceneData = createSectionScene(section, type);
        sectionScenes.set(section, sceneData);
    });

    // Handle resize
    function onResize() {
        sectionScenes.forEach((data, section) => {
            const { camera, renderer, container } = data;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

    window.addEventListener('resize', onResize);

    // Cleanup
    window.addEventListener('beforeunload', () => {
        window.removeEventListener('resize', onResize);
        sectionScenes.forEach(data => {
            data.renderer.dispose();
            data.scene.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        });
    });
})();