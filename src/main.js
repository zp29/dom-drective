import Vue from 'vue'
import App from './App.vue'
import DomDrective from 'dom-drective'

Vue.config.productionTip = false

Vue.use(DomDrective)

new Vue({
  render: h => h(App),
}).$mount('#app')
