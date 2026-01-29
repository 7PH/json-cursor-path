<template>
    <div class="min-h-screen">
        <AppHeader />

        <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
            <InteractiveDemo />
            <FeaturesSection />
            <ApiReference />
        </main>

        <footer class="border-t border-slate-800 py-8 text-center text-slate-500 text-sm">
            <p>
                <a
                    href="https://github.com/7PH/json-cursor-path"
                    class="hover:text-teal-400 transition-colors"
                >
                    GitHub
                </a>
                &middot;
                <a
                    href="https://github.com/7PH/json-cursor-path/issues"
                    class="hover:text-teal-400 transition-colors"
                >
                    Report an issue
                </a>
                &middot;
                <a
                    href="https://www.npmjs.com/package/json-cursor-path"
                    class="hover:text-teal-400 transition-colors"
                >
                    npm
                </a>
            </p>
        </footer>
    </div>
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue';
import InteractiveDemo from '@/components/InteractiveDemo.vue';
import FeaturesSection from '@/components/FeaturesSection.vue';
import ApiReference from '@/components/ApiReference.vue';
</script>
