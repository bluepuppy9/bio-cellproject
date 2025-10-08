<template>
	<div class="min-h-screen p-6">
		<div class="max-w-5xl mx-auto">
			<h1 class="text-4xl font-bold mb-4">Plant Cell Viewer</h1>
			<p class="mb-6">Interact with a 3D plant cell. Click organelle tags to learn more.</p>

			<div class="card bg-base-200 shadow-lg h-[600px]">
				<div class="card-body p-0 h-full">
					<PlantCell3D />
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import PlantCell3D from '../components/PlantCell3D.vue'
</script>
