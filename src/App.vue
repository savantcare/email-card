<template>
  <div>
    <b-card
      :border-variant="style == 1 ? 'info' : 'dark'"
      :header="style == 1 ? 'info' : 'dark'"
      :header-bg-variant="style == 1 ? 'info' : 'dark'"
      header-text-variant="white"
    >
      <template v-slot:header>
        <b-row align-h="between" :style="{height: style == 1 ? '50px' : '30px'}">
          <h5 v-if="style == 1" class="m-md-2">email Card</h5>
          <span style="font-weight: bold;" v-if="style == 2">email Card</span>
          <b-row class="mr-2">
            <b-button variant="primary" v-if="selected.length == 0" @click="showAddModal">Add</b-button>
            <b-button variant="danger" v-if="selected.length > 0" @click="multiDelete">Delete</b-button>

            <b-dropdown v-model="style" :text="`Style ${style}`" right class="ml-2">
              <b-dropdown-item @click="style=1" :active="style == 1">Style1</b-dropdown-item>
              <b-dropdown-divider></b-dropdown-divider>
              <b-dropdown-item @click="style=2" :active="style == 2">Style2</b-dropdown-item>
            </b-dropdown>
          </b-row>
        </b-row>
      </template>
      <b-card-text>
        <b-table
          ref="selectableTable"
          selectable
          bordered
          select-mode="multi"
          :items="items"
          @row-selected="onRowSelected"
          responsive="sm"
          :fields="fields"
          :small="style == 2"
        >
          <!-- Example scoped slot for select state illustrative purposes -->
          <template v-slot:cell(action)="item">
            <b-button
              :size="style == 1 ? '' :'sm'"
              variant="outline-primary"
              @click="openEditModal(item)"
            >Edit</b-button>
            <b-button
              variant="outline-danger"
              @click="deleteemail(item)"
              class="ml-2"
              :size="style == 1 ? '' : 'sm'"
            >Delete</b-button>
          </template>
        </b-table>
      </b-card-text>
    </b-card>

    <b-modal v-model="modalShow" id="modal-center" centered :title="modalTitle">
      <b-form @submit.stop.prevent>
        <label>Email  Id:</label>

        <b-form-input
          id="input-state"
          v-model="data.description"
          :state="validation"
          type="email"
          placeholder="Enter email id"
        ></b-form-input>
        <b-form-invalid-feedback :state="validation">{{data.errorMessage}}</b-form-invalid-feedback>
      </b-form>

      <template v-slot:modal-footer>
        <div class="float-right">
          <b-button size="sm" @click="modalShow=false">Close</b-button>
          <b-button
            class="ml-2"
            variant="primary"
            size="sm"
            @click="save"
            :disabled="!validation"
          >{{modalType == 1 ? "Save" : "Update"}}</b-button>
        </div>
      </template>
    </b-modal>
  </div>
</template>

<script>
import uniqid from "uniqid";
import store from "./store/index";
import axios from "axios";
const API_URL = "http://localhost:3000/emails";
export default {
  name: "emailCard",
  data() {
    return {
      fields: ["description", "createdAt", "action"],
      modalShow: false,
      data: {
        description: "",
        errorMessage: '',
      },
      selected: [],
      modalType: 1, // 1: add, 2: edit
      style: 1,
    };
  },
  computed: {
    validation() {
      return (this.validEmail(this.data.description))  ? true : false;
    },
    modalTitle() {
      return this.modalType == 1 ? "Add email" : "Edit email";
    },
    items() {
      return store.state.emails;
    }
  },
  mounted() {
    this.onEventListener();
    this.getemailsFromServer();
  },
  methods: {
    onRowSelected(items) {
      this.selected = items;
    },
    showAddModal() {
      this.modalShow = true;
      this.modalType = 1;
      this.data = { description: "" };
    },
    validEmail: function (email) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if(email.length === 0) {
        this.data.errorMessage = "emailid is required";
        return false;
      }
      else if(!re.test(email)) {
          this.data.errorMessage = "invalid email";
          return false;
      }
      else return true;

      //return re.test(email);
    },
    async save() {
      if (this.modalType == 1) {
        const today = new Date();
        this.data["createdAt"] = today.toDateString();
        this.data["id"] = uniqid();

        store.commit("addemail", this.data);
        localStorage.setItem("event_email_card", JSON.stringify(this.items));
        await axios.post(API_URL, this.data);
      } else {
        let newList = [];
        this.items.forEach(item => {
          if (item.id == this.data.id) {
            newList.push({
              id: this.data.id,
              description: this.data.description,
              createdAt: this.data.createdAt
            });
          } else {
            newList.push(item);
          }
        });
        store.commit("setemailList", newList);
        localStorage.setItem("event_email_card", JSON.stringify(newList));
        await axios.put(`${API_URL}/${this.data.id}`, this.data);
      }
      this.modalShow = false;
    },
    openEditModal(item) {
      this.data = {
        id: this.items[item.index]["id"],
        description: this.items[item.index]["description"],
        createdAt: this.items[item.index]["createdAt"]
      };
      this.modalShow = true;
      this.modalType = 2;
    },
    async deleteemail(item) {
      let newList = [];
      this.items.forEach((data, index) => {
        if (index != item.index) {
          newList.push(data);
        }
      });

      const data = this.items[item.index];
      await axios.delete(`${API_URL}/${data.id}`);

      store.commit("setemailList", newList);
      localStorage.setItem("event_email_card", JSON.stringify(newList));
    },
    multiDelete() {
      let newList = [];
      let index = 0;
      this.items.forEach(async item => {
        let isDeleted = false;
        this.selected.forEach(selectedItem => {
          if (item.id == selectedItem.id) {
            isDeleted = true;
          }
        });

        if (isDeleted) {
          await axios.delete(`${API_URL}/${item.id}`);
        } else {
          newList.push(item);
        }

        if (++index == this.items.length) {
          store.commit("setemailList", newList);
          localStorage.setItem("event_email_card", JSON.stringify(newList));
        }
      });
    },
    onEventListener() {
      setInterval(function() {
        const event_email_panel = localStorage.getItem(
          "event_email_panel"
        );
        if (event_email_panel != null) {
          const newList = JSON.parse(event_email_panel);
          store.commit("setemailList", newList);
          localStorage.removeItem("event_email_panel");
        }
      }, 100);
    },
    async getemailsFromServer() {
      const { data } = await axios.get(API_URL);

      store.commit("setemailList", data);
    }
  }
};
</script>

<style>
</style>
