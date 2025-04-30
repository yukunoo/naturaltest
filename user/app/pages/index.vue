<script setup lang="ts">
// import type { FormSubmitEvent } from '@nuxt/ui';
import html2canvas from 'html2canvas-pro';

// 定義 JSON 資料的類型
interface Ingredient {
	category: string;
	names: string[];
	risk: string;
}

interface ToothpasteData {
	ingredients: Ingredient[];
}

// 導入 JSON 資料
const toothpasteData = (await import(
	'../data/toothpaste-ingredients.json'
)) as { default: ToothpasteData };

const state = reactive({
	ingredients: '',
});
const formattedList = ref<Array<{ category: string; isHazardous: boolean }>>(
	[]
);
const step = ref(1);
const ingredientDetails = ref<
	Array<{ category: string; name: string; risk: string }>
>([]);
const isLoading = ref(false);

function formatIngredients(text: string) {
	// 1. 去掉開頭的提示詞 (只砍第一個冒號前的)
	text = text.replace(
		/^(.*?(全成分名稱|全成分|全成份|成份|成分|ingredients?))[:：、．。・.；;\s]*/i,
		''
	);

	// 2. 把所有的分隔符統一成英文逗號
	text = text.replace(/[、。・;；:ㆍ]/g, ','); // 換行、各種點點符號、韓文ㆍ都變 ,

	// 3. 移除連續的逗號
	text = text.replace(/,+/g, ',');

	// 4. 分割陣列並清理
	const parts = text
		.split(',')
		.map((item) => item.trim())
		.filter((item) => item.length > 0);

	return parts;
}

async function onSubmit() {
	isLoading.value = true;
	step.value = 1;
	const formatted = formatIngredients(state.ingredients);

	// 清空之前的結果
	ingredientDetails.value = [];
	formattedList.value = [];

	// 檢查每個輸入的成分
	formatted.forEach((ingredient) => {
		// 遍歷 JSON 資料中的每個成分類別
		const matched = toothpasteData.default.ingredients.find(
			(category: Ingredient) => {
				// 檢查是否匹配任何成分名稱
				const matchedName = category.names.find((name: string) => {
					// 如果是需要前綴匹配的特殊情況（如 PEG-, CI ）
					if (name.endsWith('-') || name.endsWith(' ')) {
						return ingredient.startsWith(name);
					}
					// 否則進行完全匹配（不區分大小寫）
					return ingredient.toLowerCase() === name.toLowerCase();
				});

				if (matchedName) {
					return {
						category: category.category,
						name: ingredient,
						risk: category.risk,
					};
				}
			}
		);
		if (matched) {
			ingredientDetails.value.push({
				category: matched.category,
				name: ingredient,
				risk: matched.risk,
			});
			formattedList.value.push({
				category: ingredient,
				isHazardous: true,
			});
		} else {
			formattedList.value.push({
				category: ingredient,
				isHazardous: false,
			});
		}
	});

	await new Promise((resolve) => setTimeout(resolve, 300));
	step.value = 2;
	isLoading.value = false;
}

const downloadImage = async () => {
	const target = document.getElementById('result-section');
	if (!target) return;

	// 複製一份 target 的 DOM
	const targetClone = target.cloneNode(true) as HTMLElement;
	targetClone.style.width = '750px';
	targetClone.style.paddingInline = 'calc(var(--spacing) * 10)';
	document.body.appendChild(targetClone);

	const options = {
		width: targetClone.offsetWidth,
		height: targetClone.offsetHeight,
		useCORS: true,
		allowTaint: false,
		backgroundColor: null,
		scale: 3,
	};

	html2canvas(targetClone, options).then((canvas) => {
		const imgData = canvas.toDataURL('image/jpg');
		fileDownload(imgData);
		// 完成後移除複製的 DOM
		document.body.removeChild(targetClone);
	});
};
const fileDownload = (imgData: string) => {
	const downloadFile = document.createElement('a');
	downloadFile.href = imgData;
	downloadFile.download = `牙膏成分檢驗結果-${new Date().getTime()}.png`;
	document.body.appendChild(downloadFile);
	downloadFile.click();
	document.body.removeChild(downloadFile);
};
const handleClear = () => {
	step.value = 1;
	state.ingredients = '';
	ingredientDetails.value = [];
	formattedList.value = [];
};
</script>

<template>
	<div class="flex flex-col items-center justify-center min-h-screen w-full">
		<UForm
			:state="state"
			class="px-6 w-full max-w-[375px]"
			:class="{ 'mt-[50px]': step === 2 }"
			@submit="onSubmit"
		>
			<UFormField label="成分" name="ingredients">
				<UTextarea
					v-model="state.ingredients"
					autoresize
					class="w-full"
					@keydown.enter.exact.prevent="onSubmit"
				/>
			</UFormField>
			<div class="flex justify-center">
				<UButton
					type="submit"
					class="justify-center cursor-pointer mt-5"
					:loading="isLoading"
					:disabled="isLoading"
				>
					查詢
				</UButton>
			</div>
		</UForm>
		<div v-if="step === 2" class="p-4 mt-[50px] max-w-[750px] w-full">
			<div
				id="result-section"
				class="w-full max-w-3xl bg-secondary shadow-lg pt-8 pb-10 md:px-10 px-6"
			>
				<h2 class="text-4xl font-bold text-primary mb-8 text-center">
					牙膏成分檢驗結果
				</h2>
				<div
					v-if="ingredientDetails.length > 0"
					class="px-4 py-2 rounded-lg bg-[#f7ede2] text-primary text-center"
				>
					<p>根據您提供的牙膏成分資訊，</p>
					<p>這些成分經由國際資料比對，</p>
					<p>其中部分原料屬於常見口腔產品中具高注度的成分類型，</p>
					<p>可能有危害健康的風險疑慮</p>
				</div>
				<div class="my-4 text-center">
					<span
						v-for="(item, index) in formattedList"
						:key="index"
						:class="{ 'text-[#c7534b]': item.isHazardous }"
					>
						{{ item.category
						}}<span v-if="index < formattedList.length - 1">, </span>
					</span>
				</div>
				<ul v-if="ingredientDetails.length > 0" class="mt-[30px]">
					<li class="flex gap-10 mt-[20px] justify-between font-bold">
						<span class="w-2/6">成分</span>
						<span class="w-3/6">概略特性</span>
					</li>
					<li
						v-for="(item, index) in ingredientDetails"
						:key="index"
						class="flex gap-10 mt-[20px] justify-between"
					>
						<span class="w-2/6">
							{{ item.name }}
							<small class="text-gray-500">({{ item.category }})</small>
						</span>
						<span class="w-3/6 text-[#c7534b]">
							{{ item.risk }}
						</span>
					</li>
				</ul>
				<div
					v-if="ingredientDetails.length === 0"
					class="mt-[30px] rounded-lg bg-[#f7ede2] text-primary text-center py-10"
				>
					<p class="text-2xl font-bold">未檢測到任何危險成分</p>
				</div>
			</div>
			<div class="mt-6 flex justify-center gap-4">
				<UButton color="secondary" @click="handleClear">全部清除</UButton>
				<UButton color="primary" @click="downloadImage">下載圖片</UButton>
			</div>
		</div>
	</div>
</template>

<style scoped></style>
