const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  chainWebpack: config => {
    // GraphQL Loader
    config.module
      .rule('glsl')
      .test(/\.(glsl|vs|fs|vert|frag)$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
  }
})
