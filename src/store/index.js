import Vue from 'vue'
import Vuex from 'vuex'
import createPersistedState from "vuex-persistedstate";


Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    emails: []
  },
  mutations: {
    addemail(state, newData) {
      state.emails.push(newData)
    },
    setemailList(state, data) {
      state.emails = data
    }
  },
  actions: {
  },
  modules: {
  },
  plugins: [createPersistedState()]
})
