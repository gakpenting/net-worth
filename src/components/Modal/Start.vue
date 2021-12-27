<script setup>
import { computed } from 'vue';
import pkg from '@/../package.json';
import languages from '@/locales/languages.json';
import gateways from '@snapshot-labs/snapshot.js/src/gateways.json';
import { useWeb3 } from '@/composables/useWeb3';
import { useI18n } from 'vue-i18n';
defineProps(['open']);
const { t } = useI18n();
const emit = defineEmits(['close', 'openLang']);

const { web3 } = useWeb3();

const gateway = import.meta.env.VITE_IPFS_GATEWAY || gateways[0];
const commitSha = import.meta.env.VITE_COMMIT_SHA;
const hubUrl = import.meta.env.VITE_HUB_URL;

function changeLang() {
  emit('openLang');
  emit('close');
}
const searchOptions = computed(() => [
  {
    text: t('spaces'),
    action: 'home'
  },
  {
    text: t('networks'),
    action: 'networks'
  },
  {
    text: t('strategiesPage'),
    action: 'strategies'
  },
  {
    text: t('plugins'),
    action: 'plugins'
  },
  {
    text: t('plugins'),
    action: 'plugins'
  },
  {
    text: t('plugins'),
    action: 'plugins'
  },
  {
    text: t('plugins'),
    action: 'plugins'
  },
  {
    text: t('plugins'),
    action: 'plugins'
  },
  {
    text: t('plugins'),
    action: 'plugins'
  },
  {
    text: t('plugins'),
    action: 'plugins'
  },
  {
    text: t('plugins'),
    action: 'plugins'
  }
]);
</script>

<template>
  <UiModal :open="open" @close="$emit('close')">
    <template v-slot:header>
      <h3>Getting Started</h3>
    </template>
    <div class="text-center mt-2 p-2">
      Before we can generate art for you we need to connect both your ethereum
      wallet and arconnect wallet
    </div>
    <div class="flex w-full p-4 justify-center flex-col">
      <UiButton class="!bg-blue-200 mb-2"> Connect Ethereum Wallet </UiButton>
      <UiButton class="!bg-blue-200"> Connect Arweave Wallet </UiButton>
    </div>
    <div class="text-center mt-2 p-2">
      We gonna use ardrive to save our generated image please select or create
      drive below :
    </div>
    <div class="flex w-full p-4 justify-center">
      <div>
      <select class="form-select form-select-lg mb-3
      
      block
      w-full
      px-4
      py-2
      text-xl
      font-normal
      text-gray-700
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gray-300
      rounded
      transition
      ease-in-out
      m-0
      focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none"  aria-label=".form-select-lg example">
      <Icon name="arrow-down" class="ml-1 mr-2 pr-1" />
        <option selected>Select Drive</option>
        <option value="1">One</option>
        <option value="2">Two</option>
        <option value="3">Three</option>
        
    </select>
      
      </div>
      
    </div>
    <div class="flex w-full p-4 justify-center flex-col">
<UiButton class="!bg-red !text-white mb-2"> Create new drive </UiButton>
      <UiButton class="!bg-green !text-white"> Select this drive </UiButton>
    </div>
        
  </UiModal>
</template>
