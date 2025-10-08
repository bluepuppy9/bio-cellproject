<template>
  <div
    class="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50"
  >
    <!-- Hero Section -->
    <div class="hero min-h-screen">
      <div
        class="hero-content max-w-11/12 mx-auto flex-col lg:flex-row-reverse"
      >
        <div class="w-full">
          <div
            class="card bg-white/80 backdrop-blur-sm shadow-2xl border border-white/20"
          >
            <div class="card-body p-2">
              <div class="h-[800px] w-full">
                <PlantCell3D />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PlantCell3D from "../components/PlantCell3D.vue";
</script>
