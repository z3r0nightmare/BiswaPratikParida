const canvasContainer = document.getElementById('canvas-container');
let scene, camera, renderer, particles, particleGeometry, particleMaterial;
const character = '0';
let sectionCubes = {};
const MOVE_WITH_ZEROS = false; // Fixed z for manual control
let cameraMixer; // Animation mixer for camera only
const clock = new THREE.Clock(); // For animation updates

// Create texture for the character
function createTexture(char) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 64;
  canvas.height = 64;
  context.fillStyle = '#ffffff';
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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 1000;

    // Add global lighting for 3D models
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5).normalize();
    scene.add(directionalLight);

    particleGeometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const numParticles = 500;
    const particleSpreadX = window.innerWidth * 2;
    const particleSpreadY = window.innerHeight * 2;
    const particleSpreadZ = 2000;

    for (let i = 0; i < numParticles; i++) {
      const x = Math.random() * particleSpreadX - particleSpreadX / 2;
      const y = Math.random() * particleSpreadY - particleSpreadY / 2;
      const z = Math.random() * particleSpreadZ - particleSpreadZ / 2;
      positions.push(x, y, z);
      colors.push(1, 1, 1);
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

    initSectionCubes();

    window.addEventListener('resize', onWindowResizeBackground);
    window.addEventListener('scroll', onScrollBackground);
    console.log('Number rain initialized successfully');
    console.log('Scene initialized:', scene);
    console.log('Renderer initialized:', renderer);
  } catch (error) {
    console.error('Error initializing number rain:', error);
  }
}

function initSectionCubes() {
  const sections = ['about', 'models', 'filmmaking', 'cybersecurity', 'robotics', 'contact'];
  const cubeGeometry = new THREE.BoxGeometry(50, 50, 50);
  const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
  const loader = new THREE.GLTFLoader();

  sections.forEach(section => {
    try {
      if (section === 'filmmaking') {
        // Load 3D models for Filmmaking section
        loader.load(
          'camera.glb',
          (gltf) => {
            const leftModel = gltf.scene;
            leftModel.scale.set(375, 375, 375);
            leftModel.position.set(-300, 0, camera.position.z - 300);
            // Log model details
            console.log('Camera model:', leftModel);
            console.log('Camera position:', leftModel.position);
            console.log('Camera visible:', leftModel.visible);
            const box = new THREE.Box3().setFromObject(leftModel);
            console.log('Camera bounding box:', box.min, box.max);
            leftModel.traverse((child) => {
              if (child.isMesh) {
                console.log('Camera mesh:', child.name, 'Material:', child.material);
                child.material = child.material || new THREE.MeshStandardMaterial({ color: 0x333333 });
                child.material.needsUpdate = true;
              }
            });
            // Set up animation
            cameraMixer = new THREE.AnimationMixer(leftModel);
            const animations = gltf.animations;
            console.log('Camera animations:', animations);
            if (animations.length > 0) {
              const action = cameraMixer.clipAction(animations[0]);
              action.play();
            }
            scene.add(leftModel);
            // Add point light for camera model
            const cameraLight = new THREE.PointLight(0xffffff, 2.0, 500);
            cameraLight.position.set(-250, 0, camera.position.z - 300);
            scene.add(cameraLight);
            sectionCubes[section] = sectionCubes[section] || {};
            sectionCubes[section].left = leftModel;
            sectionCubes[section].cameraLight = cameraLight;
            console.log('Camera model loaded for Filmmaking section');
          },
          (xhr) => console.log(`Loading camera.glb: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`),
          (error) => {
            console.error('Error loading camera.glb:', error);
            console.error('Check file path (camera.glb), file integrity, or server MIME types');
          }
        );
        loader.load(
          'go-pro.glb',
          (gltf) => {
            const rightModel = gltf.scene;
            rightModel.scale.set(10, 10, 10);
            rightModel.position.set(300, 0, camera.position.z - 300);
            // Log model details
            console.log('GoPro model:', rightModel);
            console.log('GoPro position:', rightModel.position);
            console.log('GoPro rendering at right (300, yPos, zPos), should match original materials');
            const box = new THREE.Box3().setFromObject(rightModel);
            console.log('GoPro bounding box:', box.min, box.max);
            rightModel.traverse((child) => {
              if (child.isMesh) {
                console.log('GoPro mesh:', child.name, 'Material:', child.material);
                child.material = child.material || new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5, roughness: 0.5 });
                if (child.name.toLowerCase().includes('lens')) {
                  child.material = new THREE.MeshPhysicalMaterial({
                    transparent: true,
                    opacity: 0.2,
                    transmission: 0.95,
                    roughness: 0.05,
                    metalness: 0.1,
                    color: 0x000000,
                    side: THREE.DoubleSide,
                    depthWrite: false
                  });
                }
                child.material.needsUpdate = true;
              }
            });
            // Add point light for GoPro
            const pointLight = new THREE.PointLight(0xffffff, 0.8, 500);
            pointLight.position.set(350, 0, camera.position.z - 300);
            scene.add(pointLight);
            sectionCubes[section] = sectionCubes[section] || {};
            sectionCubes[section].pointLight = pointLight;
            scene.add(rightModel);
            sectionCubes[section].right = rightModel;
            console.log('GoPro model loaded for Filmmaking section');
          },
          (xhr) => console.log(`Loading go-pro.glb: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`),
          (error) => {
            console.error('Error loading go-pro.glb:', error);
            console.error('Check file path (go-pro.glb), file integrity, or server MIME types');
          }
        );
      } else {
        // Use cubes for other sections
        const leftCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        const rightCube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        scene.add(leftCube, rightCube);
        sectionCubes[section] = { left: leftCube, right: rightCube };
      }
    } catch (error) {
      console.error(`Error initializing section ${section}:`, error);
    }
  });
}

function updateCubePositions() {
  const sections = ['about', 'models', 'filmmaking', 'cybersecurity', 'robotics', 'contact'];
  const isMobile = window.innerWidth < 768;

  sections.forEach(section => {
    try {
      const sectionElement = document.getElementById(section);
      const cubes = sectionCubes[section];
      if (!cubes || !cubes.left || !cubes.right) return;
      const sectionRect = sectionElement.getBoundingClientRect();
      const canvasRect = canvasContainer.getBoundingClientRect();

      const xOffset = 300;
      const yPos = -(sectionRect.top + sectionRect.height / 2 - canvasRect.top - window.innerHeight / 2);
      const zPos = camera.position.z - 300;

      if (section === 'filmmaking' && isMobile) {
        // Mobile: Show only camera.glb below section card
        cubes.left.visible = true;
        cubes.right.visible = false; // Hide GoPro
        cubes.left.scale.set(200, 200, 200); // Smaller scale for mobile
        cubes.left.position.set(0, yPos - sectionRect.height / 2 - 100, zPos); // Center, below card
        if (cubes.cameraLight) {
          cubes.cameraLight.position.set(50, yPos - sectionRect.height / 2 - 100, zPos);
          cubes.cameraLight.visible = true;
        }
        if (cubes.pointLight) {
          cubes.pointLight.visible = false; // Hide GoPro light
        }
      } else if (section === 'filmmaking') {
        // Desktop: Show both models
        cubes.left.visible = true;
        cubes.right.visible = true;
        cubes.left.scale.set(375, 375, 375); // Original scale
        cubes.left.position.set(-xOffset, yPos, zPos);
        cubes.right.position.set(xOffset, yPos, zPos);
        if (cubes.cameraLight) {
          cubes.cameraLight.position.set(-xOffset + 50, yPos, zPos);
          cubes.cameraLight.visible = true;
        }
        if (cubes.pointLight) {
          cubes.pointLight.position.set(xOffset + 50, yPos, zPos);
          cubes.pointLight.visible = true;
        }
      } else {
        // Other sections: Cubes (center one on mobile)
        cubes.left.visible = !isMobile; // Hide left cube on mobile
        cubes.right.visible = true;
        cubes.left.position.set(-xOffset, yPos, zPos);
        cubes.right.position.set(isMobile ? 0 : xOffset, yPos, zPos);
      }

      cubes.left.rotation.x += 0.00333;
      cubes.left.rotation.y += 0.00333;
      cubes.right.rotation.x += 0.00333;
      cubes.right.rotation.y += 0.00333;
    } catch (error) {
      console.error(`Error updating cubes for section ${section}:`, error);
    }
  });
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
    updateCubePositions();
    console.log('Number rain resized');
  } catch (error) {
    console.error('Error resizing number rain:', error);
  }
}

function onScrollBackground() {
  try {
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const maxCameraZ = 2000;
    camera.position.z = 1000 + (scrollY / maxScroll) * (maxCameraZ - 1000);
    updateCubePositions();
  } catch (error) {
    console.error('Error handling scroll:', error);
  }
}

function animateBackground() {
  requestAnimationFrame(animateBackground);
  try {
    const delta = clock.getDelta();
    if (cameraMixer) cameraMixer.update(delta);
    const positions = particleGeometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= 0.5;
      if (positions[i + 1] < -window.innerHeight) {
        positions[i + 1] = window.innerHeight;
        positions[i + 2] = Math.random() * 2000 - 1000;
      }
    }
    particleGeometry.attributes.position.needsUpdate = true;
    updateCubePositions();
    renderer.render(scene, camera);
    console.log('Number rain frame rendered');
    console.log('Camera position in render:', camera.position);
    if (sectionCubes.filmmaking?.left) {
      console.log('Camera model visibility:', sectionCubes.filmmaking.left.visible);
    }
  } catch (error) {
    console.error('Error animating number rain:', error);
  }
}

// Zero Model with Exploding Effect
const zeroViewer = document.getElementById('zero-viewer');
let zeroScene, zeroCamera, zeroRenderer, zeroMesh, zeroHover = false;

function initZeroViewer() {
  try {
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
          gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
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
  } catch (error) {
    console.error('Error initializing zero viewer:', error);
  }
}

function onWindowResizeZero() {
  try {
    zeroCamera.aspect = zeroViewer.clientWidth / zeroViewer.clientHeight;
    zeroCamera.updateProjectionMatrix();
    zeroRenderer.setSize(zeroViewer.clientWidth, zeroViewer.clientHeight);
  } catch (error) {
    console.error('Error resizing zero viewer:', error);
  }
}

function animateZero() {
  requestAnimationFrame(animateZero);
  try {
    zeroMesh.rotation.y += 0.01;
    zeroMesh.material.uniforms.uTime.value += 0.05;
    zeroMesh.material.uniforms.uHover.value = zeroHover ? 1.0 : 0.0;
    zeroRenderer.render(zeroScene, zeroCamera);
  } catch (error) {
    console.error('Error animating zero viewer:', error);
  }
}

// 3D Model Viewer Carousel with Explode Effect
const modelViewer = document.getElementById('modelViewer');
let modelScene, modelCamera, modelRenderer, modelControls;
const models = [
  { file: 'ImageToStl.com_robocon_drumbot v1.glb', desc: 'Robotics model built in Fusion 360.' },
  { file: 'ImageToStl.com_katanaforzip.glb', desc: 'Cyberpunk katana designed in Fusion 360.' },
];
let currentModelIndex = 0;
let currentModel = null;
let modelHover = false;

function initModelViewer() {
  try {
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

    modelViewer.addEventListener('mouseenter', () => {
      modelHover = true;
      if (currentModel) explodeModel(true);
    });
    modelViewer.addEventListener('mouseleave', () => {
      modelHover = false;
      if (currentModel) explodeModel(false);
    });

    window.addEventListener('resize', onWindowResizeModel);
  } catch (error) {
    console.error('Error initializing model viewer:', error);
  }
}

function loadModel(index) {
  try {
    if (currentModel) modelScene.remove(currentModel);
    const loader = new THREE.GLTFLoader();
    loader.load(
      models[index].file,
      (gltf) => {
        currentModel = gltf.scene;
        currentModel.scale.set(5, 5, 5);
        currentModel.position.set(0, 0, 0);
        currentModel.traverse((child) => {
          if (child.isMesh) {
            child.originalPosition = child.position.clone();
          }
        });
        modelScene.add(currentModel);
        document.getElementById('modelDescription').textContent = models[index].desc;
        console.log('Model loaded successfully:', models[index].file);
      },
      (xhr) => console.log(`Loading ${models[index].file}: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`),
      (error) => {
        console.error('Error loading model:', models[index].file, error);
        document.getElementById('modelDescription').textContent = 'Failed to load model.';
      }
    );
  } catch (error) {
    console.error('Error loading model:', error);
  }
}

function explodeModel(expand) {
  try {
    if (!currentModel) return;
    currentModel.traverse((child) => {
      if (child.isMesh && child.originalPosition) {
        const targetPosition = expand
          ? child.originalPosition.clone().multiplyScalar(1.5)
          : child.originalPosition;
        new TWEEN.Tween(child.position)
          .to({ x: targetPosition.x, y: targetPosition.y, z: targetPosition.z }, 500)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start();
      }
    });
  } catch (error) {
    console.error('Error exploding model:', error);
  }
}

function onWindowResizeModel() {
  try {
    modelCamera.aspect = modelViewer.clientWidth / modelViewer.clientHeight;
    modelCamera.updateProjectionMatrix();
    modelRenderer.setSize(modelViewer.clientWidth, modelViewer.clientHeight);
  } catch (error) {
    console.error('Error resizing model viewer:', error);
  }
}

function animateModel() {
  requestAnimationFrame(animateModel);
  try {
    modelControls.update();
    TWEEN.update();
    modelRenderer.render(modelScene, modelCamera);
  } catch (error) {
    console.error('Error animating model viewer:', error);
  }
}

function prevModel() {
  try {
    currentModelIndex = (currentModelIndex - 1 + models.length) % models.length;
    loadModel(currentModelIndex);
  } catch (error) {
    console.error('Error navigating to previous model:', error);
  }
}

function nextModel() {
  try {
    currentModelIndex = (currentModelIndex + 1) % models.length;
    loadModel(currentModelIndex);
  } catch (error) {
    console.error('Error navigating to next model:', error);
  }
}

// Filmmaking Carousel
const filmContent = document.getElementById('filmContent');
const films = [
  { title: 'Film Reel (@secr0ti)', desc: 'Short films and edits showcasing my storytelling. <a href="https://instagram.com/secr0ti">View on Instagram</a>.', tags: ['Filmmaking', 'Video Editing'] },
];
let currentFilmIndex = 0;

function updateFilm() {
  try {
    filmContent.innerHTML = `
      <h3>${films[currentFilmIndex].title}</h3>
      <p>${films[currentFilmIndex].desc}</p>
      <div class="project-tags">
        ${films[currentFilmIndex].tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error updating film carousel:', error);
  }
}

function prevFilm() {
  try {
    currentFilmIndex = (currentFilmIndex - 1 + films.length) % films.length;
    updateFilm();
  } catch (error) {
    console.error('Error navigating to previous film:', error);
  }
}

function nextFilm() {
  try {
    currentFilmIndex = (currentFilmIndex + 1) % films.length;
    updateFilm();
  } catch (error) {
    console.error('Error navigating to next film:', error);
  }
}

// Cybersecurity Carousel
const cyberContent = document.getElementById('cyberContent');
const cyberProjects = [
  { title: 'Network Scanner', desc: 'A Python script to detect network vulnerabilities.', tags: ['Cybersecurity', 'Python', 'Linux'] },
];
let currentCyberIndex = 0;

function updateCyber() {
  try {
    cyberContent.innerHTML = `
      <h3>${cyberProjects[currentCyberIndex].title}</h3>
      <p>${cyberProjects[currentCyberIndex].desc}</p>
      <div class="project-tags">
        ${cyberProjects[currentCyberIndex].tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error updating cyber carousel:', error);
  }
}

function prevCyber() {
  try {
    currentCyberIndex = (currentCyberIndex - 1 + cyberProjects.length) % cyberProjects.length;
    updateCyber();
  } catch (error) {
    console.error('Error navigating to previous cyber project:', error);
  }
}

function nextCyber() {
  try {
    currentCyberIndex = (currentCyberIndex + 1) % cyberProjects.length;
    updateCyber();
  } catch (error) {
    console.error('Error navigating to next cyber project:', error);
  }
}

// Robotics Carousel
const robotContent = document.getElementById('robotContent');
const robotProjects = [
  { title: 'Robotics Tinker', desc: '3D modeled robotics parts in Fusion 360—work in progress!', tags: ['Fusion 360', 'Robotics'] },
];
let currentRobotIndex = 0;

function updateRobot() {
  try {
    robotContent.innerHTML = `
      <h3>${robotProjects[currentRobotIndex].title}</h3>
      <p>${robotProjects[currentRobotIndex].desc}</p>
      <div class="project-tags">
        ${robotProjects[currentRobotIndex].tags.map(tag => `<span class="project-tag">${tag}</span>`).join('')}
      </div>
    `;
  } catch (error) {
    console.error('Error updating robot carousel:', error);
  }
}

function prevRobot() {
  try {
    currentRobotIndex = (currentRobotIndex - 1 + robotProjects.length) % robotProjects.length;
    updateRobot();
  } catch (error) {
    console.error('Error navigating to previous robot project:', error);
  }
}

function nextRobot() {
  try {
    currentRobotIndex = (currentRobotIndex + 1) % robotProjects.length;
    updateRobot();
  } catch (error) {
    console.error('Error navigating to next robot project:', error);
  }
}

// Scroll Animation
function isInViewport(element) {
  try {
    const rect = element.getBoundingClientRect();
    return rect.top <= (window.innerHeight || document.documentElement.clientHeight) * 0.85;
  } catch (error) {
    console.error('Error checking viewport:', error);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    const fadeElements = document.querySelectorAll('.fade-in');
    const header = document.getElementById('header');
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
  } catch (error) {
    console.error('Error initializing scroll animation:', error);
  }
});

// Initialize Everything
try {
  initBackground();
  animateBackground();
  initZeroViewer();
  animateZero();
  initModelViewer();
  animateModel();
  updateFilm();
  updateCyber();
  updateRobot();
} catch (error) {
  console.error('Error initializing website:', error);
}
