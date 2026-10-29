import {defineConfig} from 'cypress';
export default defineConfig({allowCypressEnv:false,viewportWidth:1440,viewportHeight:1000,e2e:{baseUrl:'http://127.0.0.1:5173',supportFile:false},video:false,screenshotOnRunFailure:true});
