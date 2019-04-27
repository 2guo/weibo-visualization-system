import Vue from 'vue'
import App from './App.vue'

import ElementUI from 'element-ui'
import locale from 'element-ui/lib/locale/lang/en'
import 'element-ui/lib/theme-chalk/index.css';
Vue.use(ElementUI, { locale })

import router from './router';
import axios from 'axios';
// import D3 from '@antv/f2'; // 测试 可能以后需要删除

import * as d3 from 'd3';
import G2 from '@antv/g2';

Vue.config.productionTip = false

Vue.prototype.$axios = axios;
Vue.prototype.$G2 = G2;
window.d3 = d3; // 把 d3 挂载到window对象上

new Vue({
  router,
  render: h => h(App),
}).$mount('#app')
