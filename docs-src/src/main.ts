import { createApp } from 'vue';
import 'highlight.js/styles/tokyo-night-dark.css';
import hljs from 'highlight.js/lib/core';
import json from 'highlight.js/lib/languages/json';
import shell from 'highlight.js/lib/languages/shell';
import typescript from 'highlight.js/lib/languages/typescript';
import hljsVuePlugin from '@highlightjs/vue-plugin';
import '@/style.css';
import App from '@/App.vue';

hljs.registerLanguage('json', json);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('typescript', typescript);

createApp(App)
    .use(hljsVuePlugin)
    .mount('#app');
