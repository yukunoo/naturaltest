// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  srcDir: 'app',
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/test-utils', '@nuxt/eslint', '@nuxt/fonts'],
  css: ['~/assets/css/main.css'],
  ui: {
    // theme: {
    //   colors: ['primary', 'error']
    // }
    colorMode: false
  },
  fonts: {
    defaults: {
      weights: [400],
      styles: ['normal', 'italic'],
      subsets: [
        'noto-sans-tc',
      ]
    },
  }
})