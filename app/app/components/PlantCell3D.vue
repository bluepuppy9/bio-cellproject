<template>
  <div
    ref="container"
    class="w-full h-full rounded-lg border border-base-300 overflow-hidden relative"
  >
    <!-- Fullscreen Modal with Animation -->
    <Transition name="modal">
      <div
        v-if="selected"
        class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center modal-backdrop"
        @click="close"
      >
        <Transition name="slide" appear>
          <div v-if="selected" class="modal-content relative">
            <button
              class="absolute top-6 right-6 z-10 w-12 h-12 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-300 hover:scale-110"
              @click="close"
            >
              ×
            </button>
            <img
              :src="selected.slide"
              :alt="selected.name"
              class="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              @click.stop
            />
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Organelle quick access -->
    <div
      class="absolute top-4 right-4 z-20 flex flex-col gap-2 overflow-y-auto"
    >
      <div class="text-xs font-semibold text-gray-600 mb-1 px-2">
        Quick Access:
      </div>
      <button
        v-for="o in organelles"
        :key="o.id"
        class="btn btn-sm btn-ghost bg-white/80 backdrop-blur-sm hover:bg-white/90 border border-white/30 shadow-md"
        :style="{ borderLeftColor: o.color, borderLeftWidth: '4px' }"
        @click="selectOrganelle(o)"
      >
        {{ o.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import * as THREE from "three";

type Organelle = {
  id: string;
  name: string;
  pos: [number, number, number];
  color: string;
  slide: string;
  description: string;
};

const container = ref<HTMLDivElement | null>(null);
const selected = ref<Organelle | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: any = null;
let raycaster: THREE.Raycaster;
let mouse = new THREE.Vector2();
let animationId: number | null = null;
let isDragging = false;
let hoveredObject: THREE.Object3D | null = null;

const organelles: Organelle[] = [
  {
    id: "cell-wall",
    name: "Cell Wall",
    pos: [0, 0, 0],
    color: "#A16207",
    slide: "/slides/cell-wall.png",
    description:
      "The rigid outer protective layer unique to plant cells. Provides structural support, protection, and shape to the cell.",
  },
  {
    id: "chloroplast",
    name: "Chloroplast",
    pos: [2.5, 1, 0.5],
    color: "#10B981",
    slide: "/slides/chloroplast.png",
    description:
      "The powerhouse of photosynthesis! Contains chlorophyll and converts sunlight, carbon dioxide, and water into glucose and oxygen.",
  },
  {
    id: "cytoplasm",
    name: "Cytoplasm",
    pos: [0, 0, 0],
    color: "#06B6D4",
    slide: "/slides/cytoplasm.png",
    description:
      "The gel-like substance filling the cell, providing a medium for organelles to move and for cellular processes to occur.",
  },
  {
    id: "golgi-apparatus",
    name: "Golgi Apparatus",
    pos: [1, -1.5, -1],
    color: "#F97316",
    slide: "/slides/golgi-apparatus.png",
    description:
      "The cell's packaging and shipping center. Modifies, packages, and ships proteins received from the endoplasmic reticulum.",
  },
  {
    id: "mitochondria",
    name: "Mitochondria",
    pos: [-1.5, 1.5, 1],
    color: "#EF4444",
    slide: "/slides/mitochondria.png",
    description:
      "The cellular powerhouse that produces ATP through cellular respiration. Essential for energy production in all living cells.",
  },
  {
    id: "nucleus",
    name: "Nucleus",
    pos: [0, 0, 0],
    color: "#8B5CF6",
    slide: "/slides/nucleus.png",
    description:
      "The control center of the cell, containing DNA and controlling all cellular activities. It regulates gene expression and houses the cell's genetic material.",
  },
  {
    id: "plasma-membrane",
    name: "Plasma Membrane",
    pos: [0, 0, 0],
    color: "#EC4899",
    slide: "/slides/plasma-membrane.png",
    description:
      "The flexible boundary that controls what enters and exits the cell. Made of phospholipids and proteins, it maintains cell homeostasis.",
  },
  {
    id: "ribosomes",
    name: "Ribosomes",
    pos: [1.2, 0.8, -1.5],
    color: "#8B5A2B",
    slide: "/slides/ribosomes.png",
    description:
      "Protein synthesis factories! These small structures read mRNA and assemble amino acids into proteins according to genetic instructions.",
  },
  {
    id: "comparison",
    name: "Comparison",
    pos: [0, 0, 0],
    color: "#C49102",
    slide: "/slides/comparison.png",
    description: "",
  },
];

function createOrganelleMesh(o: Organelle) {
  // Skip creating meshes for cell-wide structures (they'll be handled separately)
  if (
    o.id === "cell-wall" ||
    o.id === "plasma-membrane" ||
    o.id === "cytoplasm"
  ) {
    return null;
  }

  let geo: THREE.BufferGeometry;
  let material: THREE.MeshStandardMaterial;

  // Different shapes for different organelles
  switch (o.id) {
    case "nucleus":
      geo = new THREE.SphereGeometry(1.2, 32, 32);
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(o.color),
        roughness: 0.3,
        metalness: 0.1,
      });
      break;
    case "chloroplast":
      geo = new THREE.CapsuleGeometry(0.4, 1.0, 12, 24);
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(o.color),
        roughness: 0.4,
        metalness: 0.05,
      });
      break;
    case "vacuole":
      geo = new THREE.SphereGeometry(1.8, 32, 32);
      material = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(o.color),
        transparent: true,
        opacity: 0.6,
        roughness: 0.1,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      });
      break;
    case "mitochondria":
      geo = new THREE.CapsuleGeometry(0.3, 0.8, 8, 16);
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(o.color),
        roughness: 0.6,
        metalness: 0.2,
      });
      break;
    case "golgi-apparatus":
      geo = new THREE.TorusGeometry(0.8, 0.3, 8, 16);
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(o.color),
        roughness: 0.5,
        metalness: 0.1,
      });
      break;
    case "ribosomes":
      // Create multiple small ribosomes
      const group = new THREE.Group();
      for (let i = 0; i < 8; i++) {
        const riboGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const riboMat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(o.color),
          roughness: 0.7,
          metalness: 0.0,
        });
        const ribo = new THREE.Mesh(riboGeo, riboMat);
        ribo.position.set(
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2,
          (Math.random() - 0.5) * 2
        );
        ribo.userData = { id: o.id, originalColor: o.color };
        group.add(ribo);
      }
      group.position.set(o.pos[0], o.pos[1], o.pos[2]);
      group.userData = { id: o.id, originalColor: o.color };
      return group;
    default:
      geo = new THREE.SphereGeometry(0.6, 32, 32);
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(o.color),
        roughness: 0.4,
        metalness: 0.1,
      });
  }

  const m = new THREE.Mesh(geo, material);
  m.position.set(o.pos[0], o.pos[1], o.pos[2]);

  // Add slight rotation for visual interest
  m.rotation.x = Math.random() * Math.PI;
  m.rotation.y = Math.random() * Math.PI;

  m.userData = { id: o.id, originalColor: o.color };
  return m;
}

onMounted(() => {
  if (!container.value) return;

  // Scene + camera
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    45,
    container.value.clientWidth / container.value.clientHeight,
    0.1,
    100
  );
  camera.position.set(5, 5, 8);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.value.appendChild(renderer.domElement);

  // Better lighting setup
  scene.background = new THREE.Color(0xf0f9ff);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 5);
  directionalLight.castShadow = true;
  scene.add(directionalLight);

  const fillLight = new THREE.DirectionalLight(0x87ceeb, 0.3);
  fillLight.position.set(-5, 0, -5);
  scene.add(fillLight);

  // Plant cell outer membrane - a transparent sphere with better visuals
  const outerGeo = new THREE.SphereGeometry(4.2, 64, 64);
  const outerMat = new THREE.MeshPhysicalMaterial({
    color: 0xc7f9cc,
    transparent: true,
    opacity: 0.15,
    roughness: 0.1,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  scene.add(outer);

  // Add cell wall (rigid outer structure)
  const cellWallGeo = new THREE.SphereGeometry(4.5, 32, 32);
  const cellWallMat = new THREE.MeshStandardMaterial({
    color: 0x8b4513,
    transparent: true,
    opacity: 0.3,
    roughness: 0.8,
    wireframe: true,
  });
  const cellWall = new THREE.Mesh(cellWallGeo, cellWallMat);
  scene.add(cellWall);

  // Add organelles
  organelles.forEach((o) => {
    const mesh = createOrganelleMesh(o);
    if (mesh) {
      scene!.add(mesh);
    }
  });

  // Controls
  // Dynamically import OrbitControls to avoid static TypeScript resolution issues
  (async () => {
    try {
      const oc = await import("three/examples/jsm/controls/OrbitControls");
      const OrbitControls = oc.OrbitControls;
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
    } catch (e) {
      console.warn("OrbitControls failed to load", e);
    }
  })();

  // Raycaster
  raycaster = new THREE.Raycaster();

  function onPointerMove(event: PointerEvent) {
    if (!container.value || !scene || !camera) return;
    const rect = container.value.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Hover effect
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Reset previous hovered object
    if (hoveredObject && hoveredObject.userData?.id) {
      const mat = (hoveredObject as THREE.Mesh)
        .material as THREE.MeshStandardMaterial;
      mat.emissive.setHex(0x000000);
    }

    hoveredObject = null;
    document.body.style.cursor = "default";

    for (const i of intersects) {
      if (i.object.userData?.id) {
        hoveredObject = i.object;
        const mat = (i.object as THREE.Mesh)
          .material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0x444444);
        document.body.style.cursor = "pointer";
        break;
      }
    }
  }

  function onPointerDown() {
    isDragging = false;
  }

  function onPointerUp(event: PointerEvent) {
    // Only register click if we weren't dragging
    if ((!isDragging && !scene) || !camera) return;

    if (!isDragging) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);
      for (const i of intersects) {
        const id = i.object.userData?.id;
        if (id) {
          const found = organelles.find((o) => o.id === id);
          if (found) selected.value = found;
          break;
        }
      }
    }
  }

  container.value.addEventListener("pointermove", onPointerMove);
  container.value.addEventListener("pointerdown", onPointerDown);
  container.value.addEventListener("pointerup", onPointerUp);

  // Resize handling
  function onResize() {
    if (!container.value || !camera || !renderer) return;
    camera.aspect = container.value.clientWidth / container.value.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.value.clientWidth, container.value.clientHeight);
  }
  window.addEventListener("resize", onResize);

  // Animate
  function animate() {
    animationId = requestAnimationFrame(animate);
    controls?.update();
    renderer!.render(scene!, camera!);
  }
  animate();

  // Track dragging for controls
  if (controls) {
    controls.addEventListener("start", () => {
      isDragging = true;
    });
    controls.addEventListener("end", () => {
      setTimeout(() => (isDragging = false), 100); // Small delay to prevent click
    });
  }

  // cleanup
  onBeforeUnmount(() => {
    if (animationId) cancelAnimationFrame(animationId);
    container.value?.removeChild(renderer!.domElement);
    window.removeEventListener("resize", onResize);
    container.value?.removeEventListener("pointermove", onPointerMove);
    container.value?.removeEventListener("pointerdown", onPointerDown);
    container.value?.removeEventListener("pointerup", onPointerUp);
    renderer!.dispose();
  });
});

function close() {
  selected.value = null;
}

function selectOrganelle(o: Organelle) {
  // focus camera towards the organelle and open modal
  if (camera && controls) {
    const [x, y, z] = o.pos;
    // place camera a bit offset from the organelle
    camera.position.set(x + 3, y + 2, z + 3);
    if (controls.setTarget) {
      // some OrbitControls typings have setTarget
      try {
        (controls as any).setTarget(new THREE.Vector3(x, y, z));
      } catch (e) {}
    }
    controls.target = new THREE.Vector3(x, y, z);
    controls.update();
  }
  selected.value = o;
}
</script>

<style scoped>
:root {
  --three-canvas-bg: transparent;
}

/* Modal backdrop animation */
.modal-enter-active {
  animation: fadeIn 0.3s ease-out;
}

.modal-leave-active {
  animation: fadeOut 0.2s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Content slide animation */
.slide-enter-active {
  animation: slideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-leave-active {
  animation: slideOut 0.3s cubic-bezier(0.55, 0.06, 0.68, 0.19);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes slideOut {
  from {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
  to {
    opacity: 0;
    transform: scale(0.9) translateY(-10px);
  }
}

.modal-backdrop {
  backdrop-filter: blur(4px);
}

.modal-content {
  filter: drop-shadow(0 25px 50px rgba(0, 0, 0, 0.3));
}
</style>
