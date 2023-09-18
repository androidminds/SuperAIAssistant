<template>
    <div class="flex pt-24 text-base-content flex-col space-y-4 px-72">
        <span class="w-full text-center text-2xl">{{t('WelcomeMsgTitle')}}</span>
        <div class="w-full text-lg px-16 flex flex-col space-y-1 ">
            <span >{{t('WelcomeMsg1')}}</span>
            <span>{{t('WelcomeMsg2')}}</span>
            <span>{{t('WelcomeMsg3')}}</span>
        </div>
    </div>

</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>