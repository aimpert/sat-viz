<template>

<ThreeScene :items="items"/>

</template>

<script>
import axios from 'axios';
import ThreeScene from './ThreeScene.vue';

export default {
  name: 'MainPage',
  components: {
    ThreeScene
  },
  props: {
    msg: String
  },
  data() {
    return {
      items: [],
    };
  },
  mounted() {
    this.fetchItems();
  },
  methods: {
    async fetchItems() {
      try {
        const response = await axios.get(
          'http://127.0.0.1:8000/find_tle/25544',
          {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            }
          }
        );
        //const response = await axios.get('http://34.218.224.225:8000/test');
        console.log(response.data);
        this.items = response.data;
      }
      catch (error) {
        console.error("Failed to fetch items:", error);
      }
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
#container {
  width: 100%;
  height: 100%;
  display: block;
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>
