<template>
  <main class="flex-1 py-6 px-4 max-w-3xl mx-auto w-full">
    <div class="card dark:bg-gray-800">
      <h2 class="text-xl font-bold mb-6 dark:text-white">{{ $t('terms.title') }}</h2>
      <div class="text-sm text-gray-600 dark:text-gray-300 leading-relaxed space-y-4">
        <p>{{ $t('terms.lastUpdated') }}: 2026-06-23</p>
        <h3 class="text-base font-bold mt-6 dark:text-white">1. {{ $t('terms.s1Title') }}</h3>
        <p>{{ $t('terms.s1Text') }}</p>
        <h3 class="text-base font-bold mt-6 dark:text-white">2. {{ $t('terms.s2Title') }}</h3>
        <p>{{ $t('terms.s2Text') }}</p>
        <h3 class="text-base font-bold mt-6 dark:text-white">3. {{ $t('terms.s3Title') }}</h3>
        <p>{{ $t('terms.s3Text') }}</p>
        <h3 class="text-base font-bold mt-6 dark:text-white">4. {{ $t('terms.s4Title') }}</h3>
        <p>{{ $t('terms.s4Text') }}</p>
        <h3 class="text-base font-bold mt-6 dark:text-white">5. {{ $t('terms.s5Title') }}</h3>
        <p>{{ $t('terms.s5Text') }}</p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { $t } from '@/i18n'
</script>
