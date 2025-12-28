import Conf from 'conf';

const config = new Conf({
  projectName: 'aic-cli',
  defaults: {
    apiKey: '',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
    language: 'zh'
  }
});

export const getConfig = (key) => {
  return config.get(key);
};

export const setConfig = (key, value) => {
  config.set(key, value);
};

export const getAllConfig = () => {
  return config.store;
};
