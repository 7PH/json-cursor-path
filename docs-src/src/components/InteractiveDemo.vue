<template>
    <section id="demo">
        <h2 class="text-2xl font-bold text-white mb-2">Interactive Demo</h2>
        <p class="text-slate-400 mb-6">Click anywhere in the JSON below to see the resolved path.</p>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <!-- JSON Editor -->
            <div class="bg-slate-800 rounded-lg overflow-hidden h-[38rem] flex flex-col">
                <div class="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700 shrink-0">
                    <span class="text-xs text-slate-400 font-mono">JSON Input</span>
                </div>
                <textarea
                    ref="textareaRef"
                    v-model="jsonText"
                    @click="updateCursor"
                    @keyup="updateCursor"
                    @select="updateCursor"
                    class="w-full flex-1 bg-slate-900/50 text-slate-200 font-mono text-sm p-4 resize-none focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                    spellcheck="false"
                />
            </div>

            <!-- Path Output -->
            <div class="bg-slate-800 rounded-lg overflow-hidden h-[38rem] flex flex-col">
                <div class="flex items-center justify-between px-4 py-2 bg-slate-800/80 border-b border-slate-700 shrink-0">
                    <span class="text-xs text-slate-400 font-mono">Path Output</span>
                    <label class="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                        <input
                            type="checkbox"
                            v-model="specifyStringIndex"
                            class="rounded bg-slate-700 border-slate-600 text-teal-500 focus:ring-teal-500/50"
                        />
                        specifyStringIndex
                    </label>
                </div>
                <div class="p-4 space-y-4 overflow-y-auto flex-1">
                    <!-- Cursor position -->
                    <div>
                        <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">Cursor Position</div>
                        <div class="font-mono text-sm">{{ cursorPosition }}</div>
                    </div>

                    <!-- String path -->
                    <div>
                        <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">String Path</div>
                        <div
                            class="font-mono text-sm px-3 py-2 bg-slate-900/50 rounded"
                            :class="stringPath === null ? 'text-slate-500 italic' : 'text-teal-400'"
                        >
                            {{ stringPath ?? 'null (cursor outside value)' }}
                        </div>
                    </div>

                    <!-- Breadcrumb -->
                    <div v-if="rawPath">
                        <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">Breadcrumb</div>
                        <div class="flex flex-wrap gap-1">
                            <span class="px-2 py-0.5 bg-slate-700 rounded text-xs font-mono text-slate-300">$</span>
                            <template v-for="(entry, i) in rawPath" :key="i">
                                <span class="text-slate-600">&rsaquo;</span>
                                <span class="px-2 py-0.5 bg-slate-700 rounded text-xs font-mono text-slate-300">
                                    {{ formatBreadcrumb(entry) }}
                                </span>
                            </template>
                        </div>
                    </div>

                    <!-- Raw path -->
                    <div>
                        <div class="text-xs text-slate-500 uppercase tracking-wider mb-1">Raw Path</div>
                        <pre class="text-xs font-mono bg-slate-900/50 rounded p-3 text-slate-300 overflow-x-auto">{{ rawPathFormatted }}</pre>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { JsonCursorPath, type PathEntry, type PathToCursor } from '../../../src/json-cursor-path';

const SAMPLE_JSON = JSON.stringify({
    store: {
        name: "My Bookstore",
        books: [
            {
                title: "The Great Gatsby",
                author: "F. Scott Fitzgerald",
                price: 10.99,
            },
            {
                title: "To Kill a Mockingbird",
                author: "Harper Lee",
                price: 7.99,
                tags: ["classic", "fiction"],
            },
        ],
        open: true,
        address: null,
    },
}, null, 2);

const jsonText = ref(SAMPLE_JSON);
const cursorPosition = ref(0);
const specifyStringIndex = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

const parser = computed(() => new JsonCursorPath(jsonText.value, { specifyStringIndex: specifyStringIndex.value }));

const stringPath = computed(() => parser.value.get(cursorPosition.value));
const rawPath = computed(() => parser.value.get(cursorPosition.value, true));
const rawPathFormatted = computed(() => rawPath.value ? JSON.stringify(rawPath.value, null, 2) : 'null');

function updateCursor() {
    if (textareaRef.value) {
        cursorPosition.value = textareaRef.value.selectionStart;
    }
}

function formatBreadcrumb(entry: PathEntry): string {
    if (entry.type === 'object') return entry.key;
    if (entry.type === 'array') return `[${entry.index}]`;
    return `[${entry.index}]`;
}

</script>
