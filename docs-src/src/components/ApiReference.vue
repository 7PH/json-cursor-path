<template>
    <section id="api">
        <h2 class="text-2xl font-bold text-white mb-6">API Reference</h2>

        <div class="space-y-8">
            <!-- Constructor -->
            <div class="bg-slate-800 rounded-lg p-5">
                <h3 class="text-lg font-semibold text-white mb-2 font-mono">
                    new JsonCursorPath(code, options?)
                </h3>
                <p class="text-slate-400 text-sm mb-3">
                    Create a new parser instance for the given JSON text.
                </p>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="border-b border-slate-700 text-slate-400">
                                <th class="py-2 pr-4">Parameter</th>
                                <th class="py-2 pr-4">Type</th>
                                <th class="py-2">Description</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-300">
                            <tr class="border-b border-slate-700/50">
                                <td class="py-2 pr-4 font-mono text-teal-400">code</td>
                                <td class="py-2 pr-4 font-mono">string</td>
                                <td class="py-2">The JSON text to parse</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4 font-mono text-teal-400">options?</td>
                                <td class="py-2 pr-4 font-mono">JsonCursorPathOptions</td>
                                <td class="py-2">Optional configuration</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- get() -->
            <div class="bg-slate-800 rounded-lg p-5">
                <h3 class="text-lg font-semibold text-white mb-2 font-mono">
                    .get(cursorPosition, returnRawPath?)
                </h3>
                <p class="text-slate-400 text-sm mb-3">
                    Get the JSONPath at the specified cursor position. Returns <code class="text-teal-400">null</code> if the cursor is outside any JSON value.
                </p>
                <highlightjs language="typescript" :code="getOverloads" />
                <div class="overflow-x-auto mt-3">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="border-b border-slate-700 text-slate-400">
                                <th class="py-2 pr-4">Parameter</th>
                                <th class="py-2 pr-4">Type</th>
                                <th class="py-2">Description</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-300">
                            <tr class="border-b border-slate-700/50">
                                <td class="py-2 pr-4 font-mono text-teal-400">cursorPosition</td>
                                <td class="py-2 pr-4 font-mono">number</td>
                                <td class="py-2">Zero-based character offset in the JSON text</td>
                            </tr>
                            <tr>
                                <td class="py-2 pr-4 font-mono text-teal-400">returnRawPath?</td>
                                <td class="py-2 pr-4 font-mono">boolean</td>
                                <td class="py-2">
                                    If <code class="text-teal-400">true</code>, returns a <code class="font-mono">PathToCursor</code> array.
                                    Defaults to <code class="text-teal-400">false</code> (returns a JSONPath string).
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- rawPathToString() -->
            <div class="bg-slate-800 rounded-lg p-5">
                <h3 class="text-lg font-semibold text-white mb-2 font-mono">
                    .rawPathToString(path)
                </h3>
                <p class="text-slate-400 text-sm">
                    Converts a <code class="font-mono">PathToCursor</code> array to a JSONPath string.
                </p>
            </div>

            <!-- Types -->
            <div class="bg-slate-800 rounded-lg p-5">
                <h3 class="text-lg font-semibold text-white mb-2">Types</h3>
                <highlightjs language="typescript" :code="typesCode" />
            </div>

            <!-- Options -->
            <div class="bg-slate-800 rounded-lg p-5">
                <h3 class="text-lg font-semibold text-white mb-2 font-mono">
                    JsonCursorPathOptions
                </h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left">
                        <thead>
                            <tr class="border-b border-slate-700 text-slate-400">
                                <th class="py-2 pr-4">Option</th>
                                <th class="py-2 pr-4">Type</th>
                                <th class="py-2 pr-4">Default</th>
                                <th class="py-2">Description</th>
                            </tr>
                        </thead>
                        <tbody class="text-slate-300">
                            <tr>
                                <td class="py-2 pr-4 font-mono text-teal-400">specifyStringIndex</td>
                                <td class="py-2 pr-4 font-mono">boolean</td>
                                <td class="py-2 pr-4 font-mono">false</td>
                                <td class="py-2">
                                    When enabled, if the cursor is inside a string value, a <code class="font-mono">string</code> path entry is appended with the character index within that string.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- When get() returns null -->
            <div class="bg-slate-800 rounded-lg p-5">
                <h3 class="text-lg font-semibold text-white mb-2">
                    When does <code class="font-mono text-teal-400">.get()</code> return <code class="font-mono text-teal-400">null</code>?
                </h3>
                <ul class="list-disc list-inside text-slate-400 text-sm space-y-1">
                    <li>Cursor is before the root value (e.g., on leading whitespace)</li>
                    <li>Cursor is after the root value (e.g., on trailing whitespace)</li>
                    <li>Cursor is between values (e.g., on whitespace between object entries)</li>
                    <li>The JSON text is empty</li>
                </ul>
            </div>
        </div>
    </section>
</template>

<script setup lang="ts">
const getOverloads = `// Returns a JSONPath string
.get(cursorPosition: number): string | null

// Returns a raw path array
.get(cursorPosition: number, true): PathToCursor | null`;

const typesCode = `type PathEntry =
    | { type: 'object'; key: string }
    | { type: 'array'; index: number }
    | { type: 'string'; index: number };

type PathToCursor = PathEntry[];

type JsonCursorPathOptions = {
    specifyStringIndex: boolean;
};`;
</script>
