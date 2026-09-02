/**
 * Um build de ficheiro ÚNICO, para o jogo poder ser aberto a partir de um link.
 *
 * O build normal parte o código em pedaços que o Pixi carrega quando precisa —
 * o que é correto para a app, porque só se descarrega o renderer que o
 * dispositivo vai mesmo usar. Mas uma página que tem de viver dentro de um só
 * ficheiro não pode ir buscar pedaços a lado nenhum, por isso aqui desliga-se a
 * divisão e mete-se tudo — JS, CSS e imagens — dentro do HTML.
 *
 * Custa uns kilobytes a mais no arranque e poupa uma instalação inteira, que é
 * a troca certa para "quero só ver o jogo".
 */
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2022',
    outDir: 'dist-single',
    // Tudo dentro do HTML: sem pedidos de rede, e portanto sem nada que possa
    // faltar quando a página é servida de outro sítio.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'app.js',
        assetFileNames: 'app.[ext]',
      },
    },
  },
})
