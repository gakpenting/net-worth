<script setup>
import { ref, watchEffect, onMounted } from 'vue';
import { useUnseenProposals } from '@/composables/useUnseenProposals';
import { useScrollMonitor } from '@/composables/useScrollMonitor';
import { useApp } from '@/composables/useApp';
import { useFollowSpace } from '@/composables/useFollowSpace';
import { useCategories } from '@/composables/useCategories';
import { setPageTitle } from '@/helpers/utils';

const { selectedCategory, orderedSpaces, orderedSpacesByCategory } = useApp();
const { followingSpaces } = useFollowSpace();
const { spacesPerCategory, categoriesOrderedBySpaceCount } = useCategories();

function selectCategory(c) {
  selectedCategory.value = c === selectedCategory.value ? '' : c;
}

const { getProposalIds } = useUnseenProposals();
watchEffect(() => getProposalIds(followingSpaces.value));

// Scroll
const loadBy = 16;
const limit = ref(loadBy);

const { endElement } = useScrollMonitor(() => (limit.value += loadBy));

onMounted(() => {
  setPageTitle('page.title.home');
});
</script>

<template>
  <div class="mt-4">
    <Container class="flex justify-between items-center mb-4">
      <UiButton class="pl-3 pr-0 w-full max-w-[420px]">
        <SearchWithFilters />
      </UiButton>
    
      
      <div class="ml-3 text-right hidden md:block whitespace-nowrap">
        {{ $tc('spaceCount', [_n(orderedSpacesByCategory.length)]) }}
          <UiButton class="mx-2">
        Create Generative Art
      </UiButton>
      </div>
     
    </Container>
    <Container :slim="true">
      <div class="grid lg:grid-cols-4 md:grid-cols-3 gap-4">
      
      </div>
      <NoResults
        :block="true"
      
      />
    </Container>
    <div ref="endElement" />
     <ModalStart
      :open="true"
      />
    
 
  </div>
</template>
