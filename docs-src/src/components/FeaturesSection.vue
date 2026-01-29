<template>
    <section id="features">
        <h2 class="text-2xl font-bold text-white mb-6">Features</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
                v-for="feature in features"
                :key="feature.title"
                class="bg-slate-800 rounded-lg p-5"
            >
                <div class="text-2xl mb-2">{{ feature.icon }}</div>
                <h3 class="text-white font-semibold mb-1">{{ feature.title }}</h3>
                <p class="text-slate-400 text-sm">{{ feature.description }}</p>
            </div>
        </div>
    </section>

    <section id="install">
        <h2 class="text-2xl font-bold text-white mb-4">Install & Usage</h2>
        <div class="space-y-4">
            <highlightjs language="shell" code="npm install json-cursor-path" />
            <highlightjs language="typescript" :code="usageCode" />
        </div>
    </section>
</template>

<script setup lang="ts">
const features = [
    {
        icon: '\u26A1',
        title: 'O(n) Performance',
        description: 'Single-pass parsing from start to cursor position. No full JSON parse required.',
    },
    {
        icon: '\uD83D\uDCE6',
        title: '~1KB Bundle Size',
        description: 'Minimal footprint. No dependencies. Tree-shakeable ES module.',
    },
    {
        icon: '\uD83D\uDD12',
        title: 'TypeScript Types',
        description: 'Full type definitions included. Typed path entries and options.',
    },
    {
        icon: '\uD83D\uDD27',
        title: 'Malformed JSON',
        description: 'Gracefully handles incomplete or malformed JSON without throwing errors.',
    },
    {
        icon: '\uD83D\uDCCD',
        title: 'String Index Tracking',
        description: 'Optionally track the character position within JSON string values.',
    },
    {
        icon: '\uD83D\uDD00',
        title: 'Dual Output Modes',
        description: 'Get results as a JSONPath string or a structured path array.',
    },
];

const usageCode = `import { JsonCursorPath } from 'json-cursor-path';

const json = '{"store": {"books": [{"title": "Gatsby"}]}}';
const parser = new JsonCursorPath(json);

// Get JSONPath string at cursor position 35
parser.get(35);       // "$.store.books[0].title"

// Get raw path array
parser.get(35, true); // [{type: "object", key: "store"}, ...]`;
</script>
