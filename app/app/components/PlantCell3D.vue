<template>
  <div ref="container" class="w-full h-full rounded-lg border border-base-300 overflow-hidden relative">
    <!-- Modal (daisyUI) -->
    <div v-if="selected" class="modal modal-open">
      <div class="modal-box max-w-3xl">
        <h3 class="font-bold text-lg">{{ selected.name }}</h3>
        <img :src="selected.slide" alt="slide" class="w-full mt-4" />
        <div class="modal-action">
          <button class="btn" @click="close">Close</button>
        </div>
      </div>
    </div>
    <!-- Overlay note -->
    <div class="absolute top-2 left-2 z-20">
      <div class="badge">Drag to rotate • Scroll to zoom</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

type Organelle = { id: string; name: string; pos: [number,number,number]; color: string; slide: string }

const container = ref<HTMLDivElement | null>(null)
const selected = ref<Organelle | null>(null)

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.PerspectiveCamera | null = null
let controls: OrbitControls | null = null
let raycaster: THREE.Raycaster
let mouse = new THREE.Vector2()
let animationId: number | null = null

const organelles: Organelle[] = [
  { id: 'nucleus', name: 'Nucleus', pos: [0,0,0], color: '#6EE7B7', slide: '/slides/nucleus.svg' },
  { id: 'chloroplast', name: 'Chloroplast', pos: [2,0,0], color: '#34D399', slide: '/slides/chloroplast.svg' },
  { id: 'vacuole', name: 'Vacuole', pos: [-2,0,0], color: '#60A5FA', slide: '/slides/vacuole.svg' },
  { id: 'cell-wall', name: 'Cell Wall', pos: [0,0,-2.5], color: '#FDE68A', slide: '/slides/cell-wall.svg' }
]

function createOrganelleMesh(o: Organelle) {
  const geo = new THREE.SphereGeometry(0.6, 32, 32)
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(o.color), roughness: 0.6, metalness: 0 })
  const m = new THREE.Mesh(geo, mat)
  m.position.set(o.pos[0], o.pos[1], o.pos[2])
  m.userData = { id: o.id }
  return m
}

onMounted(() => {
  if (!container.value) return

  // Scene + camera
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(45, container.value.clientWidth / container.value.clientHeight, 0.1, 100)
  camera.position.set(5,5,8)

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.value.appendChild(renderer.domElement)

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7)
  scene.add(hemi)
  const dir = new THREE.DirectionalLight(0xffffff, 0.6)
  dir.position.set(5,10,7)
  scene.add(dir)

  // Plant cell outer membrane - a transparent sphere
  const outerGeo = new THREE.SphereGeometry(4, 48, 48)
  const outerMat = new THREE.MeshPhysicalMaterial({ color: 0xC7F9CC, transparent: true, opacity: 0.12, roughness: 0.5 })
  const outer = new THREE.Mesh(outerGeo, outerMat)
  scene.add(outer)

  // Add organelles
  organelles.forEach(o => scene!.add(createOrganelleMesh(o)))

  // Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true

  // Raycaster
  raycaster = new THREE.Raycaster()

  function onPointerMove(event: PointerEvent) {
    if (!container.value) return
    const rect = container.value.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  function onClick() {
    if (!scene || !camera) return
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(scene.children, true)
    for (const i of intersects) {
      const id = i.object.userData?.id
      if (id) {
        const found = organelles.find(o => o.id === id)
        if (found) selected.value = found
        break
      }
    }
  }

  container.value.addEventListener('pointermove', onPointerMove)
  container.value.addEventListener('click', onClick)

  // Resize handling
  function onResize() {
    if (!container.value || !camera || !renderer) return
    camera.aspect = container.value.clientWidth / container.value.clientHeight
    camera.updateProjectionMatrix()
    renderer.setSize(container.value.clientWidth, container.value.clientHeight)
  }
  window.addEventListener('resize', onResize)

  // Animate
  function animate() {
    animationId = requestAnimationFrame(animate)
    controls?.update()
    renderer!.render(scene!, camera!)
  }
  animate()

  // cleanup
  onBeforeUnmount(() => {
    if (animationId) cancelAnimationFrame(animationId)
    container.value?.removeChild(renderer!.domElement)
    window.removeEventListener('resize', onResize)
    container.value?.removeEventListener('pointermove', onPointerMove)
    container.value?.removeEventListener('click', onClick)
    renderer!.dispose()
  })
})

function close() {
  selected.value = null
}
</script>

<style scoped>
:root { --three-canvas-bg: transparent }
</style>
