
const production = import.meta.env.PROD;

const localApi =  "http://localhost:3050" //"http://192.168.1.169:3000" //


export const API_URL = production
  ? `https://fabri.cat/`
  : localApi //+ "/" + company;


export const API_URL_BASE = production
  ? `https://fabri.cat`
  : localApi;

