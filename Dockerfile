FROM node:12.18.3

WORKDIR /usr/customer-api
COPY . .
RUN npm install
RUN npm install typescript -g
RUN tsc
CMD ["node","./dist/index.js"]
EXPOSE 3030

