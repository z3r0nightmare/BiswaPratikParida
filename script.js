const canvasContainer = document.getElementById('canvas-container');
let scene, camera, renderer, particles, particleGeometry, particleMaterial;
const character = '0'; // Single character for consistency

// Create texture for the character
function createTexture(char) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 64;
  context.fillStyle = '#00ffaa';
  context.font = '48px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(char, canvas.width / 2, canvas.height / 2);
  return new THREE.CanvasTexture(canvas);
}

function initBackground() {
  try {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 1000;

    particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const numParticles = 500; // Reduced density
    const particleSpreadX = window.innerWidth * 2;
    const particleSpreadY = window.innerHeight * 2;

    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * particleSpreadX - particleSpreadX / 2;
      const y = Math.random() * particleSpreadY - particleSpreadY / 2;
      const z = Math.random() * 1000 - 500;
      positions.push(x, y, z);
      colors.push(0, 1, 0.5); // Green color
    }

    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    particleMaterial = new THREE.PointsMaterial({
      size: 30,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      map: createTexture(character)
    });

    particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    canvasContainer.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResizeBackground);
    console.log('Number rain initialized successfully');
  } catch (error) {
    console.error('Error initializing number rain:', error);
  }
}

function onWindowResizeBackground() {
  try {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const positions = particleGeometry.attributes.position.array;
    const particleSpreadX = window.innerWidth * 2;
    const particleSpreadY = window.innerHeight * 2;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] = Math.random() * particleSpreadX - particleSpreadX / 2;
      positions[i + 1] = Math.random() * particleSpreadY - particleSpreadY / 2;
    }
    particleGeometry.attributes.position.needsUpdate = true;
  } catch (error) {
    console.error('Error resizing number rain:', error);
  }
}

function animateBackground() {
  requestAnimationFrame(animateBackground);
  try {
    const positions = particleGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 0.5; // Slower fall speed
      if (positions[i + 1] < -window.innerHeight) {
        positions[i + 1] = window.innerHeight;
      }
    }
    particleGeometry.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  } catch (error) {
    console.error('Error animating number rain:', error);
  }
}

// Zero Model with Exploding Effect
const zeroViewer = document.getElementById('zero-viewer');
let zeroScene, zeroCamera, zeroRenderer, zeroMesh, zeroHover = false;

function initZeroViewer() {
  zeroScene = new THREE.Scene();
  zeroCamera = new THREE.PerspectiveCamera(75, zeroViewer.clientWidth / zeroViewer.clientHeight, 0.1, 1000);
  zeroCamera.position.z = 5;

  zeroRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  zeroRenderer.setSize(zeroViewer.clientWidth, zeroViewer.clientHeight);
  zeroViewer.appendChild(zeroRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  zeroScene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5).normalize();
  zeroScene.add(directionalLight);

  const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uHover: { value: 0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uHover;
      attribute vec3 centroid;
      attribute vec3 direction;
      varying vec2 vUv;
      void main() {
        vec3 pos = position;
        float progress = uHover * sin(uTime * 2.0);
        pos += direction * progress * 0.5;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        vUv = uv;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        gl_FragColor = vec4(0.0, 1.0, 0.5, 1.0);
      }
    `,
    side: THREE.DoubleSide
  });

  const vertices = geometry.attributes.position.array;
  const centroids = new Float32Array(vertices.length);
  const directions = new Float32Array(vertices.length);
  for (let i = 0; i < vertices.length; i += 3) {
    centroids[i] = 0; centroids[i + 1] = 0; centroids[i + 2] = 0;
    directions[i] = vertices[i];
    directions[i + 1] = vertices[i + 1];
    directions[i + 2] = vertices[i + 2];
  }
  geometry.setAttribute('centroid', new THREE.BufferAttribute(centroids, 3));
  geometry.setAttribute('direction', new THREE.BufferAttribute(directions, 3));

  zeroMesh = new THREE.Mesh(geometry, material);
  zeroScene.add(zeroMesh);

  zeroViewer.addEventListener('mouseenter', () => zeroHover = true);
  zeroViewer.addEventListener('mouseleave', () => zeroHover = false);

  window.addEventListener('resize', onWindowResizeZero);
}

function onWindowResizeZero() {
  zeroCamera.aspect = zeroViewer.clientWidth / zeroViewer.clientHeight;
  zeroCamera.updateProjectionMatrix();
  zeroRenderer.setSize(zeroViewer.clientWidth, zeroViewer.clientHeight);
}

function animateZero() {
  requestAnimationFrame(animateZero);
  zeroMesh.rotation.y += 0.01;
  zeroMesh.material.uniforms.uTime.value += 0.05;
  zeroMesh.material.uniforms.uHover.value = zeroHover ? 1.0 : 0.0;
  zeroRenderer.render(zeroScene, zeroCamera);
}

// 3D Model Viewer Carousel
const modelViewer = document.getElementById('modelViewer');
let modelScene, modelCamera, modelRenderer, modelControls;
const models = [
  { file: 'ImageToStl.com_robocon_drumbot v1.glb', desc: 'Robotics model built in Fusion 360.' },
  { file: 'ImageToStl.com_katanaforzip.glb', desc: 'Cyberpunk katana designed in Fusion 360.' },
];
let currentModelIndex = 0;
let currentModel = null;

function initModelViewer() {
  modelScene = new THREE.Scene();
  modelCamera = new THREE.PerspectiveCamera(75, modelViewer.clientWidth / modelViewer.clientHeight, 0.1, 1000);
  modelCamera.position.z = 100;

  modelRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  modelRenderer.setSize(modelViewer.clientWidth, modelViewer.clientHeight);
  modelViewer.appendChild(modelRenderer.domElement);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  modelScene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5).normalize();
  modelScene.add(directionalLight);

  loadModel(currentModelIndex);

  modelControls = new THREE.OrbitControls(modelCamera, modelRenderer.domElement);
  modelControls.enableDamping = true;
  modelControls.dampingFactor = 0.05;
  modelControls.minDistance = 50;
  modelControls.maxDistance = 200;

  window.addEventListener('resize', onWindowResizeModel);
}

function loadModel(index) {
  if (currentModel) modelScene.remove(currentModel);
  const loader = new THREE.GLTFLoader();
  loader.load(
    models[index].file,
    (gltf) => {
      currentModel = gltf.scene;
      currentModel.scale.set(5, 5, 5);
      currentModel.position.set(0, 0, 0);
      modelScene.add(currentModel);
      document.getElementById('modelDescription').textContent = models[index].desc;
      console.log('Model loaded:', models[index].file);
    },
    (xhr) => console.log((xhr.loaded / xhr.total * 100) + '% loaded'),
    (error) => console.error('Error loading model:', error)
  );
}

function onWindowResizeModel() {
  modelCamera.aspect = modelViewer.clientWidth / modelViewer.clientHeight;
  modelCamera.updateProjectionMatrix();
  modelRenderer.setSize(modelViewer.clientWidth, modelViewer.clientHeight);
}

function animateModel() {
  requestAnimationFrame(animateModel);
  modelControls.update();
  modelRenderer.render(modelScene, modelCamera);
}

function prevModel() {
  currentModelIndex = (currentModelIndex - 1 + models.length) % models.length;
  loadModel(currentModelIndex);
}

function nextModel() {
  currentModelIndex = (currentModelIndex + 1) % models.length;
  loadModel(currentModelIndex);
}

// Filmmaking Carousel
const filmContent = document.getElementById('filmContent');
const films = [
  { title: 'Film Reel (@secr0ti)', desc: 'Short films and edits showcasing my storytelling—shot and polished by me. <a href="https://instagram.com/secr0ti">View on Instagram</a>.', tags: ['Filmmaking', 'Video Editing'] },
];
let currentFilmIndex = 0;

function updateFilm() {
  filmContent.innerHTML = `
    <h3>${films[currentFilmIndex].title}</h3>
    <p>${films[currentFilmIndex].desc}</p>
    <div class="project-tags">
      ${films[currentFilmIndex].tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
    </div>
  `;
}

function prevFilm() {
  currentFilmIndex = (currentFilmIndex - 1 + films.length) % films.length;
  updateFilm();
}

function nextFilm() {
  currentFilmIndex = (currentFilmIndex + 1) % films.length;
  updateFilm();
}

// Cybersecurity Carousel
const cyberContent = document.getElementById('cyberContent');
const cyberProjects = [
  { title: 'Network Scanner', desc: 'A Python script to sniff out network vulnerabilities—cybersecurity meets code.', tags: ['Cybersecurity', 'Python', 'Linux'] },
];
let currentCyberIndex = 0;

function updateCyber() {
  cyberContent.innerHTML = `
    <h3>${cyberProjects[currentCyberIndex].title}</h3>
    <p>${cyberProjects[currentCyberIndex].desc}</p>
    <div class="project-tags">
      ${cyberProjects[currentCyberIndex].tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
    </div>
  `;
}

function prevCyber() {
  currentCyberIndex = (currentCyberIndex - 1 + cyberProjects.length) % cyberProjects.length;
  updateCyber();
}

function nextCyber() {
  currentCyberIndex = (currentCyberIndex + 1) % cyberProjects.length;
  updateCyber();
}

// Robotics Carousel
const robotContent = document.getElementById('robotContent');
const robotProjects = [
  { title: 'Robotics Tinker', desc: '3D modeled parts for a robotics project using Fusion 360—still in the works!', tags: ['Fusion 360', 'Robotics'] },
];
let currentRobotIndex = 0;

function updateRobot() {
  robotContent.innerHTML = `
    <h3>${robotProjects[currentRobotIndex].title}</h3>
    <p>${robotProjects[currentRobotIndex].desc}</p>
    <div class="project-tags">
      ${robotProjects[currentRobotIndex].tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
    </div>
  `;
}

function prevRobot() {
  currentRobotIndex = (currentRobotIndex - 1 + robotProjects.length) % robotProjects.length;
  updateRobot();
}

function nextRobot() {
  currentRobotIndex = (currentRobotIndex + 1) % robotProjects.length;
  updateRobot();
}

// Scroll Animation
document.addEventListener('DOMContentLoaded', function() {
  const fadeElements = document.querySelectorAll('.fade-in');
  const header = document.getElementById('header');
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85;
  }
  function handleScrollAnimation() {
    fadeElements.forEach(element => {
      if (isInViewport(element)) element.classList.add('visible');
    });
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    if (window.scrollY > 100) header.classList.add('hide');
    else header.classList.remove('hide');
  }
  handleScrollAnimation();
  window.addEventListener('scroll', handleScrollAnimation);
});

// Initialize Everything
initBackground();
animateBackground();
initZeroViewer();
animateZero();
initModelViewer();
animateModel();
updateFilm();
updateCyber();
updateRobot();