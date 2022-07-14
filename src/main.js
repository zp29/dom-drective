import Vue from 'vue'
import App from './App.vue'
import DomDrective from './plugin.js'

Vue.config.productionTip = false

Vue.use(DomDrective)

new Vue({
  render: h => h(App),
}).$mount('#app')
