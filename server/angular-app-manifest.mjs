
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: 'https://majdap.github.io/resume.md/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/resume.md"
  },
  {
    "renderMode": 2,
    "preload": [
      "chunk-TDEIZXCJ.js"
    ],
    "route": "/resume.md/preview"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 3720, hash: '2f518d7085f0fa130be3a08843182d3292deed42701c43b3d0455c2882f13d80', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 1031, hash: '919f05174a181338fe906213ae1ab033e030b513405bae0c28a8baa958141dfb', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'preview/index.html': {size: 6253, hash: '3e9d8dd3d37654b059575c25ec40fc85c3b89b60429789abd70b4a0cee06f457', text: () => import('./assets-chunks/preview_index_html.mjs').then(m => m.default)},
    'index.html': {size: 11613, hash: '688d2635faa9e821d5ca8ef52f7aa554eaced74319e203b0de3fcaa60918359d', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-Q6CDKYC5.css': {size: 5950, hash: '9c0SbYMk/Xs', text: () => import('./assets-chunks/styles-Q6CDKYC5_css.mjs').then(m => m.default)}
  },
};
