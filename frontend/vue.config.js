const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  publicPath: process.env.NODE_ENV === 'production' ? '/sat-viz/' : '/',
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
