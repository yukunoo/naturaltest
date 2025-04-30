<template>
	<div>
		<slot />
	</div>
</template>

<script setup>
defineOptions({
	name: 'DefaultLayout',
});
</script>

<style scoped>
.pointer-cur {
	cursor: pointer;
}
</style>
