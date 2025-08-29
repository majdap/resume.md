
export default {
  basePath: 'https://majdap.github.io/resume.md',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};
