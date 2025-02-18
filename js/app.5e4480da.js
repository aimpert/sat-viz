(function(){"use strict";var e={2549:function(e,n,o){var t=o(5130),i=o(6768);function r(e,n,o,t,r,a){const l=(0,i.g2)("MainPage");return(0,i.uX)(),(0,i.Wv)(l,{msg:"Hello there!!!!"})}var a=o(4232);function l(e,n,o,t,r,l){return(0,i.uX)(),(0,i.CE)(i.FK,null,[n[0]||(n[0]=(0,i.eW)(" Stuff: ")),(0,i.Lk)("div",null,[(0,i.Lk)("ul",null,[((0,i.uX)(!0),(0,i.CE)(i.FK,null,(0,i.pI)(r.items,((e,n)=>((0,i.uX)(),(0,i.CE)("li",{key:n},(0,a.v_)(e),1)))),128))])])],64)}var s=o(4373),c={name:"MainPage",props:{msg:String},data(){return{items:[]}},mounted(){this.fetchItems()},methods:{async fetchItems(){try{const e=await s.A.get("http://34.218.224.225:8000/test",{headers:{"Access-Control-Allow-Origin":"*","Content-Type":"application/json"}});this.items=e.data}catch(e){console.error("Failed to fetch items:",e)}}}},u=o(1241);const m=(0,u.A)(c,[["render",l],["__scopeId","data-v-39208c8a"]]);var d=m,p={name:"App",components:{MainPage:d}};const h=(0,u.A)(p,[["render",r]]);var v=h,g=o(8776),w=o(8371),f=(o(5875),o(8068)),y=o(2951);o.g.THREE=g;const x=()=>({u_time:{value:0},u_mouse:{value:{x:0,y:0}},u_resolution:{value:{x:window.innerWidth*window.devicePixelRatio,y:window.innerHeight*window.devicePixelRatio}}}),C=(e,n,o,t,i=!1,r=x(),a=null)=>{const l=document.getElementById("container");l.appendChild(o.domElement),window.addEventListener("resize",(()=>{t.aspect=window.innerWidth/window.innerHeight,t.updateProjectionMatrix(),o.setSize(window.innerWidth,window.innerHeight),void 0!==r.u_resolution&&(r.u_resolution.value.x=window.innerWidth*window.devicePixelRatio,r.u_resolution.value.y=window.innerHeight*window.devicePixelRatio),"function"===typeof e.resize&&e.resize()}));const s=e=>{r.u_mouse.value.x=e.touches?e.touches[0].clientX:e.clientX,r.u_mouse.value.y=e.touches?e.touches[0].clientY:e.clientY};"ontouchstart"in window?window.addEventListener("touchmove",s):window.addEventListener("mousemove",s),void 0===e.updateScene&&(e.updateScene=(e,n)=>{}),Object.assign(e,{...e,container:l});const c=new w.zD7,u=()=>{i&&requestAnimationFrame(u);const l=c.getDelta(),s=c.getElapsedTime();r.u_time.value=s,e.updateScene(l,s),null===a?o.render(n,t):a.render()};e.initScene().then((()=>{const e=document.getElementById("veil");e.style.opacity=0;const n=document.getElementById("progress-bar");return n.style.opacity=0,!0})).then(u).then((()=>{o.info.reset(),console.log("Renderer info",o.info)})).catch((e=>{console.log(e)}))},D=(e={},n=e=>{})=>{const o=new g.WebGLRenderer(e);return o.setPixelRatio(window.devicePixelRatio),o.setSize(window.innerWidth,window.innerHeight),n(o),o},P=(e=45,n=.1,o=100,t={x:0,y:0,z:5},i={x:0,y:0,z:0},r=window.innerWidth/window.innerHeight)=>{const a=new w.ubm(e,r,n,o);return a.position.set(t.x,t.y,t.z),a.lookAt(i.x,i.y,i.z),a.updateProjectionMatrix(),a},M=async(e,n=200)=>new Promise((o=>{const t=document.getElementById("progress");t.style.width=200*e+"px",setTimeout(o,n)}));o.g.THREE=g;const S=async e=>{let n=new w.Tap;return new Promise((o=>{n.load(e,(e=>{o(e)}))}))};var T=o.p+"img/day.e9456e01.jpg",A=o.p+"img/specularClouds.59f5be82.jpg",b=o.p+"img/night.d0a68cf0.jpg",_=o.p+"img/starmap.356cc127.png",E="varying vec2 vUv;\nvarying vec3 vNormal;\nvarying vec3 vPosition;\n\nvoid main()\n{\n    // Position\n    vec4 modelPosition = modelMatrix * vec4(position, 1.0);\n    gl_Position = projectionMatrix * viewMatrix * modelPosition;\n\n    // Model normal\n    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;\n\n    // Varyings\n    vUv = uv;\n    vNormal = modelNormal;\n    vPosition = modelPosition.xyz;\n}",O="uniform sampler2D uDayTexture;\nuniform sampler2D uNightTexture;\nuniform sampler2D uSpecularCloudsTexture;\nuniform vec3 uSunDirection;\nuniform vec3 uAtmosphereDayColor;\nuniform vec3 uAtmosphereTwilightColor;\n\nvarying vec2 vUv;\nvarying vec3 vNormal;\nvarying vec3 vPosition;\n\nvoid main()\n{\n    vec3 viewDirection = normalize(vPosition - cameraPosition);\n    vec3 normal = normalize(vNormal);\n    vec3 color = vec3(0.0);\n\n    // Sun \n    \n    float sunOrientation = dot(uSunDirection, normal);\n    //color = vec3(sunOrientation);\n\n    // Day / night\n    float dayMix = pow(smoothstep(-0.1, 0.4, sunOrientation), 1.5);\n    vec3 dayColor = texture(uDayTexture, vUv).rgb;\n    vec3 nightColor = texture(uNightTexture, vUv).rgb;\n    color = mix(nightColor, dayColor, dayMix);\n\n    // Clouds\n    vec2 specularCloudsColor = texture(uSpecularCloudsTexture, vUv).rg;\n    \n    float cloudsMix = smoothstep(0.2, 1.0, specularCloudsColor.g);\n    cloudsMix *= dayMix;\n    color = mix(color, vec3(1.0), cloudsMix);\n\n    // Fresnel\n    float fresnel = dot(viewDirection, normal) + 1.0;\n    fresnel = pow(fresnel, 2.0);\n\n    // Atmosphere\n    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);\n    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);\n    \n    color = mix(color, atmosphereColor, fresnel * atmosphereDayMix);\n\n    // Specular\n    vec3 reflection = reflect(-uSunDirection, normal);\n    float specular = -dot(reflection, viewDirection);\n    specular = max(specular, 0.0);\n    specular = pow(specular, 16.0);\n    specular *= specularCloudsColor.r;\n    specular *= 0.25;\n\n    vec3 specularColor = mix(vec3(1.0), atmosphereColor, fresnel);\n    color += specular * specularColor;\n\n\n\n    // Final color\n    gl_FragColor = vec4(color, 1.0);\n    #include <tonemapping_fragment>\n    #include <colorspace_fragment>\n}",z="varying vec3 vNormal;\nvarying vec3 vPosition;\n\nvoid main()\n{\n    // Position\n    vec4 modelPosition = modelMatrix * vec4(position, 1.0);\n    gl_Position = projectionMatrix * viewMatrix * modelPosition;\n\n    // Model normal\n    vec3 modelNormal = (modelMatrix * vec4(normal, 0.0)).xyz;\n\n    // Varyings\n    vNormal = modelNormal;\n    vPosition = modelPosition.xyz;\n}",j="uniform vec3 uSunDirection;\nuniform vec3 uAtmosphereDayColor;\nuniform vec3 uAtmosphereTwilightColor;\n\nvarying vec3 vNormal;\nvarying vec3 vPosition;\n\nvoid main()\n{\n    vec3 viewDirection = normalize(vPosition - cameraPosition);\n    vec3 normal = normalize(vNormal);\n    vec3 color = vec3(0.0);\n\n    // Sun \n    float sunOrientation = dot(uSunDirection, normal);\n\n    // Atmosphere\n    float atmosphereDayMix = smoothstep(-0.5, 1.0, sunOrientation);\n    vec3 atmosphereColor = mix(uAtmosphereTwilightColor, uAtmosphereDayColor, atmosphereDayMix);\n    color += atmosphereColor;\n\n    // Alpha\n    float edgeAlpha = dot(viewDirection, normal);\n    edgeAlpha = smoothstep(0.0, 0.5, edgeAlpha);\n\n    float dayAlpha = smoothstep(-0.5, 0.0, sunOrientation);\n    float alpha = edgeAlpha * dayAlpha;\n\n    // Final color\n    gl_FragColor = vec4(color, alpha);\n    #include <tonemapping_fragment>\n    #include <colorspace_fragment>\n}";o.g.THREE=g,w.ppV.enabled=!0;let N=new w.Z58,F=D({antialias:!0},(e=>{e.outputColorSpace=w.er$})),$=P(45,1,1e3,{x:0,y:0,z:20}),k={async initScene(){this.controls=new y.N($,F.domElement),this.controls.enableDamping=!0;const e={atmosphereDayColor:"#00aaff",atmosphereTwilightColor:"#ff6600"},n=await S(T);n.colorSpace=w.er$,n.anisotropy=8,await M(.2);const o=await S(b);o.colorSpace=w.er$,o.anisotropy=8,await M(.4);const t=await S(A);t.anisotropy=8,await M(.6);const i=await S(_);i.colorSpace=w.er$,i.mapping=w.wfO,await M(.8),N.background=i,this.group=new w.YJl,this.group.rotation.z=-23.5/360*2*Math.PI;const r=new Date,a=(Date.UTC(r.getFullYear(),r.getMonth(),r.getDate())-Date.UTC(r.getFullYear(),0,0))/864e5,l=23.44*Math.cos(360/365*(a+10)*(Math.PI/180)),s=l*(Math.PI/180),c=r.getUTCHours()+r.getUTCMinutes()/60+r.getUTCSeconds()/3600,u=c/24*2*Math.PI;this.sunDirection=new w.Pq0(-Math.cos(u),Math.sin(s),-Math.sin(u)),this.sunDirection.normalize(),this.earthGeometry=new w.Gu$(5,128,128),this.earthMaterial=new w.BKk({vertexShader:E,fragmentShader:O,uniforms:{uDayTexture:new w.nc$(n),uNightTexture:new w.nc$(o),uSpecularCloudsTexture:new w.nc$(t),uSunDirection:new w.nc$(this.sunDirection),uAtmosphereDayColor:new w.nc$(new w.Q1f(e.atmosphereDayColor)),uAtmosphereTwilightColor:new w.nc$(new w.Q1f(e.atmosphereTwilightColor))}}),this.earth=new w.eaF(this.earthGeometry,this.earthMaterial),this.group.add(this.earth);const m=new w.BKk({vertexShader:z,fragmentShader:j,side:w.hsX,transparent:!0,uniforms:{uSunDirection:new w.nc$(this.sunDirection),uAtmosphereDayColor:new w.nc$(new w.Q1f(e.atmosphereDayColor)),uAtmosphereTwilightColor:new w.nc$(new w.Q1f(e.atmosphereTwilightColor))}}),d=new w.eaF(this.earthGeometry,m);d.scale.set(1.016,1.016,1.016),N.add(d),N.add(this.group),this.stats1=new f.A,this.stats1.showPanel(0),this.stats1.domElement.style.cssText="position:absolute;top:0px;left:0px;",this.container.appendChild(this.stats1.domElement),await M(1,100)},updateScene(e,n){this.controls.update(),this.stats1.update()}};C(k,N,F,$,!0,void 0,void 0),(0,t.Ef)(v).mount("#app")}},n={};function o(t){var i=n[t];if(void 0!==i)return i.exports;var r=n[t]={exports:{}};return e[t].call(r.exports,r,r.exports,o),r.exports}o.m=e,function(){var e=[];o.O=function(n,t,i,r){if(!t){var a=1/0;for(u=0;u<e.length;u++){t=e[u][0],i=e[u][1],r=e[u][2];for(var l=!0,s=0;s<t.length;s++)(!1&r||a>=r)&&Object.keys(o.O).every((function(e){return o.O[e](t[s])}))?t.splice(s--,1):(l=!1,r<a&&(a=r));if(l){e.splice(u--,1);var c=i();void 0!==c&&(n=c)}}return n}r=r||0;for(var u=e.length;u>0&&e[u-1][2]>r;u--)e[u]=e[u-1];e[u]=[t,i,r]}}(),function(){o.n=function(e){var n=e&&e.__esModule?function(){return e["default"]}:function(){return e};return o.d(n,{a:n}),n}}(),function(){o.d=function(e,n){for(var t in n)o.o(n,t)&&!o.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:n[t]})}}(),function(){o.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"===typeof window)return window}}()}(),function(){o.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)}}(),function(){o.r=function(e){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}}(),function(){o.p="/sat-viz/"}(),function(){var e={524:0};o.O.j=function(n){return 0===e[n]};var n=function(n,t){var i,r,a=t[0],l=t[1],s=t[2],c=0;if(a.some((function(n){return 0!==e[n]}))){for(i in l)o.o(l,i)&&(o.m[i]=l[i]);if(s)var u=s(o)}for(n&&n(t);c<a.length;c++)r=a[c],o.o(e,r)&&e[r]&&e[r][0](),e[r]=0;return o.O(u)},t=self["webpackChunkfrontend"]=self["webpackChunkfrontend"]||[];t.forEach(n.bind(null,0)),t.push=n.bind(null,t.push.bind(t))}();var t=o.O(void 0,[504],(function(){return o(2549)}));t=o.O(t)})();
//# sourceMappingURL=app.5e4480da.js.map