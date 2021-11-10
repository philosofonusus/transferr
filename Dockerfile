FROM node:16

WORKDIR /
COPY package*.json ./

RUN npm install

RUN npm audit fix

COPY . .

ENV PORT 5000

EXPOSE 500

CMD ["node", "index"]