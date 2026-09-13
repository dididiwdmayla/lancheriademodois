import { defineConfig } from 'tsup'
export default defineConfig([
  {entry:['pacote/contrato.ts'],format:['esm'],outExtension:()=>({js:'.js'}),dts:{compilerOptions:{incremental:false,baseUrl:'.',paths:{'@/temas':['./temas/index.ts'],'@/*':['./*']}}},clean:false,splitting:false,outDir:'dist',external:['react','react-dom'],target:'es2022',esbuildOptions(options){options.jsx='automatic'}},
  {entry:['pacote/client.tsx'],format:['esm'],outExtension:()=>({js:'.js'}),dts:{compilerOptions:{incremental:false,baseUrl:'.',paths:{'@/temas':['./temas/index.ts'],'@/*':['./*']}}},splitting:false,outDir:'dist',external:['react','react-dom'],target:'es2022',esbuildOptions(options){options.jsx='automatic'},banner:{js:'"use client";'}},
])
