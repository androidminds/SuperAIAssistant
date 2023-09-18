<template>
    <Dialog :ok="close" :visible="visible" :title="t('Menu.about')">
        <div class="flex space-x-4">
            <div class="pt-1">
                <img class="w-8 h-8" src="/chatbot.png"/>
            </div>
            <div class="flex flex-col flex-y-2 pb-4">
                <div class="mb-4 text-lg"> {{ t('AppTitle') }}</div>
                <div> {{t('Author')}}: Richard Liu</div>
                <div> {{t('Email')}}: richard@androidminds.cn</div>
                <div> {{t('Version')}}: {{ version }}</div>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">

import { useI18n } from 'vue-i18n';
const { t } = useI18n()

defineProps({
    visible: { type: Boolean, required: true },
    version: { type: String, required: true}
})

const emits = defineEmits(["update:visible"])

function close() {
   emits("update:visible", false);
}

</script>
